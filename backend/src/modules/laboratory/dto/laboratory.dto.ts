import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { LabOrderStatus } from '../../../common/enums';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class LabResultValueDto {
  @ApiProperty() @IsString() parameter: string;
  @ApiProperty() @IsString() value: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unit?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referenceRange?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() flag?: string;
}

export class CreateLabOrderDto {
  @ApiProperty() @IsString() patientId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() appointmentId?: string;
  @ApiProperty() @IsString() testName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() testCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateLabOrderDto extends PartialType(CreateLabOrderDto) {
  @ApiPropertyOptional({ enum: LabOrderStatus })
  @IsOptional()
  @IsEnum(LabOrderStatus)
  status?: LabOrderStatus;
}

export class QueryLabOrderDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  patientId?: string;

  @ApiPropertyOptional({ enum: LabOrderStatus })
  @IsOptional()
  @IsEnum(LabOrderStatus)
  status?: LabOrderStatus;
}

export class AddLabResultsDto {
  @ApiProperty({ type: [LabResultValueDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabResultValueDto)
  results: LabResultValueDto[];

  @ApiPropertyOptional() @IsOptional() @IsString() reportUrl?: string;
}
