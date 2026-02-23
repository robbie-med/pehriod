import { IntakeRecord, MedicationId } from '../../lib/types';
import { HistoryItem } from './HistoryItem';

interface IntakeHistoryProps {
  intakeHistory: IntakeRecord[];
  onDelete: (id: string) => void;
  medicationNames: Record<MedicationId, string>;
  translations: {
    no_history: string;
    delete: string;
  };
}

export function IntakeHistory({
  intakeHistory,
  onDelete,
  medicationNames,
  translations,
}: IntakeHistoryProps) {
  // Sort by timestamp (most recent first)
  const sortedHistory = [...intakeHistory].sort(
    (a, b) => b.timestamp - a.timestamp
  );

  // Filter to last 48 hours
  const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;
  const recentHistory = sortedHistory.filter(
    (intake) => intake.timestamp > fortyEightHoursAgo
  );

  if (recentHistory.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
        <p className="text-gray-500">{translations.no_history}</p>
      </div>
    );
  }

  // Group by day
  const groupedByDay: Record<string, IntakeRecord[]> = {};
  recentHistory.forEach((intake) => {
    const date = new Date(intake.timestamp);
    const dayKey = date.toLocaleDateString();
    if (!groupedByDay[dayKey]) {
      groupedByDay[dayKey] = [];
    }
    groupedByDay[dayKey].push(intake);
  });

  return (
    <div className="space-y-6">
      {Object.entries(groupedByDay).map(([day, intakes]) => (
        <div key={day} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">{day}</h3>
          <div className="space-y-3">
            {intakes.map((intake) => (
              <HistoryItem
                key={intake.id}
                intake={intake}
                medicationName={medicationNames[intake.medicationId]}
                onDelete={() => onDelete(intake.id)}
                deleteLabel={translations.delete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
