import { useState } from 'react';
import { MedicationId, SafetyViolation } from '../../lib/types';
import { Icons } from '../ui/Icons';
import { SafetyAlerts } from './SafetyAlerts';

interface DoseLogModalProps {
  isOpen: boolean;
  medicationId: MedicationId;
  medicationName: string;
  scheduledTime?: string;
  painLevel: number;
  violations: SafetyViolation[];
  onConfirm: (medicationId: MedicationId, scheduledTime?: string) => void;
  onCancel: () => void;
  confirmLabel: string;
  cancelLabel: string;
}

export function DoseLogModal({
  isOpen,
  medicationId,
  medicationName,
  scheduledTime,
  painLevel,
  violations,
  onConfirm,
  onCancel,
  confirmLabel,
  cancelLabel,
}: DoseLogModalProps) {
  const [customTime] = useState(scheduledTime);

  if (!isOpen) return null;

  const hasErrors = violations.some((v) => v.severity === 'error');
  const canConfirm = !hasErrors;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {confirmLabel}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <Icons.X />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Medication</p>
            <p className="text-lg font-semibold text-gray-900">{medicationName}</p>
          </div>

          {customTime && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Scheduled Time</p>
              <p className="text-lg font-semibold text-gray-900">{customTime}</p>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Current Pain Level</p>
            <p className="text-lg font-semibold text-gray-900">{painLevel}/10</p>
          </div>

          {violations.length > 0 && <SafetyAlerts violations={violations} />}

          <div className="flex gap-3 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => onConfirm(medicationId, customTime)}
              disabled={!canConfirm}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                canConfirm
                  ? 'bg-pink-500 text-white hover:bg-pink-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
