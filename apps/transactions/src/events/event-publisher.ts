import type { EventEnvelope } from '@biud/contracts';

/**
 * Abstração de publicação de eventos. O serviço depende disto, nunca do Kafka diretamente —
 * o que mantém a regra de negócio testável sem broker e permite trocar a implementação
 * (hoje um stub em log; a de Kafka entra depois, sem tocar no serviço). Também é o token de
 * injeção do Nest.
 */
export abstract class EventPublisher {
  abstract publish<TData>(topic: string, event: EventEnvelope<TData>): Promise<void>;
}
