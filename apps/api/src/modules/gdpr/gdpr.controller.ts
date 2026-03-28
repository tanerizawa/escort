import {
  Controller, Get, Post, Body, Res, Param, Query,
  UseGuards, Request, BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { GdprService } from './gdpr.service';
import { join } from 'path';
import { existsSync, createReadStream } from 'fs';

@Controller('gdpr')
export class GdprController {
  constructor(private readonly gdprService: GdprService) {}

  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  async getPrivacyDashboard(@Request() req: any) {
    return this.gdprService.getPrivacyDashboard(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('export')
  async requestExport(
    @Request() req: any,
    @Body() body: { format?: string },
  ) {
    return this.gdprService.requestDataExport(req.user.id, body.format || 'json');
  }

  @UseGuards(JwtAuthGuard)
  @Get('export/status')
  async getExportStatus(@Request() req: any) {
    return this.gdprService.getExportStatus(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('exports/download/:fileName')
  async downloadExport(
    @Request() req: any,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    // Sanitize filename
    const safeName = fileName.replace(/[^a-zA-Z0-9_.\-]/g, '');
    if (!safeName.startsWith('export_')) {
      throw new BadRequestException('File tidak valid');
    }

    // Verify user owns this export
    const userPrefix = req.user.id.substring(0, 8);
    if (!safeName.includes(userPrefix)) {
      throw new BadRequestException('Akses ditolak');
    }

    const filePath = join(process.cwd(), 'uploads', 'exports', safeName);
    if (!filePath.startsWith(join(process.cwd(), 'uploads', 'exports')) || !existsSync(filePath)) {
      throw new BadRequestException('File tidak ditemukan atau sudah expired');
    }

    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'X-Content-Type-Options': 'nosniff',
    });

    createReadStream(filePath).pipe(res);
  }

  @UseGuards(JwtAuthGuard)
  @Post('delete-account')
  async deleteAccount(
    @Request() req: any,
    @Body() body: { confirmPassword: string },
  ) {
    if (!body.confirmPassword) {
      throw new BadRequestException('Password konfirmasi diperlukan');
    }
    return this.gdprService.requestAccountDeletion(req.user.id, body.confirmPassword);
  }

  // ── Admin endpoints ──

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get('admin/overview')
  async adminOverview() {
    return this.gdprService.adminOverview();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get('admin/exports')
  async adminExports(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.gdprService.adminListExports(Number(page) || 1, Number(limit) || 20);
  }
}
