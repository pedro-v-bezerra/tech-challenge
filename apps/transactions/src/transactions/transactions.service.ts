import { randomUUID } from 'node:crypto';

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  type EventEnvelope,
  Topics,
  type TransactionCreatedData,
  type TransactionStatus,
} from '@biud/contracts';

import { EventPublisher } from '../events/event-publisher';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';

type TransactionWithType = Prisma.TransactionGetPayload<{ include: { transferType: true } }>;

/** Formato de resposta (contrato de recuperação do enunciado). */
export interface TransactionResponse {
  transactionExternalId: string;
  transactionType: { name: string };
  transactionStatus: { name: string };
  value: number;
  createdAt: Date;
}

export interface PaginatedTransactions {
  items: TransactionResponse[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async create(dto: CreateTransactionDto): Promise<TransactionResponse> {
    const type = await this.prisma.transactionType.findUnique({
      where: { id: dto.transferTypeId },
    });
    if (!type) {
      throw new BadRequestException(`transferTypeId ${dto.transferTypeId} inexistente`);
    }

    // Nasce PENDING (default do schema); o antifraude decide o status depois, de forma assíncrona.
    const transaction = await this.prisma.transaction.create({
      data: {
        accountExternalIdDebit: dto.accountExternalIdDebit,
        accountExternalIdCredit: dto.accountExternalIdCredit,
        transferTypeId: dto.transferTypeId,
        value: new Prisma.Decimal(dto.value),
      },
      include: { transferType: true },
    });

    const event: EventEnvelope<TransactionCreatedData> = {
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      data: {
        transactionExternalId: transaction.transactionExternalId,
        value: dto.value,
        transferTypeId: transaction.transferTypeId,
      },
    };
    await this.eventPublisher.publish(Topics.TransactionCreated, event);

    return this.toResponse(transaction);
  }

  async findOne(transactionExternalId: string): Promise<TransactionResponse> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { transactionExternalId },
      include: { transferType: true },
    });
    if (!transaction) {
      throw new NotFoundException(`transação ${transactionExternalId} não encontrada`);
    }
    return this.toResponse(transaction);
  }

  async findMany(query: QueryTransactionsDto): Promise<PaginatedTransactions> {
    const { page, limit } = query;
    const where: Prisma.TransactionWhereInput = {
      status: query.status,
      transferTypeId: query.transferTypeId,
      createdAt:
        (query.from ?? query.to)
          ? {
              gte: query.from ? new Date(query.from) : undefined,
              lte: query.to ? new Date(query.to) : undefined,
            }
          : undefined,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        include: { transferType: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      items: items.map((transaction) => this.toResponse(transaction)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Aplica o resultado do antifraude. Idempotente: só transiciona quando o status ainda é
   * PENDING, então reprocessar o mesmo evento (entrega at-least-once) é inócuo.
   */
  async applyStatusUpdate(transactionExternalId: string, status: TransactionStatus): Promise<void> {
    await this.prisma.transaction.updateMany({
      where: { transactionExternalId, status: 'PENDING' },
      data: { status },
    });
  }

  private toResponse(transaction: TransactionWithType): TransactionResponse {
    return {
      transactionExternalId: transaction.transactionExternalId,
      transactionType: { name: transaction.transferType.name },
      transactionStatus: { name: transaction.status },
      value: transaction.value.toNumber(),
      createdAt: transaction.createdAt,
    };
  }
}
