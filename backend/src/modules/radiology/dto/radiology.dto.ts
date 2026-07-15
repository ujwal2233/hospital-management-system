import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { RadiologyOrderStatus } from '../../../common/enums';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CreateRadiologyOrderDto {
  @ApiProperty() @IsString() patientId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() appointmentId?: string;
  @ApiProperty() @IsString() modality: string;
  @ApiProperty() @IsString() bodyPart: string;
  @ApiPropertyOptional() @IsOptional() @IsString() clinicalIndication?: string;
}

export class UpdateRadiologyOrderDto extends PartialType(CreateRadiologyOrderDto) {
  @ApiPropertyOptional({ enum: RadiologyOrderStatus })
  @IsOptional()
  @IsEnum(RadiologyOrderStatus)
  status?: RadiologyOrderStatus;
}

export class QueryRadiologyOrderDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  patientId?: string;

  @ApiPropertyOptional({ enum: RadiologyOrderStatus })
  @IsOptional()
  @IsEnum(RadiologyOrderStatus)
  status?: RadiologyOrderStatus;
}

export class AddRadiologyReportDto {
  @ApiProperty() @IsString() findings: string;
  @ApiProperty() @IsString() impression: string;
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string;
}
