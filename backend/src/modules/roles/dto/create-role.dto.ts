import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ALL_PERMISSIONS } from '../../../common/constants/permissions';

export class CreateRoleDto {
  @ApiProperty({ description: 'Role name, e.g. FRONT_DESK_LEAD' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[A-Z][A-Z0-9_]*$/, { message: 'name must be SCREAMING_SNAKE_CASE' })
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiProperty({ description: 'Permissions from the catalog (GET /roles/permissions)' })
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(ALL_PERMISSIONS, { each: true })
  permissions: string[];
}
