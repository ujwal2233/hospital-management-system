import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { TransactionType } from '../../../common/enums';

export class CreateInventoryItemDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sku?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiProperty() @IsString() unit: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) currentQty?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) reorderLevel?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) unitCost?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
}

export class UpdateInventoryItemDto extends PartialType(CreateInventoryItemDto) {}

export class RecordTransactionDto {
  @ApiProperty() @IsString() itemId: string;
  @ApiProperty({ enum: TransactionType }) @IsEnum(TransactionType) type: TransactionType;
  @ApiProperty() @IsNumber() @Min(1) quantity: number;
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
}
