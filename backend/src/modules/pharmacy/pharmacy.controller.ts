import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import {
  CreatePharmacyItemDto,
  DispenseDto,
  UpdatePharmacyItemDto,
} from './dto/pharmacy.dto';
import { QueryDispensingDto } from './dto/query-dispensing.dto';
import { PharmacyService } from './pharmacy.service';

@ApiTags('pharmacy')
@ApiBearerAuth()
@Controller('pharmacy')
export class PharmacyController {
  constructor(private readonly svc: PharmacyService) {}

  // Drug Catalog
  @Post('items')
  @Permissions('pharmacy:create')
  @ApiOperation({ summary: 'Add drug to catalog' })
  createItem(@CurrentUser() user: AuthUser, @Body() dto: CreatePharmacyItemDto) {
    return this.svc.createItem(user, dto);
  }

  @Get('items')
  @Permissions('pharmacy:read')
  @ApiOperation({ summary: 'List drug catalog' })
  findAllItems(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.svc.findAllItems(user, query);
  }

  @Get('items/low-stock')
  @Permissions('pharmacy:read')
  @ApiOperation({ summary: 'Items below reorder level' })
  getLowStock(@CurrentUser() user: AuthUser) {
    return this.svc.getLowStock(user);
  }

  @Get('items/:id')
  @Permissions('pharmacy:read')
  findOneItem(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.findOneItem(user, id);
  }

  @Patch('items/:id')
  @Permissions('pharmacy:update')
  updateItem(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePharmacyItemDto,
  ) {
    return this.svc.updateItem(user, id, dto);
  }

  // Dispensing
  @Post('dispense')
  @Permissions('pharmacy:create')
  @ApiOperation({ summary: 'Dispense items to patient' })
  dispense(@CurrentUser() user: AuthUser, @Body() dto: DispenseDto) {
    return this.svc.dispense(user, dto);
  }

  @Get('dispensing')
  @Permissions('pharmacy:read')
  @ApiOperation({ summary: 'Dispensing history' })
  findDispensing(@CurrentUser() user: AuthUser, @Query() query: QueryDispensingDto) {
    return this.svc.findDispensing(user, query);
  }
}
