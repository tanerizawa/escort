import { Controller, Get, Post, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { ReferralService } from './referral.service';

@Controller('referrals')
@UseGuards(JwtAuthGuard)
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('stats')
  async getStats(@Request() req: any) {
    return this.referralService.getReferralStats(req.user.id);
  }

  @Get('code')
  async getCode(@Request() req: any) {
    const code = await this.referralService.getOrCreateReferralCode(req.user.id);
    return { referralCode: code, referralLink: `https://areton.id/register?ref=${code}` };
  }

  @Get('validate/:code')
  async validate(@Param('code') code: string) {
    return this.referralService.validateCode(code);
  }

  // ── Admin endpoints ──

  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get('admin/overview')
  async adminOverview() {
    return this.referralService.adminOverview();
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get('admin/all')
  async adminList(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.referralService.adminList(Number(page) || 1, Number(limit) || 20);
  }
}
