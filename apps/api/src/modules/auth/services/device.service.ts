import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { RedisService } from '@/config/redis.service';
import { AuditService } from '@/common/services/audit.service';

export interface DeviceInfo {
  userAgent: string;
  ip: string;
  language?: string;
  platform?: string;
  screenResolution?: string;
  timezone?: string;
}

export interface KnownDevice {
  fingerprint: string;
  userAgent: string;
  ip: string;
  platform: string;
  firstSeen: string;
  lastSeen: string;
  loginCount: number;
  isTrusted: boolean;
}

@Injectable()
export class DeviceService {
  private readonly DEVICE_PREFIX = 'device:user:';
  private readonly DEVICE_TTL = 60 * 60 * 24 * 90; // 90 days

  constructor(
    private readonly redis: RedisService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Generate a fingerprint from device info
   */
  generateFingerprint(device: DeviceInfo): string {
    const raw = [
      device.userAgent || '',
      device.platform || '',
      device.screenResolution || '',
      device.timezone || '',
    ].join('|');

    return createHash('sha256').update(raw).digest('hex').substring(0, 32);
  }

  /**
   * Track device on login — returns whether device is new
   */
  async trackDevice(userId: string, device: DeviceInfo): Promise<{ isNewDevice: boolean; fingerprint: string }> {
    const fingerprint = this.generateFingerprint(device);
    const key = `${this.DEVICE_PREFIX}${userId}`;
    const deviceKey = `${key}:${fingerprint}`;

    // Check if device is known
    const existingRaw = await this.redis.get(deviceKey);

    if (existingRaw) {
      // Known device — update last seen
      const existing: KnownDevice = JSON.parse(existingRaw);
      existing.lastSeen = new Date().toISOString();
      existing.loginCount += 1;
      existing.ip = device.ip; // IP may change

      await this.redis.set(deviceKey, JSON.stringify(existing), this.DEVICE_TTL);

      return { isNewDevice: false, fingerprint };
    }

    // New device detected
    const newDevice: KnownDevice = {
      fingerprint,
      userAgent: device.userAgent,
      ip: device.ip,
      platform: device.platform || this.extractPlatform(device.userAgent),
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      loginCount: 1,
      isTrusted: false,
    };

    await this.redis.set(deviceKey, JSON.stringify(newDevice), this.DEVICE_TTL);

    // Add fingerprint to user's device list
    const deviceListKey = `${key}:list`;
    const existingList = await this.redis.get(deviceListKey);
    const deviceList: string[] = existingList ? JSON.parse(existingList) : [];

    if (!deviceList.includes(fingerprint)) {
      deviceList.push(fingerprint);
      await this.redis.set(deviceListKey, JSON.stringify(deviceList), this.DEVICE_TTL);
    }

    // Audit new device
    await this.audit.log({
      userId,
      action: 'NEW_DEVICE_LOGIN',
      resource: 'auth',
      severity: 'WARN',
      details: {
        fingerprint,
        ip: device.ip,
        platform: newDevice.platform,
        userAgent: device.userAgent.substring(0, 100),
      },
    });

    return { isNewDevice: true, fingerprint };
  }

  /**
   * Get all known devices for a user
   */
  async getUserDevices(userId: string): Promise<KnownDevice[]> {
    const deviceListKey = `${this.DEVICE_PREFIX}${userId}:list`;
    const listRaw = await this.redis.get(deviceListKey);

    if (!listRaw) return [];

    const fingerprints: string[] = JSON.parse(listRaw);
    const devices: KnownDevice[] = [];

    for (const fp of fingerprints) {
      const deviceKey = `${this.DEVICE_PREFIX}${userId}:${fp}`;
      const deviceRaw = await this.redis.get(deviceKey);
      if (deviceRaw) {
        devices.push(JSON.parse(deviceRaw));
      }
    }

    // Sort by lastSeen descending
    return devices.sort(
      (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime(),
    );
  }

  /**
   * Trust a device (mark as known)
   */
  async trustDevice(userId: string, fingerprint: string): Promise<boolean> {
    const deviceKey = `${this.DEVICE_PREFIX}${userId}:${fingerprint}`;
    const raw = await this.redis.get(deviceKey);

    if (!raw) return false;

    const device: KnownDevice = JSON.parse(raw);
    device.isTrusted = true;

    await this.redis.set(deviceKey, JSON.stringify(device), this.DEVICE_TTL);
    return true;
  }

  /**
   * Revoke a device (remove it)
   */
  async revokeDevice(userId: string, fingerprint: string): Promise<boolean> {
    const deviceKey = `${this.DEVICE_PREFIX}${userId}:${fingerprint}`;
    await this.redis.del(deviceKey);

    // Remove from list
    const deviceListKey = `${this.DEVICE_PREFIX}${userId}:list`;
    const listRaw = await this.redis.get(deviceListKey);
    if (listRaw) {
      const list: string[] = JSON.parse(listRaw);
      const updated = list.filter((fp) => fp !== fingerprint);
      await this.redis.set(deviceListKey, JSON.stringify(updated), this.DEVICE_TTL);
    }

    await this.audit.log({
      userId,
      action: 'DEVICE_REVOKED',
      resource: 'auth',
      severity: 'INFO',
      details: { fingerprint },
    });

    return true;
  }

  /**
   * Revoke all devices except current
   */
  async revokeAllDevices(userId: string, currentFingerprint?: string): Promise<number> {
    const devices = await this.getUserDevices(userId);
    let revoked = 0;

    for (const device of devices) {
      if (device.fingerprint !== currentFingerprint) {
        await this.revokeDevice(userId, device.fingerprint);
        revoked++;
      }
    }

    return revoked;
  }

  /**
   * Extract platform from user agent
   */
  private extractPlatform(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('macintosh') || ua.includes('mac os')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('chrome os')) return 'ChromeOS';
    return 'Unknown';
  }
}
