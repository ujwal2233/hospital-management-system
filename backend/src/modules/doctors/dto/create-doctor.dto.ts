import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class ScheduleSlotDto {
  @ApiProperty({ minimum: 0, maximum: 6, description: '0 = Sunday' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '09:00' })
  @Matches(TIME_REGEX, { message: 'startTime must be HH:mm' })
  startTime: string;

  @ApiProperty({ example: '13:00' })
  @Matches(TIME_REGEX, { message: 'endTime must be HH:mm' })
  endTime: string;
}

export class CreateDoctorDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  specialization: string;

  @ApiProperty()
  @IsMongoId()
  departmentId: string;

  @ApiProperty({ description: 'Medical council registration number' })
  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  qualifications?: string[];

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  consultationFee: number;

  @ApiPropertyOptional({ type: [ScheduleSlotDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleSlotDto)
  schedule?: ScheduleSlotDto[];

  @ApiPropertyOptional({ description: 'Link to a login user account' })
  @IsOptional()
  @IsMongoId()
  userId?: string;
}
