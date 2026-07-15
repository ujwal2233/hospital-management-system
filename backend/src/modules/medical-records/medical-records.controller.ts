import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { QueryMedicalRecordDto } from './dto/query-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { MedicalRecordsService } from './medical-records.service';

@ApiTags('medical-records')
@ApiBearerAuth()
@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Post()
  @Permissions('medical-records:create')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMedicalRecordDto) {
    return this.medicalRecordsService.create(user, dto);
  }

  @Get()
  @Permissions('medical-records:read')
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryMedicalRecordDto) {
    return this.medicalRecordsService.findAll(user, query);
  }

  @Get(':id')
  @Permissions('medical-records:read')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.medicalRecordsService.findOne(user, id);
  }

  @Patch(':id')
  @Permissions('medical-records:update')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMedicalRecordDto,
  ) {
    return this.medicalRecordsService.update(user, id, dto);
  }
}
