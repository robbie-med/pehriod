import { DoseTotals, ActiveIngredient } from '../../lib/types';
import { DOSE_LIMITS } from '../../lib/doseLimits';

interface DoseSummaryCardProps {
  doseTotals: DoseTotals;
  title: string;
  ingredientLabels: Record<ActiveIngredient, string>;
}

export function DoseSummaryCard({
  doseTotals,
  title,
  ingredientLabels,
}: DoseSummaryCardProps) {
  const relevantIngredients: ActiveIngredient[] = [
    'acetaminophen',
    'ibuprofen',
    'aspirin',
    'caffeine',
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold mb-4">{title}</h2>
      <div className="space-y-3">
        {relevantIngredients.map((ingredient) => {
          const total = doseTotals[ingredient];
          const limit = DOSE_LIMITS.find((l) => l.ingredient === ingredient);
          if (!limit || total === 0) return null;

          const percentage = (total / limit.maxDailyMg) * 100;
          const isWarning = limit.warningThresholdMg && total >= limit.warningThresholdMg;
          const isError = limit.isHardLimit && total >= limit.maxDailyMg;

          let barColor = 'bg-green-500';
          let textColor = 'text-green-700';
          if (isError) {
            barColor = 'bg-red-500';
            textColor = 'text-red-700';
          } else if (isWarning) {
            barColor = 'bg-yellow-500';
            textColor = 'text-yellow-700';
          }

          return (
            <div key={ingredient}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">
                  {ingredientLabels[ingredient]}
                </span>
                <span className={`font-semibold ${textColor}`}>
                  {total}mg / {limit.maxDailyMg}mg
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${barColor} transition-all duration-300`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
