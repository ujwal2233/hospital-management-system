import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxDate,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { BloodGroup, Gender } from '../../../common/enums';

class EmergencyContactDto {
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsOptional() @Matches(/^[6-9]\d{9}$/, { message: 'emergency phone must be a valid 10-digit Indian mobile number' })
  phone?: string;
  @IsOptional() @IsString() @MaxLength(50) relation?: string;
}

export class CreatePatientDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  lastName: string;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @MaxDate(new Date(), { message: 'dob cannot be in the future' })
  dob?: Date;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty()
  @Matches(/^[6-9]\d{9}$/, { message: 'phone must be a valid 10-digit Indian mobile number' })
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: BloodGroup })
  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;

  @ApiPropertyOptional({ description: 'ABHA number (ABDM)' })
  @IsOptional()
  @Matches(/^\d{14}$/, { message: 'abhaId must be a 14-digit ABHA number' })
  abhaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({ type: EmergencyContactDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;
}
