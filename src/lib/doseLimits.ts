import { DoseLimit } from './types';

export const DOSE_LIMITS: DoseLimit[] = [
  {
    ingredient: 'acetaminophen',
    maxDailyMg: 3000,
    warningThresholdMg: 2400,  // Warn at 80%
    isHardLimit: true,
  },
  {
    ingredient: 'ibuprofen',
    maxDailyMg: 1200,
    warningThresholdMg: 960,
    isHardLimit: true,
  },
  {
    ingredient: 'aspirin',
    maxDailyMg: 4000,
    warningThresholdMg: 3200,
    isHardLimit: true,
  },
  {
    ingredient: 'caffeine',
    maxDailyMg: 400,
    warningThresholdMg: 320,
    isHardLimit: false,  // Warning only, not blocked
  },
  // Pamabrom and Pyrilamine have no hard limits in this use case
  {
    ingredient: 'pamabrom',
    maxDailyMg: 200,  // 8 doses max theoretical
    isHardLimit: false,
  },
  {
    ingredient: 'pyrilamine',
    maxDailyMg: 120,
    isHardLimit: false,
  },
];
