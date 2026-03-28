/**
 * Platform-wide financial constants.
 * Single source of truth — used by booking.service and payment.service.
 */
export const PLATFORM_FEE_RATE = 0.20; // 20% platform commission

export const CANCELLATION_FEE_RATES = {
  MORE_THAN_48H: 0,
  BETWEEN_24_48H: 0.25,
  LESS_THAN_24H: 0.50,
  LESS_THAN_6H: 0.75,
  NO_SHOW: 1.0,
} as const;
