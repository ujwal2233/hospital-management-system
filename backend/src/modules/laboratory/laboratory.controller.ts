import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AddLabResultsDto, CreateLabOrderDto, QueryLabOrderDto, UpdateLabOrderDto } from './dto/laboratory.dto';
import { LaboratoryService } from './laboratory.service';

@ApiTags('laboratory')
@ApiBearerAuth()
@Controller('laboratory')
export class LaboratoryController {
  constructor(private readonly svc: LaboratoryService) {}

  @Post()
  @Permissions('laboratory:create')
  @ApiOperation({ summary: 'Create lab order' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLabOrderDto) {
    return this.svc.create(user, dto);
  }

  @Get()
  @Permissions('laboratory:read')
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryLabOrderDto) {
    return this.svc.findAll(user, query);
  }

  @Get(':id')
  @Permissions('laboratory:read')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.findOne(user, id);
  }

  @Patch(':id')
  @Permissions('laboratory:update')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateLabOrderDto) {
    return this.svc.update(user, id, dto);
  }

  @Post(':id/results')
  @Permissions('laboratory:update')
  @ApiOperation({ summary: 'Add/update lab results' })
  addResults(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddLabResultsDto,
  ) {
    return this.svc.addResults(user, id, dto);
  }
}
