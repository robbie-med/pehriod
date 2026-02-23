import { MedicationCard } from './MedicationCard';
import { MEDICATIONS } from '../../lib/medications';
import { MedicationId, ActiveIngredient } from '../../lib/types';

interface MedicationListProps {
  title: string;
  medicationNames: Record<MedicationId, string>;
  medicationDescriptions: Record<MedicationId, string>;
  ingredientLabels: Record<ActiveIngredient, string>;
}

export function MedicationList({
  title,
  medicationNames,
  medicationDescriptions,
  ingredientLabels,
}: MedicationListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      {MEDICATIONS.map((med) => (
        <MedicationCard
          key={med.id}
          medication={med}
          name={medicationNames[med.id]}
          description={medicationDescriptions[med.id]}
          ingredientLabels={ingredientLabels}
        />
      ))}
    </div>
  );
}
