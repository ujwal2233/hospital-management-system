import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateInventoryItemDto, RecordTransactionDto, UpdateInventoryItemDto } from './dto/inventory.dto';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly svc: InventoryService) {}

  @Post('items')
  @Permissions('inventory:create')
  createItem(@CurrentUser() user: AuthUser, @Body() dto: CreateInventoryItemDto) {
    return this.svc.createItem(user, dto);
  }

  @Get('items')
  @Permissions('inventory:read')
  findAllItems(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.svc.findAllItems(user, query);
  }

  @Get('items/low-stock')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'Items at or below reorder level' })
  getLowStock(@CurrentUser() user: AuthUser) {
    return this.svc.getLowStock(user);
  }

  @Get('items/:id')
  @Permissions('inventory:read')
  findOneItem(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.findOneItem(user, id);
  }

  @Patch('items/:id')
  @Permissions('inventory:update')
  updateItem(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateInventoryItemDto) {
    return this.svc.updateItem(user, id, dto);
  }

  @Post('transactions')
  @Permissions('inventory:update')
  @ApiOperation({ summary: 'Record stock IN / OUT / ADJUSTMENT' })
  recordTransaction(@CurrentUser() user: AuthUser, @Body() dto: RecordTransactionDto) {
    return this.svc.recordTransaction(user, dto);
  }

  @Get('transactions')
  @Permissions('inventory:read')
  findTransactions(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.svc.findTransactions(user, query);
  }
}
