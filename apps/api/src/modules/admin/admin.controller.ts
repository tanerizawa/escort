import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditService } from '@/common/services/audit.service';

@Controller('admin')
@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AuditService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  async getStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users (with filters)' })
  async listUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.listUsers(page, limit, role, search);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user detail by ID' })
  async getUserDetail(@Param('id') userId: string) {
    return this.adminService.getUserDetail(userId);
  }

  @Get('users/:id/location')
  @ApiOperation({ summary: 'Get user live location from active bookings' })
  async getUserLocation(@Param('id') userId: string) {
    return this.adminService.getUserLiveLocation(userId);
  }

  @Get('escorts/pending')
  @ApiOperation({ summary: 'List escorts pending verification' })
  async getPendingEscorts(@Query('page') page?: number) {
    return this.adminService.getPendingEscorts(page);
  }

  @Patch('escorts/:id/verify')
  @ApiOperation({ summary: 'Approve or reject escort' })
  async verifyEscort(
    @Param('id') escortProfileId: string,
    @Body() body: { approved: boolean; reason?: string },
  ) {
    return this.adminService.verifyEscort(escortProfileId, body.approved, body.reason);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Activate or deactivate user' })
  async updateUserStatus(
    @Param('id') userId: string,
    @Body() body: { isActive: boolean; reason?: string },
  ) {
    return this.adminService.updateUserStatus(userId, body.isActive);
  }

  @Get('bookings/monitor')
  @ApiOperation({ summary: 'Get active bookings with live tracking for monitoring' })
  async getActiveBookingsMonitor() {
    return this.adminService.getActiveBookingsMonitor();
  }

  @Get('bookings/:id/monitor')
  @ApiOperation({ summary: 'Get detailed booking monitor view with tracking, timeline, chat' })
  async getBookingMonitorDetail(@Param('id') bookingId: string) {
    return this.adminService.getBookingMonitorDetail(bookingId);
  }

  @Get('incidents')
  @ApiOperation({ summary: 'List all incident reports' })
  async listIncidents(
    @Query('page') page?: number,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.adminService.listIncidents(page, status, type);
  }

  @Patch('incidents/:id/resolve')
  @ApiOperation({ summary: 'Resolve an incident' })
  async resolveIncident(
    @Param('id') incidentId: string,
    @Body() body: { adminNotes: string },
  ) {
    return this.adminService.resolveIncident(incidentId, body.adminNotes);
  }

  @Get('finance/summary')
  @ApiOperation({ summary: 'Get financial summary' })
  async getFinanceSummary(@Query('period') period?: string) {
    return this.adminService.getFinanceSummary(period);
  }

  @Put('config/commission')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Update platform commission rate' })
  async updateCommission(
    @Body() body: {
      commissionRate?: number;
      cancellationFees?: { hoursBeforeStart: number; feePercent: number }[];
      minBookingHours?: number;
      maxBookingHours?: number;
      supportEmail?: string;
    },
  ) {
    return this.adminService.updateCommissionConfig(body);
  }

  @Get('config')
  @ApiOperation({ summary: 'Get platform configuration' })
  async getConfig() {
    return this.adminService.getConfig();
  }

  // ── Audit Logs ───────────────────────────────────────

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs (filterable)' })
  async getAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('severity') severity?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.auditService.getAuditLogs({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      userId,
      action,
      resource,
      severity,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('audit-logs/user/:userId')
  @ApiOperation({ summary: 'Get audit trail for a specific user' })
  async getUserAuditTrail(@Param('userId') userId: string) {
    return this.auditService.getUserAuditTrail(userId);
  }

  // ── Promo Codes (P8-12) ────────────────────────────

  @Post('promo-codes')
  @ApiOperation({ summary: 'Create promo code' })
  async createPromoCode(
    @Body() body: {
      code: string;
      description?: string;
      discountType: string;
      discountValue: number;
      minOrderAmount?: number;
      maxDiscount?: number;
      usageLimit?: number;
      validFrom: string;
      validUntil: string;
    },
  ) {
    return this.adminService.createPromoCode(body);
  }

  @Get('promo-codes')
  @ApiOperation({ summary: 'List promo codes' })
  async listPromoCodes(
    @Query('page') page?: number,
    @Query('active') active?: string,
  ) {
    return this.adminService.listPromoCodes(
      page ? Number(page) : 1,
      active === 'true' ? true : active === 'false' ? false : undefined,
    );
  }

  @Patch('promo-codes/:id')
  @ApiOperation({ summary: 'Update promo code' })
  async updatePromoCode(
    @Param('id') id: string,
    @Body() body: {
      isActive?: boolean;
      usageLimit?: number;
      validUntil?: string;
      maxDiscount?: number;
    },
  ) {
    return this.adminService.updatePromoCode(id, body);
  }

  @Delete('promo-codes/:id')
  @ApiOperation({ summary: 'Delete promo code' })
  async deletePromoCode(@Param('id') id: string) {
    return this.adminService.deletePromoCode(id);
  }

  // ── Certifications ──────────────────────────────────

  @Get('certifications/pending')
  @ApiOperation({ summary: 'List pending certifications' })
  async getPendingCertifications(@Query('page') page?: number) {
    return this.adminService.getPendingCertifications(page ? Number(page) : 1);
  }

  @Patch('certifications/:id/verify')
  @ApiOperation({ summary: 'Approve or reject a certification' })
  async verifyCertification(
    @Param('id') certId: string,
    @Body() body: { approved: boolean },
  ) {
    return this.adminService.verifyCertification(certId, body.approved);
  }
}
