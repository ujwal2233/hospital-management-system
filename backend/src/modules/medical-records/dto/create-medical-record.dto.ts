import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class VitalsDto {
  @IsOptional() @IsNumber() temperatureC?: number;
  @IsOptional() @IsNumber() pulse?: number;
  @IsOptional() @IsNumber() bpSystolic?: number;
  @IsOptional() @IsNumber() bpDiastolic?: number;
  @IsOptional() @IsNumber() respiratoryRate?: number;
  @IsOptional() @IsNumber() spo2?: number;
  @IsOptional() @IsNumber() weightKg?: number;
  @IsOptional() @IsNumber() heightCm?: number;
}

class DiagnosisDto {
  @ApiPropertyOptional({ description: 'ICD-10 code' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  description: string;
}

export class CreateMedicalRecordDto {
  @ApiProperty()
  @IsMongoId()
  patientId: string;

  @ApiProperty()
  @IsMongoId()
  doctorId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  appointmentId?: string;

  @ApiPropertyOptional({ type: VitalsDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => VitalsDto)
  vitals?: VitalsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  chiefComplaint?: string;

  @ApiPropertyOptional({ type: [DiagnosisDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosisDto)
  diagnoses?: DiagnosisDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  followUpDate?: Date;
}
