import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AppointmentType } from '../../../common/enums';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsMongoId()
  patientId: string;

  @ApiProperty()
  @IsMongoId()
  doctorId: string;

  @ApiProperty({ type: Date })
  @Type(() => Date)
  @IsDate()
  scheduledAt: Date;

  @ApiPropertyOptional({ default: 15, minimum: 5, maximum: 240 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(240)
  durationMinutes?: number = 15;

  @ApiPropertyOptional({ enum: AppointmentType, default: AppointmentType.OPD })
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
