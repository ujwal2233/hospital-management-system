import { ApiProperty, ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AppointmentStatus } from '../../../common/enums';
import { CreateAppointmentDto } from './create-appointment.dto';

/** Reschedule / edit details (status changes go through /status). */
export class UpdateAppointmentDto extends PartialType(
  PickType(CreateAppointmentDto, ['scheduledAt', 'durationMinutes', 'type', 'reason'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  /** Reason recorded when postponing the appointment (optional free-text). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  postponeReason?: string;
}

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  /** Optional reason for cancellation or other status transitions. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancelReason?: string;
}
