import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateClaimDto, CreateProviderDto, UpdateClaimDto, UpdateProviderDto } from './dto/insurance.dto';
import { InsuranceService } from './insurance.service';

@ApiTags('insurance')
@ApiBearerAuth()
@Controller('insurance')
export class InsuranceController {
  constructor(private readonly svc: InsuranceService) {}

  // Providers
  @Post('providers')
  @Permissions('insurance:create')
  createProvider(@CurrentUser() user: AuthUser, @Body() dto: CreateProviderDto) {
    return this.svc.createProvider(user, dto);
  }

  @Get('providers')
  @Permissions('insurance:read')
  findAllProviders(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.svc.findAllProviders(user, query);
  }

  @Patch('providers/:id')
  @Permissions('insurance:update')
  updateProvider(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateProviderDto) {
    return this.svc.updateProvider(user, id, dto);
  }

  // Claims
  @Post('claims')
  @Permissions('insurance:create')
  createClaim(@CurrentUser() user: AuthUser, @Body() dto: CreateClaimDto) {
    return this.svc.createClaim(user, dto);
  }

  @Get('claims')
  @Permissions('insurance:read')
  findAllClaims(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.svc.findAllClaims(user, query);
  }

  @Get('claims/:id')
  @Permissions('insurance:read')
  findOneClaim(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.findOneClaim(user, id);
  }

  @Patch('claims/:id')
  @Permissions('insurance:update')
  updateClaim(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateClaimDto) {
    return this.svc.updateClaim(user, id, dto);
  }
}
