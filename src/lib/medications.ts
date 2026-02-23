import { Medication } from './types';

export const MEDICATIONS: Medication[] = [
  {
    id: 'pamprin-multi',
    nameKey: 'med_pamprin_multi',
    color: 'pink',
    descriptionKey: 'med_pamprin_multi_desc',
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
    composition: [
      { ingredient: 'acetaminophen', amountMg: 500 },
      { ingredient: 'aspirin', amountMg: 250 },
      { ingredient: 'caffeine', amountMg: 65 },
    ],
    conflictsWith: ['midol-complete'],  // CRITICAL: cannot mix!
  },
  {
    id: 'midol-complete',
    nameKey: 'med_midol_complete',
    color: 'blue',
    descriptionKey: 'med_midol_complete_desc',
    composition: [
      { ingredient: 'acetaminophen', amountMg: 500 },
      { ingredient: 'caffeine', amountMg: 60 },
      { ingredient: 'pyrilamine', amountMg: 15 },
    ],
    conflictsWith: ['pamprin-max-energy'],  // CRITICAL: cannot mix!
  },
  {
    id: 'ibuprofen',
    nameKey: 'med_ibuprofen',
    color: 'orange',
    descriptionKey: 'med_ibuprofen_desc',
    composition: [
      { ingredient: 'ibuprofen', amountMg: 200 },
    ],
  },
  {
    id: 'acetaminophen',
    nameKey: 'med_acetaminophen',
    color: 'green',
    descriptionKey: 'med_acetaminophen_desc',
    composition: [
      { ingredient: 'acetaminophen', amountMg: 500 },
    ],
  },
];
