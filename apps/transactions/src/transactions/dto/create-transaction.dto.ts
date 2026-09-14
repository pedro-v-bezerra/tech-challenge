import { IsInt, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreateTransactionDto {
  @IsUUID()
  accountExternalIdDebit!: string;

  @IsUUID()
  accountExternalIdCredit!: string;

  @IsInt()
  @IsPositive()
  transferTypeId!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  value!: number;
}
