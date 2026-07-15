import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';

@ApiTags('patients')
@ApiBearerAuth()
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Permissions('patients:create')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePatientDto) {
    return this.patientsService.create(user, dto);
  }

  @Get()
  @Permissions('patients:read')
  findAll(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.patientsService.findAll(user, query);
  }

  @Get(':id')
  @Permissions('patients:read')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.patientsService.findOne(user, id);
  }

  @Patch(':id')
  @Permissions('patients:update')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(user, id, dto);
  }
}
