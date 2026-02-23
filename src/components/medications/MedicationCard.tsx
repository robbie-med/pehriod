import { Medication, ActiveIngredient } from '../../lib/types';
import { CompositionBreakdown } from './CompositionBreakdown';

interface MedicationCardProps {
  medication: Medication;
  name: string;
  description: string;
  ingredientLabels: Record<ActiveIngredient, string>;
}

export function MedicationCard({
  medication,
  name,
  description,
  ingredientLabels,
}: MedicationCardProps) {
  const borderColors = {
    pink: 'border-pink-500',
    orange: 'border-orange-500',
    blue: 'border-blue-500',
    green: 'border-green-500',
  };

  return (
    <div
      className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${borderColors[medication.color]}`}
    >
      <h3 className="font-bold text-lg">{name}</h3>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
      <CompositionBreakdown
        composition={medication.composition}
        ingredientLabels={ingredientLabels}
      />
    </div>
  );
}
