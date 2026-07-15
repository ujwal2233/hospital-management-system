import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreatePharmacyItemDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() genericName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() manufacturer?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiProperty() @IsString() unit: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) stockQty?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) reorderLevel?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) unitPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() batchNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiryDate?: string;
}

export class UpdatePharmacyItemDto extends PartialType(CreatePharmacyItemDto) {}

export class DispenseItemDto {
  @ApiProperty() @IsString() itemId: string;
  @ApiProperty() @IsNumber() @Min(1) quantity: number;
}

export class DispenseDto {
  @ApiProperty() @IsString() patientId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() prescriptionId?: string;
  @ApiProperty({ type: [DispenseItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DispenseItemDto)
  items: DispenseItemDto[];

  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
