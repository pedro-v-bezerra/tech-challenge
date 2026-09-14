import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsISO8601, IsOptional, IsPositive, Max, Min } from 'class-validator';
import { TransactionStatus } from '@biud/contracts';

export class QueryTransactionsDto {
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  transferTypeId?: number;

  /** Início do período (createdAt >=), ISO-8601. */
  @IsOptional()
  @IsISO8601()
  from?: string;

  /** Fim do período (createdAt <=), ISO-8601. */
  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
