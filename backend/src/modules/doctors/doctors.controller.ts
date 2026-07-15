import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { QueryDoctorDto } from './dto/query-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@ApiTags('doctors')
@ApiBearerAuth()
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @Permissions('doctors:create')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDoctorDto) {
    return this.doctorsService.create(user, dto);
  }

  @Get()
  @Permissions('doctors:read')
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryDoctorDto) {
    return this.doctorsService.findAll(user, query);
  }

  @Get(':id')
  @Permissions('doctors:read')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.doctorsService.findOne(user, id);
  }

  @Patch(':id')
  @Permissions('doctors:update')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    return this.doctorsService.update(user, id, dto);
  }
}
