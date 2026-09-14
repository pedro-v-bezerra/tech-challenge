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
