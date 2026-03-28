import { IsEnum } from 'class-validator';
import { RefundClaimStatus } from '@prisma/client';

export class UpdateRefundClaimDto {
  @IsEnum(RefundClaimStatus)
  status: RefundClaimStatus;
  
  note?: string;
}