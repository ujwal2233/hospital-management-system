import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ClaimStatus } from '../../../common/enums';

export class CreateProviderDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tpaCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactPerson?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactEmail?: string;
}

export class UpdateProviderDto extends PartialType(CreateProviderDto) {}

export class CreateClaimDto {
  @ApiProperty() @IsString() patientId: string;
  @ApiProperty() @IsString() invoiceId: string;
  @ApiProperty() @IsString() providerId: string;
  @ApiProperty() @IsString() policyNumber: string;
  @ApiProperty() @IsNumber() @Min(0) claimedAmount: number;
  @ApiPropertyOptional() @IsOptional() @IsString() remarks?: string;
}

export class UpdateClaimDto {
  @ApiPropertyOptional({ enum: ClaimStatus }) @IsOptional() @IsEnum(ClaimStatus) status?: ClaimStatus;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) approvedAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() remarks?: string;
}
