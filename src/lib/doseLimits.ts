import { DoseLimit } from './types';

export const DOSE_LIMITS: DoseLimit[] = [
  {
    ingredient: 'acetaminophen',
    maxDailyMg: 3000,
    warningThresholdMg: 2400,
    isHardLimit: true,
  },
  {
    ingredient: 'ibuprofen',
    maxDailyMg: 1200,
    warningThresholdMg: 800,
    isHardLimit: true,
  },
  {
    ingredient: 'naproxen',
    maxDailyMg: 660,
    warningThresholdMg: 440,
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
    warningThresholdMg: 300,
    isHardLimit: false,
  },
  {
    ingredient: 'pamabrom',
    maxDailyMg: 200,
    isHardLimit: false,
  },
  {
    ingredient: 'pyrilamine',
    maxDailyMg: 200,
    isHardLimit: false,
  },
];
