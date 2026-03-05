import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHmac } from 'crypto';
import { PrismaService } from '@/config/prisma.service';
import { RedisService } from '@/config/redis.service';
import { AuditService } from '@/common/services/audit.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role || 'CLIENT',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    // If registering as escort, create escort profile
    if (dto.role === 'ESCORT') {
      await this.prisma.escortProfile.create({
        data: {
          userId: user.id,
          hourlyRate: 0,
          languages: [],
          skills: [],
          portfolioUrls: [],
        },
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.role);

    return {
      user,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Return partial response — client must verify 2FA
      const tempToken = await this.jwt.signAsync(
        { sub: user.id, purpose: '2fa-verify' },
        { secret: this.config.get('jwt.accessSecret'), expiresIn: '5m' },
      );
      return {
        requires2FA: true,
        tempToken,
        user: { id: user.id, email: user.email },
      };
    }

    // Audit login
    await this.audit.log({
      userId: user.id,
      action: 'LOGIN',
      resource: 'auth',
      severity: 'INFO',
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profilePhoto: user.profilePhoto,
        isVerified: user.isVerified,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get('jwt.refreshSecret'),
      });

      // Check if token is blacklisted
      const isBlacklisted = await this.redis.exists(`bl_refresh:${refreshToken}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Blacklist old refresh token (rotation)
      await this.redis.set(`bl_refresh:${refreshToken}`, '1', 7 * 24 * 60 * 60);

      // Generate new tokens
      return this.generateTokens(payload.sub, payload.role);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    // Blacklist the refresh token
    await this.redis.set(`bl_refresh:${refreshToken}`, '1', 7 * 24 * 60 * 60);
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');

    // Store token in Redis with 1 hour expiry
    await this.redis.set(
      `pwd_reset:${resetToken}`,
      JSON.stringify({ userId: user.id, email: user.email }),
      60 * 60, // 1 hour
    );

    // TODO: Send email via SendGrid/Nodemailer
    // const resetUrl = `${this.config.get('app.frontendUrl')}/reset-password?token=${resetToken}`;
    // await this.emailService.sendPasswordReset(user.email, resetUrl);

    return {
      message: 'If the email exists, a reset link has been sent',
      // Only include token in development for testing
      ...(this.config.get('app.nodeEnv') === 'development' && { resetToken }),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    // Get token data from Redis
    const tokenData = await this.redis.get(`pwd_reset:${dto.token}`);

    if (!tokenData) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const { userId } = JSON.parse(tokenData);

    // Hash new password
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Delete used token
    await this.redis.del(`pwd_reset:${dto.token}`);

    // Invalidate all existing sessions by incrementing a version counter
    await this.redis.set(`pwd_version:${userId}`, Date.now().toString(), 30 * 24 * 60 * 60);

    return { message: 'Password has been reset successfully' };
  }

  // ── 2FA TOTP Management (P6-BE-08) ─────────────────

  async setup2FA(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User tidak ditemukan');
    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA sudah aktif');
    }

    // Generate TOTP secret (base32 compatible)
    const secret = this.generateTOTPSecret();

    // Store secret temporarily in Redis until user verifies
    await this.redis.setJSON(`2fa_setup:${userId}`, { secret }, 600); // 10 min expiry

    // Generate otpauth URL for QR code
    const issuer = 'ARETON.id';
    const otpauthUrl = `otpauth://totp/${issuer}:${user.email}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

    return {
      secret,
      otpauthUrl,
      message: 'Scan QR code lalu verifikasi dengan kode 6 digit',
    };
  }

  async verify2FASetup(userId: string, code: string) {
    const setupData = await this.redis.getJSON<{ secret: string }>(`2fa_setup:${userId}`);

    if (!setupData) {
      throw new BadRequestException('Setup 2FA expired. Silakan mulai ulang.');
    }

    const isValid = this.verifyTOTP(setupData.secret, code);
    if (!isValid) {
      throw new BadRequestException('Kode tidak valid');
    }

    // Enable 2FA and store secret
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: setupData.secret,
      },
    });

    // Clean up temp data
    await this.redis.del(`2fa_setup:${userId}`);

    // Generate backup codes
    const backupCodes = Array.from({ length: 8 }, () =>
      randomBytes(4).toString('hex').toUpperCase(),
    );
    await this.redis.setJSON(`2fa_backup:${userId}`, backupCodes);

    await this.audit.log({
      userId,
      action: '2FA_ENABLED',
      resource: 'auth',
      severity: 'INFO',
    });

    return {
      message: '2FA berhasil diaktifkan',
      backupCodes,
    };
  }

  async verify2FALogin(tempToken: string, code: string) {
    let payload: any;
    try {
      payload = this.jwt.verify(tempToken, {
        secret: this.config.get('jwt.accessSecret'),
      });
    } catch {
      throw new UnauthorizedException('Token tidak valid atau sudah expired');
    }

    if (payload.purpose !== '2fa-verify') {
      throw new UnauthorizedException('Token tidak valid');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    // Try TOTP code first
    let isValid = this.verifyTOTP(user.twoFactorSecret, code);

    // If TOTP fails, try backup codes
    if (!isValid) {
      const backupCodes = await this.redis.getJSON<string[]>(`2fa_backup:${user.id}`);
      if (backupCodes) {
        const codeIndex = backupCodes.indexOf(code.toUpperCase());
        if (codeIndex !== -1) {
          isValid = true;
          // Remove used backup code
          backupCodes.splice(codeIndex, 1);
          await this.redis.setJSON(`2fa_backup:${user.id}`, backupCodes);
        }
      }
    }

    if (!isValid) {
      await this.audit.log({
        userId: user.id,
        action: '2FA_FAILED',
        resource: 'auth',
        severity: 'WARN',
      });
      throw new UnauthorizedException('Kode 2FA tidak valid');
    }

    await this.audit.log({
      userId: user.id,
      action: 'LOGIN_2FA',
      resource: 'auth',
      severity: 'INFO',
    });

    const tokens = await this.generateTokens(user.id, user.role);
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profilePhoto: user.profilePhoto,
        isVerified: user.isVerified,
      },
      ...tokens,
    };
  }

  async disable2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User tidak ditemukan');
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA tidak aktif');
    }

    const isValid = this.verifyTOTP(user.twoFactorSecret, code);
    if (!isValid) {
      throw new BadRequestException('Kode tidak valid');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    await this.redis.del(`2fa_backup:${userId}`);

    await this.audit.log({
      userId,
      action: '2FA_DISABLED',
      resource: 'auth',
      severity: 'WARN',
    });

    return { message: '2FA berhasil dinonaktifkan' };
  }

  async get2FAStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    if (!user) throw new NotFoundException('User tidak ditemukan');

    return { twoFactorEnabled: user.twoFactorEnabled };
  }

  // ── TOTP Helpers ─────────────────────────────────────

  private generateTOTPSecret(): string {
    // Generate a random base32 secret (20 bytes = 32 chars in base32)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    const bytes = randomBytes(20);
    for (let i = 0; i < 20; i++) {
      secret += chars[bytes[i] % 32];
    }
    return secret;
  }

  private verifyTOTP(secret: string, code: string): boolean {
    // Support current window and ±1 window (30-sec step)
    const now = Math.floor(Date.now() / 1000);
    for (let i = -1; i <= 1; i++) {
      const counter = Math.floor((now + i * 30) / 30);
      const generated = this.generateTOTPCode(secret, counter);
      if (generated === code) return true;
    }
    return false;
  }

  private generateTOTPCode(secret: string, counter: number): string {
    // Decode base32 secret
    const key = this.base32Decode(secret);

    // Counter to 8-byte buffer (big-endian)
    const buffer = Buffer.alloc(8);
    for (let i = 7; i >= 0; i--) {
      buffer[i] = counter & 0xff;
      counter = counter >> 8;
    }

    // HMAC-SHA1
    const hmac = createHmac('sha1', key);
    hmac.update(buffer);
    const hash = hmac.digest();

    // Dynamic truncation
    const offset = hash[hash.length - 1] & 0x0f;
    const code =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);

    return (code % 1000000).toString().padStart(6, '0');
  }

  private base32Decode(encoded: string): Buffer {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    for (const char of encoded.toUpperCase()) {
      const val = chars.indexOf(char);
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, '0');
    }
    const bytes: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substring(i, i + 8), 2));
    }
    return Buffer.from(bytes);
  }

  private async generateTokens(userId: string, role: string) {
    const payload = { sub: userId, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get('jwt.accessSecret'),
        expiresIn: this.config.get('jwt.accessExpiry'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get('jwt.refreshSecret'),
        expiresIn: this.config.get('jwt.refreshExpiry'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
