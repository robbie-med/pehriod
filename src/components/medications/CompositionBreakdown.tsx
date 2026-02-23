import { IngredientAmount, ActiveIngredient } from '../../lib/types';

interface CompositionBreakdownProps {
  composition: IngredientAmount[];
  ingredientLabels: Record<ActiveIngredient, string>;
}

export function CompositionBreakdown({
  composition,
  ingredientLabels,
}: CompositionBreakdownProps) {
  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <p className="text-xs font-semibold text-gray-500 mb-2">INGREDIENTS</p>
      <ul className="space-y-1">
        {composition.map((ing) => (
          <li
            key={ing.ingredient}
            className="text-sm text-gray-700 flex justify-between"
          >
            <span>{ingredientLabels[ing.ingredient]}</span>
            <span className="font-medium">{ing.amountMg}mg</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
