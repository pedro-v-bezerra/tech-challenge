import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(dto);
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
