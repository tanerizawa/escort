import { Global, Module } from '@nestjs/common';
import { AuditService } from './services/audit.service';
import { EncryptionService } from './services/encryption.service';
import { UploadService } from './services/upload.service';
import { SentryService } from './services/sentry.service';

@Global()
@Module({
  providers: [AuditService, EncryptionService, UploadService, SentryService],
  exports: [AuditService, EncryptionService, UploadService, SentryService],
})
export class CommonModule {}
