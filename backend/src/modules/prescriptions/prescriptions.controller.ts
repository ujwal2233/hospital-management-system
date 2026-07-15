import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { QueryMedicalRecordDto } from '../medical-records/dto/query-medical-record.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { PrescriptionsService } from './prescriptions.service';

@ApiTags('prescriptions')
@ApiBearerAuth()
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @Permissions('prescriptions:create')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePrescriptionDto) {
    return this.prescriptionsService.create(user, dto);
  }

  @Get()
  @Permissions('prescriptions:read')
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryMedicalRecordDto) {
    return this.prescriptionsService.findAll(user, query);
  }

  @Get(':id')
  @Permissions('prescriptions:read')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.prescriptionsService.findOne(user, id);
  }

  @Patch(':id')
  @Permissions('prescriptions:update')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePrescriptionDto,
  ) {
    return this.prescriptionsService.update(user, id, dto);
  }
}
