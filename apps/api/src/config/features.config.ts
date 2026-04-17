import { registerAs } from '@nestjs/config';

/**
 * Phase 2+ feature toggles.
 *
 * Core MVP modules (auth, user, booking, payment, chat, review, notification,
 * safety, admin, kyc, invoice, health, metrics) are always enabled. Everything
 * else is opt-in via environment variables so small / regional deployments can
 * ship with a minimal runtime surface.
 *
 * All flags default to `true` so existing deployments keep their current
 * behaviour. Set the corresponding env var to `false` / `0` to disable.
 */
const parseBool = (raw: string | undefined, fallback = true): boolean => {
  if (raw === undefined || raw === null || raw === '') return fallback;
  return !['0', 'false', 'no', 'off'].includes(raw.trim().toLowerCase());
};

export interface FeatureFlags {
  matching: boolean;
  corporate: boolean;
  training: boolean;
  premium: boolean;
  referral: boolean;
  articles: boolean;
  testimonials: boolean;
  gdpr: boolean;
  analytics: boolean;
}

export default registerAs('features', (): FeatureFlags => ({
  matching: parseBool(process.env.ENABLE_MATCHING),
  corporate: parseBool(process.env.ENABLE_CORPORATE),
  training: parseBool(process.env.ENABLE_TRAINING),
  premium: parseBool(process.env.ENABLE_PREMIUM),
  referral: parseBool(process.env.ENABLE_REFERRAL),
  articles: parseBool(process.env.ENABLE_ARTICLES),
  testimonials: parseBool(process.env.ENABLE_TESTIMONIALS),
  gdpr: parseBool(process.env.ENABLE_GDPR),
  analytics: parseBool(process.env.ENABLE_ANALYTICS),
}));
