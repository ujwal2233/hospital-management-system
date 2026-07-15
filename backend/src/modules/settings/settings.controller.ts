import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly svc: SettingsService) {}

  @Get()
  @Permissions('settings:read')
  @ApiOperation({ summary: 'Get all settings for tenant' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.svc.findAll(user);
  }

  @Patch()
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Upsert settings (batch key-value patch)' })
  upsert(@CurrentUser() user: AuthUser, @Body() patch: Record<string, unknown>) {
    return this.svc.upsertMany(user, patch);
  }
}
