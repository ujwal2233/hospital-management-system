import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AddRadiologyReportDto, CreateRadiologyOrderDto, QueryRadiologyOrderDto, UpdateRadiologyOrderDto } from './dto/radiology.dto';
import { RadiologyService } from './radiology.service';

@ApiTags('radiology')
@ApiBearerAuth()
@Controller('radiology')
export class RadiologyController {
  constructor(private readonly svc: RadiologyService) {}

  @Post()
  @Permissions('radiology:create')
  @ApiOperation({ summary: 'Create radiology order' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRadiologyOrderDto) {
    return this.svc.create(user, dto);
  }

  @Get()
  @Permissions('radiology:read')
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryRadiologyOrderDto) {
    return this.svc.findAll(user, query);
  }

  @Get(':id')
  @Permissions('radiology:read')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.findOne(user, id);
  }

  @Patch(':id')
  @Permissions('radiology:update')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateRadiologyOrderDto) {
    return this.svc.update(user, id, dto);
  }

  @Post(':id/report')
  @Permissions('radiology:update')
  @ApiOperation({ summary: 'Add radiology report' })
  addReport(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AddRadiologyReportDto) {
    return this.svc.addReport(user, id, dto);
  }
}
