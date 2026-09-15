# Registro de decisões

Cada decisão estruturante do projeto: o que foi decidido, que alternativas foram consideradas
e por quê. Escritas incrementalmente, conforme o projeto nasce.

## Estrutura do projeto

**Decisão:** Monorepo com pnpm workspaces + Turborepo — serviços em `apps/*`
(transactions, anti-fraud, web) e código compartilhado em `packages/*` (contracts).

**Alternativas consideradas:** polyrepo (1 repo por serviço); monorepo só com `pnpm -r`
sem Turborepo; Nx.

**Por quê:** transactions e anti-fraud compartilham o contrato dos eventos Kafka — no monorepo
o `packages/contracts` é importado direto, sem publicar pacote nem duplicar tipos. Turborepo dá
o quality gate único com cache/paralelismo sem o peso do Nx.

## Versões da toolchain (TypeScript e ESLint)

**Decisão:** Fixar TypeScript 5.x e ESLint 9.x, em vez dos majors mais novos disponíveis
(TS 7, ESLint 10).

**Alternativas consideradas:** adotar TS 7 (compilador nativo em Go) + ESLint 10 — as versões
mais recentes no momento do setup.

**Por quê:** o `typescript-eslint` declara suporte a TypeScript `>=4.8.4 <6.1.0`, e
NestJS/Next/ts-jest ainda miram TS 5.x — TS 7 ficaria fora da faixa suportada e brigaria com a
toolchain. Priorizei estabilidade e CI verde sobre estar na ponta.

## Formato dos eventos

**Decisão:** Envelope `{ eventId, occurredAt, data }` para os dois eventos, com os tipos em
`packages/contracts` importados por quem publica e por quem consome.

**Alternativas consideradas:** payload "cru" (apenas os campos de domínio), sem envelope.

**Por quê:** `eventId` habilita idempotência no consumo e `occurredAt` dá rastreio/debug, a
custo baixo. Tipos compartilhados no contracts impedem que produtor e consumidor divirjam.

## Modelagem de dados

**Decisão:** PK e identificador público único = `transactionExternalId` (UUID); `status` como
enum do banco (PENDING/APPROVED/REJECTED); tipo de transferência como tabela de referência
(`TransactionType`) semeada; `value` como `Decimal(18,2)`.

**Alternativas consideradas:** id interno separado do externo; tipo de transferência como enum;
`value` como float ou inteiro de centavos.

**Por quê:** o identificador externo já é UUID (não sequencial), então uma PK única basta — sem
expor id interno. Status é domínio fechado (enum type-safe); tipo é extensível sem migration de
código (tabela). `Decimal` evita erro de arredondamento em valores monetários.

## Versão do Prisma

**Decisão:** Fixar Prisma 6.x.

**Alternativas consideradas:** Prisma 7 (major mais novo).

**Por quê:** o Prisma 7 removeu `url` do schema e passou a exigir `prisma.config.ts` + driver
adapters — muita mudança de configuração recém-lançada. O Prisma 6 mantém o modelo clássico
(`url = env(...)`, `new PrismaClient()`), maduro e documentado. Mesma priorização de
estabilidade adotada para TypeScript e ESLint.

## Banco de dados só no serviço de transações

**Decisão:** Apenas `transactions` acessa o Postgres (o Prisma vive nele); `anti-fraud` é
stateless.

**Alternativas consideradas:** banco compartilhado entre os dois serviços.

**Por quê:** o antifraude só aplica uma regra sobre o payload do evento e responde por outro
evento — não precisa de estado. Menos acoplamento, e ele escala sem tocar no banco.

## Versão do NestJS

**Decisão:** Fixar NestJS 11.x.

**Alternativas consideradas:** NestJS 12 (major mais novo).

**Por quê:** o NestJS 12 passou a ser distribuído como ESM, o que quebra o setup CommonJS
(Jest/ts-jest via `require`, e o próprio `node dist/main.js`). O Nest 11 é CommonJS, maduro e
alinhado com todo o ferramental. Mesma priorização de estabilidade adotada para as outras deps.

## Publicação de eventos atrás de uma abstração

**Decisão:** O serviço publica eventos por uma abstração `EventPublisher` (classe abstrata +
token de injeção), não pelo Kafka diretamente. A implementação atual é um stub que loga; a de
Kafka a substitui depois, sem tocar no serviço.

**Alternativas consideradas:** o serviço falar com o cliente Kafka diretamente.

**Por quê:** desacopla a regra de negócio do transporte — dá para testar "publicou o evento
certo" com um mock, sem broker, e permite evoluir a publicação (retry, batching) num só lugar.

## Paginação da listagem

**Decisão:** Paginação por offset (`page` + `limit`), retornando `items` + `meta` com `page`,
`limit`, `total` e `totalPages`.

**Alternativas consideradas:** paginação por cursor (keyset).

**Por quê:** o consumidor é o dashboard, que precisa de contagem total e navegação por número
de página — offset entrega isso de forma simples. Cursor é mais eficiente em páginas profundas
e fica registrado como o caminho de escala (ver resposta de escala), quando o volume justificar.

## Transporte de eventos (Kafka)

**Decisão:** `@nestjs/microservices` com transporte Kafka (kafkajs). Eventos são fire-and-forget:
o produtor usa `ClientKafka.emit`; o consumidor usa `@EventPattern`. O `anti-fraud` é um
microservice puro (sem HTTP).

**Alternativas consideradas:** usar kafkajs "cru" sem a camada do Nest; usar request-reply
(`@MessagePattern`) em vez de eventos.

**Por quê:** o fluxo é assíncrono e unidirecional — não há resposta a aguardar, então
`emit`/`@EventPattern` modela melhor que request-reply. A camada do Nest integra DI e ciclo de
vida e reduz boilerplate.

## Tratamento de falha na mensageria

**Decisão:** Entrega **at-least-once** — o consumidor só confirma o offset após processar; em
caso de erro, a mensagem é reprocessada. A atualização de status é **idempotente** (transição
apenas de `PENDING` para um estado final), então reprocessar é inócuo. **DLQ** para mensagens
"venenosas" fica documentada como evolução.

**Alternativas consideradas:** at-most-once (confirmar antes de processar); implementar DLQ agora.

**Por quê:** perder um evento de status é pior que reprocessá-lo; at-least-once + idempotência
dá o equilíbrio certo. DLQ tem custo de implementação alto para o prazo e só agrega quando há
mensagens que falham de forma determinística — documentada para esse cenário.

## Criação de tópicos

**Decisão:** Os tópicos são garantidos no startup do serviço (kafkajs Admin, idempotente), em
vez de depender do auto-create do broker.

**Alternativas consideradas:** auto-create do broker; criação manual por infraestrutura.

**Por quê:** o consumidor sobe antes da primeira publicação, e assinar um tópico inexistente
falha (`UNKNOWN_TOPIC_OR_PARTITION`). Garantir no startup torna a subida determinística ("sobe
sem perguntar nada"), sem depender de configuração específica do broker.

## Atualização de status no serviço de transações

**Decisão:** O `transactions` é um app híbrido (HTTP + consumidor Kafka): consome
`transaction.status.updated` e aplica a transição no banco.

**Alternativas consideradas:** um serviço consumidor separado só para atualizar o status.

**Por quê:** os dados e o modelo Prisma já vivem no `transactions`; consumir ali mantém a escrita
do status num único dono, sem duplicar acesso ao banco. A transição é idempotente (só muda quando
ainda está `PENDING`), cobrindo o reprocessamento da entrega at-least-once.

## Atualização de status na interface (SSE)

**Decisão:** O `transactions` expõe `GET /transactions/stream` (SSE) que empurra cada mudança de
status (`{ transactionExternalId, status }`). O dashboard abre um `EventSource` e atualiza a linha
correspondente, sem recarregar.

**Alternativas consideradas:** polling periódico enquanto houver transação pendente na tela;
WebSocket.

**Por quê:** o fluxo é unidirecional (servidor → cliente); o SSE cobre isso com uma conexão HTTP
simples e reconexão automática no browser, sem o canal bidirecional (e o estado) que o WebSocket
exigiria, e sem o desperdício de requisições e a latência do polling. Empurrar o próprio payload
do update deixa o front atualizar a linha na hora. Limitação: o fan-out é em memória (instância
única) — multi-instância pediria Redis pub/sub (ver resposta de escala).

## Dashboard (frontend)

**Decisão:** Next.js (App Router) + Tailwind; TanStack Query para data-fetching (cache e estados
de carregando/erro/vazio); react-hook-form + zod no formulário de criação; testes de tela com
Vitest + Testing Library (consulta por papel acessível).

**Alternativas consideradas:** fetch/SWR no lugar do TanStack Query; validação manual no
formulário; Jest no lugar do Vitest.

**Por quê:** TanStack Query entrega cache, revalidação e os estados de UI prontos — e casa com o
SSE, que atualiza o cache. RHF + zod dão validação declarativa com um schema que também tipa o
formulário. Vitest é rápido e alinhado ao ecossistema Vite para testes de componente.

## Reconciliação do cache no realtime

**Decisão:** Ao receber `status.updated` pelo SSE, o dashboard faz patch direto no cache do
TanStack Query (linha da listagem e detalhe), em vez de invalidar a query e refazer o fetch.

**Alternativas consideradas:** `invalidateQueries` (refetch a cada evento).

**Por quê:** o evento já carrega o estado final (`transactionExternalId` + `status`), então não há
informação a buscar no servidor; o patch reflete a mudança na hora e evita uma ida de rede por
evento (relevante sob volume). Invalidar seria mais simples e sempre consistente com o backend,
mas gera refetch e um piscar de loading — fica como saída caso o payload do evento cresça ou passe
a divergir do modelo de leitura.

## Criação e detalhe em modal (com rota preservada)

**Decisão:** Criação e detalhe abrem em modal a partir da listagem (estado no cliente). O form e o
detalhe ficam em componentes reutilizáveis, montados tanto no modal quanto nas rotas
`/transactions/new` e `/transactions/[id]`, que seguem existindo.

**Alternativas consideradas:** telas de página cheia (sem modal); modal via intercepting/parallel
routes do Next; modal puro sem rota.

**Por quê:** o modal mantém o usuário no contexto da listagem (mais fluido para criar e conferir),
enquanto manter as rotas preserva link direto e refresh — sem duplicar UI, já que ambos consomem
os mesmos componentes. Intercepting routes dariam URL sincronizada com o modal, mas com bem mais
complexidade do que o ganho justifica aqui.

## Escala (alto volume de leituras e escritas)

Não é uma decisão tomada no código, e sim como o desenho evolui sob carga — os ganchos já foram
deixados prontos nas decisões acima.

**Escrita:** o caminho de criação é enxuto (`INSERT` + publicação do evento); a avaliação de fraude
é assíncrona, fora do request. O Kafka desacopla `transactions` de `anti-fraud`, então picos de
criação viram lag no consumidor, não erro no request. Sob volume: particionar `transaction.created`
por `transactionExternalId` (paralelismo entre partições preservando a ordem por transação) e
escalar o consumer group pelo número de partições; producer idempotente/em batch conforme a taxa.

**Leitura (o dashboard é read-heavy):** índices nos campos de filtro (`status`, `transferTypeId`,
`createdAt`) já estão no schema. Migrar a listagem de offset para cursor (keyset) em páginas
profundas (ver [Paginação da listagem]); réplicas de leitura e cache das queries quentes (ex.: os
contadores do resumo); se necessário, CQRS com um read model denormalizado.

**Tempo real e horizontal:** serviços stateless atrás de load balancer. O SSE em múltiplas
instâncias exige um barramento compartilhado — Redis pub/sub — fechando a limitação do fan-out em
memória (ver [Atualização de status na interface (SSE)]); somar backpressure e limite de conexões.

**Resiliência:** at-least-once + idempotência (já implementados) sustentam o reprocessamento;
DLQ para mensagens venenosas quando surgirem falhas determinísticas (ver [Tratamento de falha na
mensageria]).
