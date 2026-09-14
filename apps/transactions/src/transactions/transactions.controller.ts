import { Body, Controller, Get, type MessageEvent, Param, Post, Query, Sse } from '@nestjs/common';
import { map, type Observable } from 'rxjs';

import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { TransactionStreamService } from './transaction-stream.service';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly stream: TransactionStreamService,
  ) {}

  @Post()
  create(@Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(dto);
  }

  // Declarado antes de `:transactionExternalId` para a rota /stream não cair no parâmetro.
  @Sse('stream')
  streamStatus(): Observable<MessageEvent> {
    return this.stream.asObservable().pipe(map((data) => ({ data })));
  }

  @Get(':transactionExternalId')
  findOne(@Param('transactionExternalId') transactionExternalId: string) {
    return this.transactionsService.findOne(transactionExternalId);
  }

  @Get()
  findMany(@Query() query: QueryTransactionsDto) {
    return this.transactionsService.findMany(query);
  }
}
