import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@/config/redis.service';
import * as crypto from 'crypto';

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

interface FCMTokenEntry {
  token: string;
  platform: 'web' | 'android' | 'ios';
  createdAt: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly projectId: string;
  private readonly clientEmail: string;
  private readonly privateKey: string;
  private readonly isMock: boolean;
  private cachedAccessToken: { token: string; expiresAt: number } | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
  ) {
    this.projectId = this.configService.get<string>('FIREBASE_PROJECT_ID', '');
    this.clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL', '');
    this.privateKey = (this.configService.get<string>('FIREBASE_PRIVATE_KEY', '') || '')
      .replace(/\\n/g, '\n');
    this.isMock = !this.projectId || !this.clientEmail || !this.privateKey;

    if (this.isMock) {
      this.logger.warn('⚠️  Firebase not configured — push notifications in MOCK mode');
    } else {
      this.logger.log('✅ Firebase Push Notification service initialized');
    }
  }

  // ════════════════════════════════════════════
  //  Device Token Management (Redis-backed)
  // ════════════════════════════════════════════

  /**
   * Register a device FCM token for a user.
   * Supports multiple devices per user.
   */
  async registerToken(userId: string, token: string, platform: 'web' | 'android' | 'ios' = 'web'): Promise<void> {
    const key = `fcm:tokens:${userId}`;
    const tokens = await this.getTokens(userId);

    // Avoid duplicate tokens
    const existing = tokens.find((t) => t.token === token);
    if (existing) return;

    // Limit to 10 devices per user
    if (tokens.length >= 10) {
      tokens.shift(); // remove oldest
    }

    tokens.push({ token, platform, createdAt: new Date().toISOString() });
    await this.redis.setJSON(key, tokens);
    this.logger.debug(`Registered FCM token for user ${userId} (${platform})`);
  }

  /**
   * Remove a device token (on logout or token refresh).
   */
  async removeToken(userId: string, token: string): Promise<void> {
    const key = `fcm:tokens:${userId}`;
    const tokens = await this.getTokens(userId);
    const filtered = tokens.filter((t) => t.token !== token);
    if (filtered.length > 0) {
      await this.redis.setJSON(key, filtered);
    } else {
      await this.redis.del(key);
    }
  }

  /**
   * Get all registered tokens for a user.
   */
  private async getTokens(userId: string): Promise<FCMTokenEntry[]> {
    return (await this.redis.getJSON<FCMTokenEntry[]>(`fcm:tokens:${userId}`)) || [];
  }

  // ════════════════════════════════════════════
  //  Send Push Notifications
  // ════════════════════════════════════════════

  /**
   * Send push notification to a specific user (all their devices).
   */
  async sendToUser(userId: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
    const tokens = await this.getTokens(userId);
    if (tokens.length === 0) {
      this.logger.debug(`No FCM tokens for user ${userId}, skipping push`);
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;
    const invalidTokens: string[] = [];

    for (const entry of tokens) {
      try {
        const success = await this.sendToToken(entry.token, payload);
        if (success) {
          sent++;
        } else {
          failed++;
          invalidTokens.push(entry.token);
        }
      } catch (err: any) {
        failed++;
        this.logger.error(`Push to ${entry.platform} device failed: ${err.message}`);
      }
    }

    // Clean up invalid tokens
    for (const token of invalidTokens) {
      await this.removeToken(userId, token);
    }

    return { sent, failed };
  }

  /**
   * Send push notification to multiple users.
   */
  async sendToUsers(userIds: string[], payload: PushPayload): Promise<void> {
    const promises = userIds.map((uid) =>
      this.sendToUser(uid, payload).catch((err) =>
        this.logger.error(`Push to user ${uid} failed: ${err.message}`),
      ),
    );
    await Promise.allSettled(promises);
  }

  /**
   * Send to a single FCM token via FCM HTTP v1 API.
   * Returns true if successful, false if token is invalid/expired.
   */
  private async sendToToken(token: string, payload: PushPayload): Promise<boolean> {
    if (this.isMock) {
      this.logger.log(`[MOCK PUSH] → ${token.substring(0, 20)}... | ${payload.title}: ${payload.body}`);
      return true;
    }

    const accessToken = await this.getAccessToken();
    const url = `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`;

    const message: Record<string, any> = {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      android: {
        priority: 'high',
        notification: {
          channelId: 'areton_default',
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      webpush: {
        notification: {
          icon: '/icons/icon-192.png',
          badge: '/icons/badge-72.png',
        },
        fcmOptions: {
          link: 'https://areton.id',
        },
      },
    };

    if (payload.imageUrl) {
      message.notification.image = payload.imageUrl;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ message }),
    });

    if (response.ok) {
      return true;
    }

    const errorBody = await response.json().catch(() => ({}));
    const errorCode = errorBody?.error?.details?.[0]?.errorCode || errorBody?.error?.status;

    // Token is invalid/expired — caller should clean up
    if (
      response.status === 404 ||
      errorCode === 'UNREGISTERED' ||
      errorCode === 'INVALID_ARGUMENT'
    ) {
      this.logger.warn(`FCM token invalid, will be removed: ${token.substring(0, 20)}...`);
      return false;
    }

    this.logger.error(`FCM send failed (${response.status}): ${JSON.stringify(errorBody)}`);
    return true; // Don't remove token on transient errors
  }

  // ════════════════════════════════════════════
  //  Pre-built Push Templates
  // ════════════════════════════════════════════

  async pushBookingConfirmed(userId: string, escortName: string, bookingId: string): Promise<void> {
    await this.sendToUser(userId, {
      title: 'Booking Dikonfirmasi ✅',
      body: `${escortName} telah menerima booking Anda`,
      data: { type: 'BOOKING', bookingId, action: 'CONFIRMED' },
    });
  }

  async pushBookingCancelled(userId: string, reason: string, bookingId: string): Promise<void> {
    await this.sendToUser(userId, {
      title: 'Booking Dibatalkan',
      body: reason,
      data: { type: 'BOOKING', bookingId, action: 'CANCELLED' },
    });
  }

  async pushBookingCompleted(userId: string, bookingId: string): Promise<void> {
    await this.sendToUser(userId, {
      title: 'Booking Selesai 🎉',
      body: 'Berikan review untuk pengalaman Anda',
      data: { type: 'BOOKING', bookingId, action: 'COMPLETED' },
    });
  }

  async pushNewBookingRequest(escortId: string, clientName: string, bookingId: string): Promise<void> {
    await this.sendToUser(escortId, {
      title: 'Booking Baru 📋',
      body: `Permintaan booking dari ${clientName}`,
      data: { type: 'BOOKING', bookingId, action: 'NEW_REQUEST' },
    });
  }

  async pushPaymentReceived(userId: string, amount: string, bookingId: string): Promise<void> {
    await this.sendToUser(userId, {
      title: 'Pembayaran Diterima 💰',
      body: `Pembayaran Rp ${amount} berhasil diproses`,
      data: { type: 'PAYMENT', bookingId, action: 'RECEIVED' },
    });
  }

  async pushPaymentReleased(escortId: string, amount: string): Promise<void> {
    await this.sendToUser(escortId, {
      title: 'Dana Dicairkan 🏦',
      body: `Rp ${amount} telah ditransfer ke rekening Anda`,
      data: { type: 'PAYMENT', action: 'RELEASED' },
    });
  }

  async pushNewMessage(userId: string, senderName: string, bookingId: string): Promise<void> {
    await this.sendToUser(userId, {
      title: `Pesan dari ${senderName}`,
      body: 'Anda memiliki pesan baru',
      data: { type: 'CHAT', bookingId, action: 'NEW_MESSAGE' },
    });
  }

  async pushNewReview(escortId: string, rating: number): Promise<void> {
    await this.sendToUser(escortId, {
      title: 'Review Baru ⭐',
      body: `Anda mendapat review bintang ${rating}`,
      data: { type: 'REVIEW', action: 'NEW_REVIEW' },
    });
  }

  // ════════════════════════════════════════════
  //  Google OAuth2 JWT → Access Token
  //  (Service Account authentication for FCM v1)
  // ════════════════════════════════════════════

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5 min buffer)
    if (this.cachedAccessToken && Date.now() < this.cachedAccessToken.expiresAt - 300_000) {
      return this.cachedAccessToken.token;
    }

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: this.clientEmail,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    };

    const segments = [
      this.base64url(JSON.stringify(header)),
      this.base64url(JSON.stringify(payload)),
    ];
    const signingInput = segments.join('.');

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signingInput);
    const signature = sign.sign(this.privateKey, 'base64url');
    const jwt = `${signingInput}.${signature}`;

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant_type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to get Firebase access token: ${err}`);
    }

    const data = await response.json();
    this.cachedAccessToken = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    return data.access_token;
  }

  private base64url(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
