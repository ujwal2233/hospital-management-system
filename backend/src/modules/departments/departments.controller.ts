import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@ApiTags('departments')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Permissions('departments:create')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(user, dto);
  }

  @Get()
  @Permissions('departments:read')
  findAll(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.departmentsService.findAll(user, query);
  }

  @Get(':id')
  @Permissions('departments:read')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.departmentsService.findOne(user, id);
  }

  @Patch(':id')
  @Permissions('departments:update')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.departmentsService.update(user, id, dto);
  }
}
