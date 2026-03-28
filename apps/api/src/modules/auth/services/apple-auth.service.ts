import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Apple Sign-in Service
 *
 * Verifies Apple ID tokens using Apple's public keys (JWKS).
 * Supports both web and mobile (iOS) flows.
 *
 * Required env vars:
 *   APPLE_CLIENT_ID      - App ID / Services ID (e.g., id.areton.service)
 *   APPLE_TEAM_ID        - Apple Developer Team ID
 *   APPLE_KEY_ID         - Key ID for Sign In with Apple private key
 *   APPLE_PRIVATE_KEY    - Private key (.p8) contents (base64 or raw)
 *
 * How it works:
 * 1. Frontend initiates Apple Sign-in, receives `id_token` (JWT) + `authorizationCode`
 * 2. Backend verifies `id_token` using Apple's JWKS public keys
 * 3. Extracts user info (email, sub) from verified token
 * 4. Creates or links user account
 */
@Injectable()
export class AppleAuthService {
  private readonly logger = new Logger(AppleAuthService.name);
  private readonly clientId: string;
  private readonly teamId: string;
  private readonly keyId: string;
  private readonly privateKey: string;
  private cachedAppleKeys: { keys: any[]; fetchedAt: number } | null = null;
  private readonly KEYS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private readonly config: ConfigService) {
    this.clientId = this.config.get('APPLE_CLIENT_ID', '');
    this.teamId = this.config.get('APPLE_TEAM_ID', '');
    this.keyId = this.config.get('APPLE_KEY_ID', '');
    this.privateKey = this.config.get('APPLE_PRIVATE_KEY', '');

    if (!this.clientId) {
      this.logger.warn('APPLE_CLIENT_ID not set — Apple Sign-in will run in mock mode');
    }
  }

  /**
   * Verify an Apple ID token and extract user info.
   * @param idToken - JWT from Apple Sign-in
   * @param nonce - Optional nonce for replay protection
   * @returns Verified user info { sub, email, emailVerified, isPrivateEmail }
   */
  async verifyIdToken(idToken: string, nonce?: string): Promise<{
    sub: string;         // Apple user ID (stable per app)
    email: string;
    emailVerified: boolean;
    isPrivateEmail: boolean;
  }> {
    // Mock mode for development
    if (!this.clientId) {
      this.logger.debug('[MOCK] Apple Sign-in verification');
      const payload = this.decodeJwtPayload(idToken);
      return {
        sub: payload.sub || `apple_mock_${Date.now()}`,
        email: payload.email || `apple_${Date.now()}@privaterelay.appleid.com`,
        emailVerified: true,
        isPrivateEmail: false,
      };
    }

    // 1. Decode JWT header to get the key ID (kid)
    const header = this.decodeJwtHeader(idToken);
    if (!header?.kid) {
      throw new UnauthorizedException('Invalid Apple ID token: missing kid');
    }

    // 2. Fetch Apple's public keys (JWKS)
    const applePublicKey = await this.getApplePublicKey(header.kid);
    if (!applePublicKey) {
      throw new UnauthorizedException('Apple public key not found for kid: ' + header.kid);
    }

    // 3. Verify the JWT signature
    const payload = this.verifyJwt(idToken, applePublicKey);

    // 4. Validate claims
    this.validateClaims(payload, nonce);

    return {
      sub: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified === 'true' || payload.email_verified === true,
      isPrivateEmail: payload.is_private_email === 'true' || payload.is_private_email === true,
    };
  }

  /**
   * Generate a client secret for Apple (JWT signed with your private key).
   * Used for authorization code exchange.
   */
  generateClientSecret(): string {
    if (!this.privateKey || !this.teamId || !this.keyId || !this.clientId) {
      throw new Error('Apple Sign-in not configured (missing APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY, or APPLE_CLIENT_ID)');
    }

    const now = Math.floor(Date.now() / 1000);
    const header = {
      alg: 'ES256',
      kid: this.keyId,
    };
    const payload = {
      iss: this.teamId,
      iat: now,
      exp: now + 15777000, // ~6 months
      aud: 'https://appleid.apple.com',
      sub: this.clientId,
    };

    // Build JWT manually with ES256
    const headerB64 = this.base64UrlEncode(JSON.stringify(header));
    const payloadB64 = this.base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${headerB64}.${payloadB64}`;

    const privateKeyObj = crypto.createPrivateKey({
      key: this.privateKey.replace(/\\n/g, '\n'),
      format: 'pem',
    });

    const sign = crypto.createSign('SHA256');
    sign.update(signingInput);
    const signature = sign.sign({ key: privateKeyObj, dsaEncoding: 'ieee-p1363' });
    const signatureB64 = this.base64UrlEncode(signature);

    return `${signingInput}.${signatureB64}`;
  }

  /**
   * Exchange authorization code for tokens (used in web flow).
   */
  async exchangeAuthorizationCode(code: string): Promise<{
    accessToken: string;
    idToken: string;
    refreshToken: string;
  }> {
    const clientSecret = this.generateClientSecret();

    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
    });

    const response = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Apple token exchange failed: ${response.status} ${errorText}`);
      throw new UnauthorizedException('Apple authorization code exchange failed');
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      idToken: data.id_token,
      refreshToken: data.refresh_token,
    };
  }

  // ── Private helpers ──────────────────────────────────

  private async getApplePublicKey(kid: string): Promise<crypto.KeyObject | null> {
    // Fetch JWKS from Apple (cached)
    if (!this.cachedAppleKeys || Date.now() - this.cachedAppleKeys.fetchedAt > this.KEYS_CACHE_TTL) {
      try {
        const response = await fetch('https://appleid.apple.com/auth/keys');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const jwks = await response.json();
        this.cachedAppleKeys = { keys: jwks.keys, fetchedAt: Date.now() };
      } catch (err: any) {
        this.logger.error(`Failed to fetch Apple JWKS: ${err.message}`);
        // Try cached keys if available even if expired
        if (!this.cachedAppleKeys) return null;
      }
    }

    // Find the key matching the kid
    const key = this.cachedAppleKeys!.keys.find((k: any) => k.kid === kid);
    if (!key) return null;

    // Convert JWK to PEM
    return crypto.createPublicKey({ key, format: 'jwk' });
  }

  private verifyJwt(token: string, publicKey: crypto.KeyObject): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid JWT format');
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const signingInput = `${headerB64}.${payloadB64}`;

    // Verify signature
    const signature = Buffer.from(this.base64UrlDecode(signatureB64));
    const verify = crypto.createVerify('SHA256');
    verify.update(signingInput);

    if (!verify.verify({ key: publicKey, dsaEncoding: 'ieee-p1363' }, signature)) {
      throw new UnauthorizedException('Invalid Apple ID token signature');
    }

    // Decode and return payload
    const payload = JSON.parse(Buffer.from(this.base64UrlDecode(payloadB64)).toString());
    return payload;
  }

  private validateClaims(payload: any, nonce?: string) {
    // Check issuer
    if (payload.iss !== 'https://appleid.apple.com') {
      throw new UnauthorizedException('Invalid token issuer');
    }

    // Check audience (our client ID)
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(this.clientId)) {
      throw new UnauthorizedException('Invalid token audience');
    }

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new UnauthorizedException('Apple ID token expired');
    }

    // Check nonce if provided
    if (nonce && payload.nonce !== nonce) {
      throw new UnauthorizedException('Invalid token nonce');
    }
  }

  private decodeJwtHeader(token: string): any {
    try {
      const headerB64 = token.split('.')[0];
      return JSON.parse(Buffer.from(this.base64UrlDecode(headerB64)).toString());
    } catch {
      throw new UnauthorizedException('Invalid JWT header');
    }
  }

  private decodeJwtPayload(token: string): any {
    try {
      const payloadB64 = token.split('.')[1];
      return JSON.parse(Buffer.from(this.base64UrlDecode(payloadB64)).toString());
    } catch {
      return {};
    }
  }

  private base64UrlEncode(data: string | Buffer): string {
    const buf = typeof data === 'string' ? Buffer.from(data) : data;
    return buf.toString('base64url');
  }

  private base64UrlDecode(str: string): string {
    // Add padding
    const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
    return Buffer.from(padded, 'base64').toString('binary');
  }
}
