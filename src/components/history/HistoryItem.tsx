import { IntakeRecord } from '../../lib/types';
import { Icons } from '../ui/Icons';

interface HistoryItemProps {
  intake: IntakeRecord;
  medicationName: string;
  onDelete: () => void;
  deleteLabel: string;
}

export function HistoryItem({
  intake,
  medicationName,
  onDelete,
  deleteLabel,
}: HistoryItemProps) {
  const time = new Date(intake.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{medicationName}</span>
          {intake.scheduledTime && (
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
              {intake.scheduledTime}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
          <span>{time}</span>
          {intake.painLevel !== undefined && (
            <span>Pain: {intake.painLevel}/10</span>
          )}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="text-gray-400 hover:text-red-600 transition-colors p-2"
        aria-label={deleteLabel}
      >
        <Icons.Trash />
      </button>
    </div>
  );
}
