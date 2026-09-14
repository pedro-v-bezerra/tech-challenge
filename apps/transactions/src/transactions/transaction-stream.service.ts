import { Injectable } from '@nestjs/common';
import { type Observable, Subject } from 'rxjs';
import type { TransactionStatusUpdatedData } from '@biud/contracts';

/**
 * Fan-out em memória das mudanças de status. O consumidor de eventos publica aqui; o endpoint
 * SSE assina e repassa para os clientes conectados.
 *
 * Limitação: por ser em memória, vale para uma única instância. Com múltiplas instâncias, o
 * fan-out precisaria de um barramento compartilhado (ex.: Redis pub/sub) — ver resposta de escala.
 */
@Injectable()
export class TransactionStreamService {
  private readonly updates = new Subject<TransactionStatusUpdatedData>();

  publish(data: TransactionStatusUpdatedData): void {
    this.updates.next(data);
  }

  asObservable(): Observable<TransactionStatusUpdatedData> {
    return this.updates.asObservable();
  }
}
