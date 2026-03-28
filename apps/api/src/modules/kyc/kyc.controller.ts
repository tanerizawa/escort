import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { KycService } from './kyc.service';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  /**
   * POST /kyc/submit — Submit identity documents for eKYC verification
   * Requires: documentFront (file), selfie (file), documentType
   * Optional: documentBack (file, required for KTP), documentNumber
   */
  @Post('submit')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'documentFront', maxCount: 1 },
      { name: 'documentBack', maxCount: 1 },
      { name: 'selfie', maxCount: 1 },
    ]),
  )
  async submitKyc(
    @Req() req: any,
    @UploadedFiles()
    files: {
      documentFront?: Express.Multer.File[];
      documentBack?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
    },
    @Body('documentType') documentType: string,
    @Body('documentNumber') documentNumber?: string,
  ) {
    const validTypes = ['KTP', 'PASSPORT', 'SIM', 'KITAS'];
    const docType = (documentType || 'KTP').toUpperCase();
    if (!validTypes.includes(docType)) {
      return {
        statusCode: 400,
        message: `documentType harus salah satu dari: ${validTypes.join(', ')}`,
      };
    }

    return this.kycService.submitKyc(
      req.user.id,
      {
        documentType: docType as 'KTP' | 'PASSPORT' | 'SIM' | 'KITAS',
        documentNumber,
      },
      {
        documentFront: files.documentFront?.[0],
        documentBack: files.documentBack?.[0],
        selfie: files.selfie?.[0],
      },
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    );
  }

  /**
   * GET /kyc/status — Get current KYC verification status
   */
  @Get('status')
  @UseGuards(AuthGuard('jwt'))
  async getKycStatus(@Req() req: any) {
    return this.kycService.getKycStatus(req.user.id);
  }

  /**
   * POST /kyc/webhook — Webhook endpoint for eKYC provider callbacks
   * No auth guard — validated by provider signature
   */
  @Post('webhook')
  async processWebhook(@Body() payload: any) {
    return this.kycService.processWebhook(payload);
  }

  // ── Admin Endpoints ──────────────────────

  /**
   * GET /kyc/admin/stats — KYC verification statistics
   */
  @Get('admin/stats')
  @UseGuards(AuthGuard('jwt'))
  async getKycStats(@Req() req: any) {
    this.requireAdmin(req.user);
    return this.kycService.getKycStats();
  }

  /**
   * GET /kyc/admin/pending — List pending KYC verifications
   */
  @Get('admin/pending')
  @UseGuards(AuthGuard('jwt'))
  async listPendingKyc(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.requireAdmin(req.user);
    return this.kycService.listPendingKyc(
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  /**
   * GET /kyc/admin/list — List all KYC verifications with optional status filter
   */
  @Get('admin/list')
  @UseGuards(AuthGuard('jwt'))
  async listAllKyc(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('role') role?: string,
  ) {
    this.requireAdmin(req.user);
    return this.kycService.listAllKyc(
      Number(page) || 1,
      Number(limit) || 20,
      status || undefined,
      role || undefined,
    );
  }

  /**
   * GET /kyc/admin/:id — Get KYC detail for review
   */
  @Get('admin/:id')
  @UseGuards(AuthGuard('jwt'))
  async getKycDetail(@Req() req: any, @Param('id') id: string) {
    this.requireAdmin(req.user);
    return this.kycService.getKycDetail(id);
  }

  /**
   * PATCH /kyc/admin/:id/review — Approve or reject KYC
   */
  @Patch('admin/:id/review')
  @UseGuards(AuthGuard('jwt'))
  async reviewKyc(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { approved: boolean; rejectionReason?: string },
  ) {
    this.requireAdmin(req.user);
    return this.kycService.reviewKyc(
      id,
      req.user.id,
      body.approved,
      body.rejectionReason,
    );
  }

  // ── Helper ───────────────────────────────

  private requireAdmin(user: any) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Akses ditolak — hanya untuk admin');
    }
  }
}
