import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  Headers,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { XenditService } from './xendit.service';
import { CryptoPaymentService } from './crypto-payment.service';
import { DokuService } from './doku.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { CreatePaymentDto, PaymentQueryDto, WithdrawRequestDto, RefundPaymentDto } from './dto/payment.dto';
import { Public } from '@common/decorators/public.decorator';

@Controller('payments')
@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly xenditService: XenditService,
    private readonly cryptoPaymentService: CryptoPaymentService,
    private readonly dokuService: DokuService,
  ) {}

  @Post()
  @Roles('CLIENT')
  @ApiOperation({ summary: 'Initiate payment for a booking' })
  @ApiResponse({ status: 201, description: 'Payment initiated — gateway URL returned' })
  @ApiResponse({ status: 400, description: 'Booking not confirmed or payment already processed' })
  @ApiResponse({ status: 403, description: 'Not your booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async createPayment(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my payment history' })
  @ApiResponse({ status: 200, description: 'Paginated payment list' })
  async listPayments(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Query() query: PaymentQueryDto,
  ) {
    return this.paymentService.findAll(userId, role, query);
  }

  @Get('earnings/summary')
  @Roles('ESCORT')
  @ApiOperation({ summary: 'Get escort earnings summary' })
  @ApiResponse({ status: 200, description: 'Earnings breakdown returned' })
  async getEarnings(@CurrentUser('id') escortId: string) {
    return this.paymentService.getEarningsSummary(escortId);
  }

  @Get('lookup')
  @ApiOperation({ summary: 'Look up payment by order_id (gateway ref)' })
  @ApiResponse({ status: 200, description: 'Payment details returned' })
  @ApiResponse({ status: 404, description: 'Payment not found for order' })
  async lookupByOrderId(
    @CurrentUser('id') userId: string,
    @Query('order_id') orderId: string,
  ) {
    if (!orderId) {
      return { payment: null, message: 'order_id is required' };
    }
    return this.paymentService.findByGatewayRef(userId, orderId);
  }

  @Get('withdrawals')
  @Roles('ESCORT')
  @ApiOperation({ summary: 'List withdrawal history' })
  @ApiResponse({ status: 200, description: 'Paginated withdrawal list' })
  async getWithdrawals(
    @CurrentUser('id') escortId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentService.getWithdrawals(escortId, { page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment detail' })
  @ApiResponse({ status: 200, description: 'Payment detail with booking info' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPayment(
    @CurrentUser('id') userId: string,
    @Param('id') paymentId: string,
  ) {
    return this.paymentService.findOne(userId, paymentId);
  }

  @Post('withdraw')
  @Roles('ESCORT')
  @ApiOperation({ summary: 'Request withdrawal' })
  @ApiResponse({ status: 201, description: 'Withdrawal request submitted' })
  @ApiResponse({ status: 400, description: 'Insufficient balance' })
  async requestWithdraw(
    @CurrentUser('id') escortId: string,
    @Body() dto: WithdrawRequestDto,
  ) {
    return this.paymentService.requestWithdraw(escortId, dto);
  }

  @Patch(':id/release')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Release escrow payment to escort' })
  @ApiResponse({ status: 200, description: 'Escrow released to escort' })
  @ApiResponse({ status: 400, description: 'Payment not in ESCROW status' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async releaseEscrow(@Param('id') paymentId: string) {
    return this.paymentService.releaseEscrow(paymentId);
  }

  @Post(':id/refund')
  @Roles('CLIENT', 'ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Process full or partial refund' })
  @ApiResponse({ status: 200, description: 'Refund processed' })
  @ApiResponse({ status: 400, description: 'Cannot refund at current status' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async refundPayment(
    @CurrentUser('id') userId: string,
    @Param('id') paymentId: string,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.paymentService.refund(userId, paymentId, dto);
  }

  // Payment gateway webhooks — @Public() bypasses auth; @SkipThrottle()
  // keeps the global throttler from rejecting bursty provider callbacks
  // (providers commonly retry many times per second on delivery failure).

  @Public()
  @SkipThrottle()
  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle Xendit payment webhook notification' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-callback-token') callbackToken?: string,
  ) {
    return this.paymentService.handleWebhook(payload, callbackToken);
  }

  @Public()
  @SkipThrottle()
  @Post('crypto-webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle NOWPayments crypto webhook (IPN)' })
  @ApiResponse({ status: 200, description: 'Crypto webhook processed' })
  async handleCryptoWebhook(
    @Body() payload: any,
    @Headers('x-nowpayments-sig') signature?: string,
  ) {
    return this.paymentService.handleCryptoWebhook(payload, signature);
  }

  @Public()
  @SkipThrottle()
  @Post('doku-webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle DOKU payment notification' })
  @ApiResponse({ status: 200, description: 'DOKU webhook processed' })
  async handleDokuWebhook(
    @Body() payload: any,
    @Headers('client-id') clientId?: string,
    @Headers('request-id') requestId?: string,
    @Headers('request-timestamp') requestTimestamp?: string,
    @Headers('signature') signature?: string,
  ) {
    return this.paymentService.handleDokuWebhook(payload, { clientId, requestId, requestTimestamp, signature });
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Check payment gateway status' })
  @ApiResponse({ status: 200, description: 'Payment and gateway status returned' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async checkPaymentStatus(
    @CurrentUser('id') userId: string,
    @Param('id') paymentId: string,
  ) {
    const payment = await this.paymentService.findOne(userId, paymentId);
    if (payment.paymentGatewayRef) {
      try {
        const gatewayStatus = await this.xenditService.getTransactionStatus(payment.paymentGatewayRef);
        return { payment, gatewayStatus };
      } catch {
        return { payment, gatewayStatus: null };
      }
    }
    return { payment, gatewayStatus: null };
  }

  @Get(':id/invoice')
  @ApiOperation({ summary: 'Get invoice data for a payment' })
  @ApiResponse({ status: 200, description: 'Invoice data with breakdown' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getInvoice(
    @CurrentUser('id') userId: string,
    @Param('id') paymentId: string,
  ) {
    return this.paymentService.getInvoice(userId, paymentId);
  }
}

