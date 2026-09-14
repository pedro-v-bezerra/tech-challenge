import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Topics, TransactionStatus } from '@biud/contracts';

import { EventPublisher } from '../events/event-publisher';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: {
    transactionType: { findUnique: jest.Mock };
    transaction: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let publisher: { publish: jest.Mock };

  const buildRow = (overrides: Record<string, unknown> = {}) => ({
    transactionExternalId: 'ext-1',
    accountExternalIdDebit: 'debit',
    accountExternalIdCredit: 'credit',
    transferTypeId: 1,
    status: 'PENDING',
    value: new Prisma.Decimal(120),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    transferType: { id: 1, name: 'TRANSFER' },
    ...overrides,
  });

  const createDto = {
    accountExternalIdDebit: '3a1e6f7a-0f2c-4c1e-9d4a-6b0c2a9f1111',
    accountExternalIdCredit: '9c2b4d5e-1a3f-4b6c-8e7d-5f0a1b2c2222',
    transferTypeId: 1,
    value: 120,
  };

  beforeEach(() => {
    prisma = {
      transactionType: { findUnique: jest.fn() },
      transaction: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    publisher = { publish: jest.fn().mockResolvedValue(undefined) };
    service = new TransactionsService(
      prisma as unknown as PrismaService,
      publisher as unknown as EventPublisher,
    );
  });

  describe('create', () => {
    it('grava com status PENDING e publica transaction.created', async () => {
      prisma.transactionType.findUnique.mockResolvedValue({ id: 1, name: 'TRANSFER' });
      prisma.transaction.create.mockResolvedValue(buildRow());

      const result = await service.create(createDto);

      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ transferTypeId: 1 }) }),
      );
      expect(publisher.publish).toHaveBeenCalledWith(
        Topics.TransactionCreated,
        expect.objectContaining({
          data: expect.objectContaining({ transactionExternalId: 'ext-1', value: 120 }),
        }),
      );
      expect(result.transactionStatus.name).toBe('PENDING');
      expect(result.value).toBe(120);
    });

    it('rejeita transferTypeId inexistente e não publica evento', async () => {
      prisma.transactionType.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.transaction.create).not.toHaveBeenCalled();
      expect(publisher.publish).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('retorna a transação no formato do contrato', async () => {
      prisma.transaction.findUnique.mockResolvedValue(buildRow({ status: 'APPROVED' }));

      const result = await service.findOne('ext-1');

      expect(result).toEqual({
        transactionExternalId: 'ext-1',
        transactionType: { name: 'TRANSFER' },
        transactionStatus: { name: 'APPROVED' },
        value: 120,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });
    });

    it('lança 404 quando a transação não existe', async () => {
      prisma.transaction.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findMany', () => {
    it('aplica paginação e devolve os metadados', async () => {
      prisma.$transaction.mockResolvedValue([[buildRow()], 1]);

      const result = await service.findMany({
        status: TransactionStatus.Pending,
        page: 2,
        limit: 10,
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result.items).toHaveLength(1);
      expect(result.meta).toEqual({ page: 2, limit: 10, total: 1, totalPages: 1 });
    });
  });
});
