import { ScheduledDose } from './types';

export const FIXED_SCHEDULE: ScheduledDose[] = [
  {
    time: '01:00',
    medications: ['pamprin-multi'],
  },
  {
    time: '05:00',
    medications: ['ibuprofen'],
  },
  {
    time: '09:00',
    medications: ['pamprin-max-energy', 'midol-complete'],
    isChoice: true,  // User must choose ONE, never both
  },
  {
    time: '13:00',
    medications: ['ibuprofen'],
  },
  {
    time: '17:00',
    medications: ['acetaminophen'],
  },
  {
    time: '21:00',
    medications: ['ibuprofen'],
  },
];
