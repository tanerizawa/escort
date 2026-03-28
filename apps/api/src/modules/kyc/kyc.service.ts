import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/config/prisma.service';
import { AuditService } from '@common/services/audit.service';
import { UploadService } from '@common/services/upload.service';
import { NotificationService } from '@modules/notification/notification.service';
import { KycStatus } from '@prisma/client';
import * as crypto from 'crypto';

/**
 * eKYC Verification Service
 * 
 * Supports integration with Indonesian eKYC providers (Verihubs, VIDA, Privy).
 * Includes liveness detection, face matching, and KTP/Passport OCR.
 * Falls back to mock mode when provider credentials are not configured.
 */
@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);
  private readonly providerApiKey: string;
  private readonly providerApiUrl: string;
  private readonly isMockMode: boolean;
  private readonly maxAttempts = 5;
  private readonly cooldownHours = 24; // Hours between attempts after rejection

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly uploadService: UploadService,
    private readonly notificationService: NotificationService,
  ) {
    this.providerApiKey = this.configService.get<string>('EKYC_API_KEY', '');
    this.providerApiUrl = this.configService.get<string>(
      'EKYC_API_URL',
      'https://api.verihubs.com/v1',
    );
    this.isMockMode = !this.providerApiKey;

    if (this.isMockMode) {
      this.logger.warn('eKYC running in MOCK MODE — no provider configured');
    }
  }

  /**
   * Submit KYC verification documents
   */
  async submitKyc(
    userId: string,
    data: {
      documentType: 'KTP' | 'PASSPORT' | 'SIM' | 'KITAS';
      documentNumber?: string;
    },
    files: {
      documentFront?: Express.Multer.File;
      documentBack?: Express.Multer.File;
      selfie?: Express.Multer.File;
    },
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    // Check if user already verified
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isVerified: true, firstName: true, lastName: true },
    });
    if (!user) throw new NotFoundException('User tidak ditemukan');
    if (user.isVerified) {
      throw new BadRequestException('Akun Anda sudah terverifikasi');
    }

    // Check for existing pending verification
    const existingPending = await this.prisma.kycVerification.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'IN_REVIEW'] },
      },
    });
    if (existingPending) {
      throw new BadRequestException(
        'Verifikasi sebelumnya masih dalam proses. Mohon tunggu hasil review.',
      );
    }

    // Check attempt limits
    const totalAttempts = await this.prisma.kycVerification.count({
      where: { userId },
    });
    if (totalAttempts >= this.maxAttempts) {
      throw new ForbiddenException(
        `Batas percobaan verifikasi tercapai (${this.maxAttempts}x). Hubungi support@areton.id`,
      );
    }

    // Check cooldown after rejection
    const lastRejection = await this.prisma.kycVerification.findFirst({
      where: { userId, status: 'REJECTED' },
      orderBy: { createdAt: 'desc' },
    });
    if (lastRejection) {
      const hoursSinceRejection =
        (Date.now() - lastRejection.createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceRejection < this.cooldownHours) {
        const remainingHours = Math.ceil(this.cooldownHours - hoursSinceRejection);
        throw new BadRequestException(
          `Mohon tunggu ${remainingHours} jam sebelum mencoba verifikasi lagi`,
        );
      }
    }

    // Validate required files
    if (!files.documentFront) {
      throw new BadRequestException('Foto dokumen identitas (depan) wajib diunggah');
    }
    if (!files.selfie) {
      throw new BadRequestException('Foto selfie wajib diunggah');
    }
    if (data.documentType === 'KTP' && !files.documentBack) {
      throw new BadRequestException('Foto KTP bagian belakang wajib diunggah');
    }

    // Upload files
    const uploadOpts = {
      maxSizeMB: 10,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    };

    const frontUpload = await this.uploadService.saveFile(
      files.documentFront,
      'documents',
      uploadOpts,
    );

    let backUpload = null;
    if (files.documentBack) {
      backUpload = await this.uploadService.saveFile(
        files.documentBack,
        'documents',
        uploadOpts,
      );
    }

    const selfieUpload = await this.uploadService.saveFile(
      files.selfie,
      'documents',
      uploadOpts,
    );

    // Call eKYC provider (or mock)
    const verificationResult = await this.performVerification(
      frontUpload.url,
      backUpload?.url || null,
      selfieUpload.url,
      data.documentType,
      data.documentNumber,
    );

    // Encrypt document number if provided
    const encryptedDocNumber = data.documentNumber
      ? this.encryptDocumentNumber(data.documentNumber)
      : null;

    // Create KYC record
    const kyc = await this.prisma.kycVerification.create({
      data: {
        userId,
        documentType: data.documentType,
        documentNumber: encryptedDocNumber,
        documentFrontUrl: frontUpload.url,
        documentBackUrl: backUpload?.url || null,
        selfieUrl: selfieUpload.url,
        livenessScore: verificationResult.livenessScore,
        faceMatchScore: verificationResult.faceMatchScore,
        ocrData: verificationResult.ocrData || undefined,
        providerRef: verificationResult.providerRef,
        providerResponse: verificationResult.rawResponse || undefined,
        status: verificationResult.autoApproved ? 'VERIFIED' : 'PENDING',
        verifiedAt: verificationResult.autoApproved ? new Date() : null,
        attemptNumber: totalAttempts + 1,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      },
    });

    // Auto-verify user if provider approved
    if (verificationResult.autoApproved) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isVerified: true },
      });
    }

    // Audit log
    await this.auditService.log({
      userId,
      action: 'KYC_SUBMITTED',
      resource: 'kyc_verifications',
      resourceId: kyc.id,
      details: {
        documentType: data.documentType,
        attemptNumber: totalAttempts + 1,
        autoApproved: verificationResult.autoApproved,
        livenessScore: verificationResult.livenessScore,
        faceMatchScore: verificationResult.faceMatchScore,
        mockMode: this.isMockMode,
      },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    this.logger.log(
      `KYC submitted for user ${userId} (attempt ${totalAttempts + 1}, ${
        verificationResult.autoApproved ? 'auto-approved' : 'pending review'
      })`,
    );

    // Notify user that submission was received
    await this.notificationService.create(
      userId,
      verificationResult.autoApproved ? 'Verifikasi Berhasil' : 'Dokumen Diterima',
      verificationResult.autoApproved
        ? 'Verifikasi identitas Anda berhasil! Akun Anda telah terverifikasi.'
        : 'Dokumen verifikasi diterima. Proses review membutuhkan 1-24 jam.',
      'SYSTEM',
      { kycId: kyc.id, status: kyc.status },
    );

    // Notify admins about new pending KYC submission
    if (!verificationResult.autoApproved) {
      await this.notificationService.notifyAdmins(
        'KYC Baru Menunggu Review',
        `${user.firstName} ${user.lastName || ''} mengajukan verifikasi ${data.documentType}. Silakan review.`,
        'SYSTEM',
        { kycId: kyc.id, userId, link: `/users/kyc/${kyc.id}` },
      );
    }

    return {
      id: kyc.id,
      status: kyc.status,
      attemptNumber: kyc.attemptNumber,
      livenessScore: kyc.livenessScore,
      faceMatchScore: kyc.faceMatchScore,
      autoApproved: verificationResult.autoApproved,
      message: verificationResult.autoApproved
        ? 'Verifikasi identitas berhasil! Akun Anda telah terverifikasi.'
        : 'Dokumen diterima. Proses verifikasi membutuhkan 1-24 jam.',
    };
  }

  /**
   * Get current KYC status for a user
   */
  async getKycStatus(userId: string) {
    const verifications = await this.prisma.kycVerification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        documentType: true,
        livenessScore: true,
        faceMatchScore: true,
        rejectionReason: true,
        attemptNumber: true,
        verifiedAt: true,
        reviewedAt: true,
        createdAt: true,
      },
    });

    const latestVerification = verifications[0] || null;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isVerified: true },
    });

    return {
      isVerified: user?.isVerified || false,
      currentStatus: latestVerification?.status || 'NONE',
      totalAttempts: verifications.length,
      remainingAttempts: Math.max(0, this.maxAttempts - verifications.length),
      latestVerification,
      history: verifications,
    };
  }

  /**
   * Admin: List pending KYC verifications
   */
  async listPendingKyc(rawPage = 1, rawLimit = 20) {
    const page = Math.max(1, Number(rawPage) || 1);
    const limit = Math.max(1, Math.min(100, Number(rawLimit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.kycVerification.findMany({
        where: { status: { in: ['PENDING', 'IN_REVIEW'] } },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              role: true,
              profilePhoto: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.kycVerification.count({
        where: { status: { in: ['PENDING', 'IN_REVIEW'] } },
      }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin: List all KYC verifications with optional status/role filter
   */
  async listAllKyc(rawPage = 1, rawLimit = 20, status?: string, role?: string) {
    const page = Math.max(1, Number(rawPage) || 1);
    const limit = Math.max(1, Math.min(100, Number(rawLimit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by KYC status
    if (status && ['PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED'].includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }

    // Filter by user role (CLIENT, ESCORT, etc.)
    if (role) {
      where.user = { role: role.toUpperCase() };
    }

    const [items, total] = await Promise.all([
      this.prisma.kycVerification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              role: true,
              profilePhoto: true,
              isVerified: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.kycVerification.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin: Get KYC detail for review
   */
  async getKycDetail(kycId: string) {
    const kyc = await this.prisma.kycVerification.findUnique({
      where: { id: kycId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            profilePhoto: true,
            isVerified: true,
            createdAt: true,
            escortProfile: {
              select: { tier: true, isApproved: true },
            },
          },
        },
      },
    });

    if (!kyc) throw new NotFoundException('KYC record tidak ditemukan');

    // Get user's KYC history
    const history = await this.prisma.kycVerification.findMany({
      where: { userId: kyc.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        attemptNumber: true,
        rejectionReason: true,
        createdAt: true,
      },
    });

    return { ...kyc, history };
  }

  /**
   * Admin: Review and approve/reject KYC
   */
  async reviewKyc(
    kycId: string,
    adminUserId: string,
    approved: boolean,
    rejectionReason?: string,
  ) {
    const kyc = await this.prisma.kycVerification.findUnique({
      where: { id: kycId },
      include: { user: { select: { id: true, firstName: true } } },
    });

    if (!kyc) throw new NotFoundException('KYC record tidak ditemukan');
    if (kyc.status === 'VERIFIED') {
      throw new BadRequestException('KYC ini sudah diverifikasi');
    }
    if (kyc.status === 'REJECTED') {
      throw new BadRequestException('KYC ini sudah ditolak');
    }

    if (!approved && !rejectionReason) {
      throw new BadRequestException('Alasan penolakan wajib diisi');
    }

    const newStatus: KycStatus = approved ? 'VERIFIED' : 'REJECTED';

    const updated = await this.prisma.kycVerification.update({
      where: { id: kycId },
      data: {
        status: newStatus,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
        verifiedAt: approved ? new Date() : null,
        rejectionReason: approved ? null : rejectionReason,
      },
    });

    // Update user verification status
    if (approved) {
      await this.prisma.user.update({
        where: { id: kyc.userId },
        data: { isVerified: true },
      });
    }

    // Audit log
    await this.auditService.log({
      userId: adminUserId,
      action: approved ? 'KYC_APPROVED' : 'KYC_REJECTED',
      resource: 'kyc_verifications',
      resourceId: kycId,
      details: {
        targetUserId: kyc.userId,
        decision: approved ? 'APPROVED' : 'REJECTED',
        rejectionReason: rejectionReason || null,
      },
    });

    this.logger.log(
      `KYC ${kycId} ${approved ? 'approved' : 'rejected'} by admin ${adminUserId}`,
    );

    // Notify user about KYC result
    await this.notificationService.create(
      kyc.userId,
      approved ? 'Verifikasi Berhasil ✅' : 'Verifikasi Ditolak',
      approved
        ? 'Selamat! Identitas Anda telah berhasil diverifikasi.'
        : `Verifikasi ditolak: ${rejectionReason}. Silakan perbaiki dan ajukan ulang.`,
      'SYSTEM',
      { kycId, status: newStatus },
    );

    return {
      ...updated,
      message: approved
        ? `KYC untuk ${kyc.user.firstName} berhasil diverifikasi`
        : `KYC untuk ${kyc.user.firstName} ditolak: ${rejectionReason}`,
    };
  }

  /**
   * Webhook handler for async provider callbacks
   */
  async processWebhook(payload: {
    reference_id: string;
    status: string;
    liveness_score?: number;
    face_match_score?: number;
    ocr_data?: any;
    rejection_reason?: string;
  }) {
    const kyc = await this.prisma.kycVerification.findFirst({
      where: { providerRef: payload.reference_id },
    });

    if (!kyc) {
      this.logger.warn(`Webhook received for unknown ref: ${payload.reference_id}`);
      return { received: true, processed: false };
    }

    const isApproved = payload.status === 'VERIFIED' || payload.status === 'APPROVED';
    const isRejected = payload.status === 'REJECTED' || payload.status === 'FAILED';

    let newStatus: KycStatus = kyc.status;
    if (isApproved) newStatus = 'VERIFIED';
    else if (isRejected) newStatus = 'REJECTED';
    else newStatus = 'IN_REVIEW';

    await this.prisma.kycVerification.update({
      where: { id: kyc.id },
      data: {
        status: newStatus,
        livenessScore: payload.liveness_score ?? kyc.livenessScore,
        faceMatchScore: payload.face_match_score ?? kyc.faceMatchScore,
        ocrData: payload.ocr_data || kyc.ocrData || undefined,
        rejectionReason: payload.rejection_reason || null,
        verifiedAt: isApproved ? new Date() : null,
        providerResponse: payload as any,
      },
    });

    // Auto-verify user if provider approved
    if (isApproved) {
      await this.prisma.user.update({
        where: { id: kyc.userId },
        data: { isVerified: true },
      });
    }

    this.logger.log(
      `Webhook processed for KYC ${kyc.id}: ${payload.status} → ${newStatus}`,
    );

    return { received: true, processed: true, kycId: kyc.id, newStatus };
  }

  /**
   * Admin: Get KYC statistics
   */
  async getKycStats() {
    const [total, pending, inReview, verified, rejected] = await Promise.all([
      this.prisma.kycVerification.count(),
      this.prisma.kycVerification.count({ where: { status: 'PENDING' } }),
      this.prisma.kycVerification.count({ where: { status: 'IN_REVIEW' } }),
      this.prisma.kycVerification.count({ where: { status: 'VERIFIED' } }),
      this.prisma.kycVerification.count({ where: { status: 'REJECTED' } }),
    ]);

    // Count only CLIENT users for verification rate (KYC is for clients)
    const verifiedClients = await this.prisma.user.count({
      where: { isVerified: true, role: 'CLIENT' },
    });
    const totalClients = await this.prisma.user.count({
      where: { role: 'CLIENT' },
    });

    return {
      total,
      pending: pending + inReview,
      inReview,
      verified,
      rejected,
      verifiedClients,
      totalClients,
      verificationRate: totalClients > 0
        ? Math.round((verifiedClients / totalClients) * 1000) / 10
        : 0,
    };
  }

  // ── Private Methods ──────────────────────

  /**
   * Perform eKYC verification via provider or mock
   */
  private async performVerification(
    documentFrontUrl: string,
    documentBackUrl: string | null,
    selfieUrl: string,
    documentType: string,
    documentNumber?: string,
  ): Promise<{
    livenessScore: number;
    faceMatchScore: number;
    ocrData: any;
    providerRef: string;
    rawResponse: any;
    autoApproved: boolean;
  }> {
    if (this.isMockMode) {
      return this.mockVerification(documentType, documentNumber);
    }

    // Real provider integration (Verihubs/VIDA)
    try {
      // Step 1: Liveness detection
      const livenessResult = await this.callProvider('/identity/liveness', {
        selfie_image: selfieUrl,
      });

      // Step 2: Face matching (selfie vs document photo)
      const faceMatchResult = await this.callProvider('/identity/face-match', {
        selfie_image: selfieUrl,
        document_image: documentFrontUrl,
      });

      // Step 3: OCR extraction
      const ocrResult = await this.callProvider('/identity/ocr', {
        document_image: documentFrontUrl,
        document_back_image: documentBackUrl,
        document_type: documentType,
      });

      const livenessScore = livenessResult.data?.score || 0;
      const faceMatchScore = faceMatchResult.data?.score || 0;
      const autoApproved = livenessScore >= 80 && faceMatchScore >= 80;

      return {
        livenessScore,
        faceMatchScore,
        ocrData: ocrResult.data?.extracted || null,
        providerRef: livenessResult.data?.reference_id || crypto.randomUUID(),
        rawResponse: {
          liveness: livenessResult,
          faceMatch: faceMatchResult,
          ocr: ocrResult,
        },
        autoApproved,
      };
    } catch (err: any) {
      this.logger.error(`eKYC provider error: ${err.message}`, err.stack);
      // Fallback to manual review
      return {
        livenessScore: 0,
        faceMatchScore: 0,
        ocrData: null,
        providerRef: `manual-${crypto.randomUUID()}`,
        rawResponse: { error: err.message },
        autoApproved: false,
      };
    }
  }

  /**
   * Mock verification for development/testing
   */
  private mockVerification(
    documentType: string,
    documentNumber?: string,
  ): {
    livenessScore: number;
    faceMatchScore: number;
    ocrData: any;
    providerRef: string;
    rawResponse: any;
    autoApproved: boolean;
  } {
    const livenessScore = 85 + Math.random() * 15; // 85-100
    const faceMatchScore = 82 + Math.random() * 18; // 82-100
    const providerRef = `mock-${crypto.randomUUID().slice(0, 8)}`;

    const mockOcr: Record<string, any> = {
      documentType,
      fullName: 'Mock Verified User',
      dateOfBirth: '1990-01-15',
      gender: 'L',
      address: 'Jl. Sudirman No. 1, Jakarta Pusat',
    };

    if (documentType === 'KTP') {
      mockOcr.nik = documentNumber || '3174012345678901';
      mockOcr.province = 'DKI JAKARTA';
      mockOcr.city = 'JAKARTA PUSAT';
      mockOcr.religion = 'ISLAM';
      mockOcr.maritalStatus = 'BELUM KAWIN';
      mockOcr.occupation = 'KARYAWAN SWASTA';
      mockOcr.nationality = 'WNI';
      mockOcr.validUntil = 'SEUMUR HIDUP';
    } else if (documentType === 'PASSPORT') {
      mockOcr.passportNumber = documentNumber || 'A1234567';
      mockOcr.nationality = 'INDONESIA';
      mockOcr.validUntil = '2029-12-31';
    }

    return {
      livenessScore: Math.round(livenessScore * 100) / 100,
      faceMatchScore: Math.round(faceMatchScore * 100) / 100,
      ocrData: mockOcr,
      providerRef,
      rawResponse: {
        mock: true,
        provider: 'mock-verihubs',
        timestamp: new Date().toISOString(),
      },
      autoApproved: true, // Auto-approve in mock mode
    };
  }

  /**
   * Call external eKYC provider API
   */
  private async callProvider(endpoint: string, body: any): Promise<any> {
    const url = `${this.providerApiUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.providerApiKey}`,
        'X-API-Key': this.providerApiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`eKYC API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /**
   * Encrypt sensitive document numbers (KTP NIK, passport number)
   */
  private encryptDocumentNumber(docNumber: string): string {
    const key = this.configService.get<string>(
      'EKYC_ENCRYPTION_KEY',
      'areton-ekyc-default-key-32ch',
    );
    const iv = crypto.randomBytes(16);
    const keyBuffer = crypto
      .createHash('sha256')
      .update(key)
      .digest();
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
    let encrypted = cipher.update(docNumber, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }
}
