/**
 * Nomes dos tópicos Kafka. Definidos num único lugar e importados por quem publica e por quem
 * consome, garantindo que produtor e consumidor nunca divirjam.
 */
export const Topics = {
  TransactionCreated: 'transaction.created',
  TransactionStatusUpdated: 'transaction.status.updated',
} as const;

export type Topic = (typeof Topics)[keyof typeof Topics];
