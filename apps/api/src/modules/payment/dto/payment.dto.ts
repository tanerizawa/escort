import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Booking ID' })
  @IsString()
  bookingId: string;

  @ApiProperty({ description: 'Payment method (e.g., MIDTRANS, XENDIT, BANK_TRANSFER)' })
  @IsString()
  method: string;

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
