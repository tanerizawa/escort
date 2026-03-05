import { Controller, Post, Get, Delete, Body, Param, Req, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { DeviceService } from './services/device.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly deviceService: DeviceService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const result = await this.authService.login(dto);

    // Track device on successful login
    if (!result.requires2FA && (result as any).user?.id) {
      const deviceInfo = {
        userAgent: req.headers['user-agent'] || 'unknown',
        ip: (req.headers['x-forwarded-for'] as string || req.ip || '').split(',')[0].trim(),
        language: req.headers['accept-language']?.split(',')[0] || '',
        platform: req.headers['sec-ch-ua-platform'] as string || '',
      };
      const { isNewDevice, fingerprint } = await this.deviceService.trackDevice(
        (result as any).user.id,
        deviceInfo,
      );
      return { ...result, isNewDevice, deviceFingerprint: fingerprint };
    }

    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  async logout(@Body('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ── 2FA Endpoints ────────────────────────────────────

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize 2FA setup — returns secret + QR URL' })
  async setup2FA(@CurrentUser('id') userId: string) {
    return this.authService.setup2FA(userId);
  }

  @Post('2fa/verify-setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify 2FA code and enable 2FA' })
  async verify2FASetup(
    @CurrentUser('id') userId: string,
    @Body('code') code: string,
  ) {
    return this.authService.verify2FASetup(userId, code);
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify 2FA code during login' })
  async verify2FALogin(
    @Body('tempToken') tempToken: string,
    @Body('code') code: string,
  ) {
    return this.authService.verify2FALogin(tempToken, code);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable 2FA (requires current code)' })
  async disable2FA(
    @CurrentUser('id') userId: string,
    @Body('code') code: string,
  ) {
    return this.authService.disable2FA(userId, code);
  }

  @Get('2fa/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get 2FA status' })
  async get2FAStatus(@CurrentUser('id') userId: string) {
    return this.authService.get2FAStatus(userId);
  }

  // ── Device Management Endpoints ──────────────────

  @Get('devices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all known devices' })
  async getDevices(@CurrentUser('id') userId: string) {
    const devices = await this.deviceService.getUserDevices(userId);
    return { devices };
  }

  @Post('devices/:fingerprint/trust')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trust a device' })
  async trustDevice(
    @CurrentUser('id') userId: string,
    @Param('fingerprint') fingerprint: string,
  ) {
    await this.deviceService.trustDevice(userId, fingerprint);
    return { message: 'Device trusted' };
  }

  @Delete('devices/:fingerprint')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a device' })
  async revokeDevice(
    @CurrentUser('id') userId: string,
    @Param('fingerprint') fingerprint: string,
  ) {
    await this.deviceService.revokeDevice(userId, fingerprint);
    return { message: 'Device revoked' };
  }

  @Post('devices/revoke-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke all devices except current' })
  async revokeAllDevices(
    @CurrentUser('id') userId: string,
    @Body('currentFingerprint') currentFingerprint?: string,
  ) {
    const revoked = await this.deviceService.revokeAllDevices(userId, currentFingerprint);
    return { revoked, message: `${revoked} device(s) revoked` };
  }
}
