import { Medication } from './types';

export const MEDICATIONS: Medication[] = [
  {
    id: 'ibuprofen',
    nameKey: 'med_ibuprofen',
    color: 'orange',
    descriptionKey: 'med_ibuprofen_desc',
    minIntervalHours: 4,
    composition: [{ ingredient: 'ibuprofen', amountMg: 400 }],
  },
  {
    id: 'naproxen',
    nameKey: 'med_naproxen',
    color: 'purple',
    descriptionKey: 'med_naproxen_desc',
    minIntervalHours: 8,
    composition: [{ ingredient: 'naproxen', amountMg: 220 }],
  },
  {
    id: 'acetaminophen',
    nameKey: 'med_acetaminophen',
    color: 'green',
    descriptionKey: 'med_acetaminophen_desc',
    minIntervalHours: 4,
    composition: [{ ingredient: 'acetaminophen', amountMg: 500 }],
  },
  {
    id: 'pamprin-multi',
    nameKey: 'med_pamprin_multi',
    color: 'pink',
    descriptionKey: 'med_pamprin_multi_desc',
    minIntervalHours: 4,
    composition: [
      { ingredient: 'acetaminophen', amountMg: 500 },
      { ingredient: 'pamabrom', amountMg: 25 },
      { ingredient: 'pyrilamine', amountMg: 15 },
    ],
  },
  {
    id: 'pamprin-max-energy',
    nameKey: 'med_pamprin_max',
    color: 'pink',
    descriptionKey: 'med_pamprin_max_desc',
    minIntervalHours: 4,
    conflictsWith: ['midol-complete'],
    composition: [
      { ingredient: 'acetaminophen', amountMg: 500 },
      { ingredient: 'aspirin', amountMg: 250 },
      { ingredient: 'caffeine', amountMg: 65 },
    ],
  },
  {
    id: 'midol-complete',
    nameKey: 'med_midol_complete',
    color: 'blue',
    descriptionKey: 'med_midol_complete_desc',
    minIntervalHours: 4,
    conflictsWith: ['pamprin-max-energy'],
    composition: [
      { ingredient: 'acetaminophen', amountMg: 500 },
      { ingredient: 'caffeine', amountMg: 60 },
      { ingredient: 'pyrilamine', amountMg: 15 },
    ],
  },
];
