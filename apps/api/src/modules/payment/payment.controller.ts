import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { CreatePaymentDto, PaymentQueryDto, WithdrawRequestDto, RefundPaymentDto, WebhookPayloadDto } from './dto/payment.dto';

@Controller('payments')
@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @Roles('CLIENT')
  @ApiOperation({ summary: 'Initiate payment for a booking' })
  async createPayment(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my payment history' })
  async listPayments(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Query() query: PaymentQueryDto,
  ) {
    return this.paymentService.findAll(userId, role, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment detail' })
  async getPayment(
    @CurrentUser('id') userId: string,
    @Param('id') paymentId: string,
  ) {
    return this.paymentService.findOne(userId, paymentId);
  }

  @Get('earnings/summary')
  @Roles('ESCORT')
  @ApiOperation({ summary: 'Get escort earnings summary' })
  async getEarnings(@CurrentUser('id') escortId: string) {
    return this.paymentService.getEarningsSummary(escortId);
  }

  @Post('withdraw')
  @Roles('ESCORT')
  @ApiOperation({ summary: 'Request withdrawal' })
  async requestWithdraw(
    @CurrentUser('id') escortId: string,
    @Body() dto: WithdrawRequestDto,
  ) {
    return this.paymentService.requestWithdraw(escortId, dto);
  }

  @Patch(':id/release')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Release escrow payment to escort' })
  async releaseEscrow(@Param('id') paymentId: string) {
    return this.paymentService.releaseEscrow(paymentId);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Process full or partial refund' })
  @ApiResponse({ status: 200, description: 'Refund processed' })
  async refundPayment(
    @CurrentUser('id') userId: string,
    @Param('id') paymentId: string,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.paymentService.refund(userId, paymentId, dto);
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle payment gateway webhook' })
  async handleWebhook(@Body() payload: WebhookPayloadDto) {
    return this.paymentService.handleWebhook(payload);
  }

  @Get(':id/invoice')
  @ApiOperation({ summary: 'Get invoice data for a payment' })
  async getInvoice(
    @CurrentUser('id') userId: string,
    @Param('id') paymentId: string,
  ) {
    return this.paymentService.getInvoice(userId, paymentId);
  }
}
