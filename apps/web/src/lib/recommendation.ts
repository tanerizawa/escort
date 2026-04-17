export type RecommendableEscort = {
  tier?: string;
  ratingAvg?: number;
  totalReviews?: number;
  totalBookings?: number;
  hourlyRate?: number;
  languages?: string[];
  bodyType?: string;
  basedIn?: string;
  travelScope?: string;
};

export type BudgetBucketId =
  | 'under-500'
  | '500-1000'
  | '1000-2500'
  | 'above-2500';

export type RecommendationPreferenceInput = {
  selectedTiers: string[];
  selectedLanguages: string[];
  selectedBasedIn: string;
  selectedTravelScope: string;
  selectedBodyType: string;
  selectedBudgetBucket?: BudgetBucketId | '';
};

export type RecommendationBreakdown = {
  score: number;
  profileMatch: number;
  contextMatch: number;
  qualityScore: number;
  behaviorSignal: number;
  reasons: string[];
};

type BudgetRange = {
  min: number;
  max: number | null;
};

const BUDGET_BUCKETS: Record<BudgetBucketId, BudgetRange> = {
  'under-500': { min: 0, max: 500000 },
  '500-1000': { min: 500000, max: 1000000 },
  '1000-2500': { min: 1000000, max: 2500000 },
  'above-2500': { min: 2500000, max: null },
};

function isRateInBudget(rate: number, bucketId: BudgetBucketId) {
  const range = BUDGET_BUCKETS[bucketId];
  if (!range) return true;
  if (rate < range.min) return false;
  if (range.max !== null && rate >= range.max) return false;
  return true;
}

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getRecommendationBreakdown(
  escort: RecommendableEscort,
  input: RecommendationPreferenceInput,
): RecommendationBreakdown {
  const reasons: string[] = [];
  const escortTier = (escort.tier || '').toUpperCase();
  const escortLanguages = escort.languages || [];

  let profileMatch = 45;
  let contextMatch = 40;

  if (input.selectedTiers.length > 0) {
    if (input.selectedTiers.includes(escortTier)) {
      profileMatch += 25;
      reasons.push(`Tier ${escortTier} sesuai preferensi`);
    } else {
      profileMatch -= 20;
    }
  }

  if (input.selectedLanguages.length > 0) {
    const overlap = escortLanguages.filter((language) =>
      input.selectedLanguages.includes(language),
    );
    if (overlap.length > 0) {
      profileMatch += 20;
      reasons.push(`Bahasa cocok: ${overlap.slice(0, 2).join(', ')}`);
    } else {
      profileMatch -= 15;
    }
  }

  if (input.selectedBodyType) {
    if ((escort.bodyType || '') === input.selectedBodyType) {
      profileMatch += 18;
      reasons.push(`Body type match (${input.selectedBodyType})`);
    } else {
      profileMatch -= 10;
    }
  }

  if (input.selectedBasedIn) {
    if ((escort.basedIn || '') === input.selectedBasedIn) {
      contextMatch += 30;
      reasons.push(`Lokasi sesuai: ${input.selectedBasedIn}`);
    } else {
      contextMatch -= 15;
    }
  }

  if (input.selectedTravelScope) {
    if ((escort.travelScope || '') === input.selectedTravelScope) {
      contextMatch += 30;
      reasons.push(`Travel scope cocok: ${input.selectedTravelScope}`);
    } else {
      contextMatch -= 15;
    }
  }

  if (input.selectedBudgetBucket) {
    const rate = escort.hourlyRate || 0;
    if (isRateInBudget(rate, input.selectedBudgetBucket)) {
      contextMatch += 22;
      reasons.push('Budget sesuai preferensi');
    } else {
      contextMatch -= 12;
    }
  }

  if (!input.selectedBasedIn && !input.selectedTravelScope && !input.selectedBodyType) {
    contextMatch += 10;
  }

  const qualityScore = clampScore(
    (escort.ratingAvg || 0) * 18 + Math.min(40, escort.totalReviews || 0) * 1.2,
  );
  const behaviorSignal = clampScore(
    Math.min(120, escort.totalBookings || 0) * 0.8 +
      Math.min(60, escort.totalReviews || 0) * 0.4,
  );

  if ((escort.ratingAvg || 0) >= 4.8) reasons.push('Rating premium stabil');
  if ((escort.totalBookings || 0) >= 50) reasons.push('Performa booking tinggi');
  if (reasons.length === 0) reasons.push('Direkomendasikan berdasarkan sinyal profil dan kualitas');

  const score = clampScore(
    0.35 * clampScore(profileMatch) +
      0.25 * clampScore(contextMatch) +
      0.25 * qualityScore +
      0.15 * behaviorSignal,
  );

  return {
    score,
    profileMatch: clampScore(profileMatch),
    contextMatch: clampScore(contextMatch),
    qualityScore,
    behaviorSignal,
    reasons: reasons.slice(0, 4),
  };
}

export function getLeaderboardScore(escort: RecommendableEscort): number {
  const qualityScore = clampScore(
    (escort.ratingAvg || 0) * 18 + Math.min(40, escort.totalReviews || 0) * 1.2,
  );
  const behaviorSignal = clampScore(
    Math.min(120, escort.totalBookings || 0) * 0.8 +
      Math.min(60, escort.totalReviews || 0) * 0.4,
  );

  // Neutral profile/context for public leaderboard where user preference is not applied.
  const score = clampScore(
    0.35 * 50 +
      0.25 * 50 +
      0.25 * qualityScore +
      0.15 * behaviorSignal,
  );

  return score;
}