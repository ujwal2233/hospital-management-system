import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PrescriptionStatus } from '../schemas/prescription.schema';

export class UpdatePrescriptionDto {
  @ApiPropertyOptional({ enum: PrescriptionStatus })
  @IsOptional()
  @IsEnum(PrescriptionStatus)
  status?: PrescriptionStatus;
}
