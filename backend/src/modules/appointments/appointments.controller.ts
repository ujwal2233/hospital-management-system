import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';
import { UpdateAppointmentDto, UpdateAppointmentStatusDto } from './dto/update-appointment.dto';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Permissions('appointments:create')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(user, dto);
  }

  @Get()
  @Permissions('appointments:read')
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryAppointmentDto) {
    return this.appointmentsService.findAll(user, query);
  }

  @Get('queue/:doctorId')
  @Permissions('appointments:read')
  queue(@CurrentUser() user: AuthUser, @Param('doctorId') doctorId: string) {
    return this.appointmentsService.queue(user, doctorId);
  }

  @Get(':id')
  @Permissions('appointments:read')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.appointmentsService.findOne(user, id);
  }

  @Patch(':id')
  @Permissions('appointments:update')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(user, id, dto);
  }

  @Patch(':id/status')
  @Permissions('appointments:update')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatus(user, id, dto);
  }
}
