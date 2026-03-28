import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { RefundClaimController } from './refund-claim.controller';
import { RefundClaimService } from './refund-claim.service';
import { EncryptionService } from '@/common/services/encryption.service';
import { AuditService } from '@/common/services/audit.service';
import { NotificationModule } from '@modules/notification/notification.module';
import { PaymentModule } from '@modules/payment/payment.module';

@Module({
  imports: [NotificationModule, PaymentModule],
  controllers: [AdminController, RefundClaimController],
  providers: [AdminService, RefundClaimService, EncryptionService, AuditService],
  exports: [AdminService, RefundClaimService],
})
export class AdminModule {}
