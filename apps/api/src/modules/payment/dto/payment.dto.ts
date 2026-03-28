import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Booking ID' })
  @IsString()
  bookingId: string;

  @ApiProperty({ description: 'Payment method', enum: ['crypto', 'crypto_eth', 'crypto_usdt', 'crypto_btc', 'crypto_sol', 'crypto_xrp', 'doku', 'doku_va', 'doku_ewallet', 'doku_qris', 'doku_cc', 'doku_retail', 'bank_transfer', 'ewallet', 'qris', 'credit_card', 'retail_outlet'] })
  @IsString()
  method: string;

  @ApiPropertyOptional({ description: 'Bank type for bank_transfer', enum: ['bca', 'bni', 'bri', 'mandiri', 'permata'] })
  @IsOptional()
  @IsString()
  bankType?: string;

  @ApiPropertyOptional({ description: 'Payment type: FULL (100%) or DP_50 (50% down payment)', enum: ['FULL', 'DP_50'], default: 'FULL' })
  @IsOptional()
  @IsString()
  paymentType?: string;

  @ApiPropertyOptional({ description: 'Tip amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tipAmount?: number;
}

export class PaymentQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: ['PENDING', 'ESCROW', 'RELEASED', 'REFUNDED', 'FAILED'] })
  @IsOptional()
  @IsString()
  status?: string;
}

export class WithdrawRequestDto {
  @ApiProperty({ description: 'Amount to withdraw' })
  @IsNumber()
  @Min(100000) // Minimum Rp 100.000
  amount: number;

  @ApiProperty({ description: 'Bank account number' })
  @IsString()
  bankAccount: string;

  @ApiProperty({ description: 'Bank name' })
  @IsString()
  bankName: string;

  @ApiPropertyOptional({ description: 'Account holder name' })
  @IsOptional()
  @IsString()
  accountHolder?: string;
}

export class RefundPaymentDto {
  @ApiPropertyOptional({ description: 'Partial refund amount (omit for full refund)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @ApiProperty({ description: 'Reason for refund' })
  @IsString()
  reason: string;
}

export class WebhookPayloadDto {
  @ApiProperty()
  @IsString()
  transactionId: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalRef?: string;
}
