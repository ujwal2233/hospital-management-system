import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PrescriptionItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  medicine: string;

  @ApiProperty({ example: '500mg' })
  @IsString()
  @IsNotEmpty()
  dosage: string;

  @ApiProperty({ example: '1-0-1' })
  @IsString()
  @IsNotEmpty()
  frequency: string;

  @ApiProperty({ minimum: 1, maximum: 365 })
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays: number;

  @ApiPropertyOptional({ example: 'After food' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  instructions?: string;
}

export class CreatePrescriptionDto {
  @ApiProperty()
  @IsMongoId()
  patientId: string;

  @ApiProperty()
  @IsMongoId()
  doctorId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  recordId?: string;

  @ApiProperty({ type: [PrescriptionItemDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items: PrescriptionItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
