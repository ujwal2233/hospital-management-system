import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AddPaymentDto } from './dto/add-payment.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { BillingService } from './billing.service';

@ApiTags('billing')
@ApiBearerAuth()
@Controller('billing/invoices')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post()
  @Permissions('billing:create')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateInvoiceDto) {
    return this.billingService.create(user, dto);
  }

  @Get()
  @Permissions('billing:read')
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryInvoiceDto) {
    return this.billingService.findAll(user, query);
  }

  @Get(':id')
  @Permissions('billing:read')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.billingService.findOne(user, id);
  }

  @Post(':id/payments')
  @Permissions('billing:update')
  addPayment(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AddPaymentDto) {
    return this.billingService.addPayment(user, id, dto);
  }

  @Patch(':id/cancel')
  @Permissions('billing:update')
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.billingService.cancel(user, id);
  }
}
