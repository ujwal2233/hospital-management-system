import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('permissions')
  @Permissions('roles:read')
  catalog() {
    return this.rolesService.permissionCatalog();
  }

  @Get()
  @Permissions('roles:read')
  findAll(@CurrentUser() user: AuthUser) {
    return this.rolesService.findAllForTenant(user.tenantId);
  }

  @Post()
  @Permissions('roles:create')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRoleDto) {
    return this.rolesService.create(user, dto);
  }

  @Patch(':id')
  @Permissions('roles:update')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(user, id, dto);
  }

  @Delete(':id')
  @Permissions('roles:delete')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.rolesService.remove(user, id);
    return { deleted: true };
  }
}
