import { useState } from 'react';
import { MedicationId, IntakeRecord, DoseTotals, SafetyViolation } from '../../lib/types';
import { MEDICATIONS } from '../../lib/medications';
import { FIXED_SCHEDULE } from '../../lib/schedule';
import { DOSE_LIMITS } from '../../lib/doseLimits';
import { checkSafety } from '../../lib/safetyChecker';
import { hasBeenTakenRecently } from '../../lib/recommendationEngine';
import { DoseLogModal } from './DoseLogModal';
import { Icons } from '../ui/Icons';

interface MedicationTimelineProps {
  intakeHistory: IntakeRecord[];
  doseTotals: DoseTotals;
  painLevel: number;
  onLogIntake: (medicationId: MedicationId, scheduledTime?: string) => void;
  translations: {
    schedule: string;
    take: string;
    taken: string;
    choose_one: string;
    confirm_intake: string;
    cancel: string;
    note: string;
  };
  medicationNames: Record<MedicationId, string>;
}

export function MedicationTimeline({
  intakeHistory,
  doseTotals,
  painLevel,
  onLogIntake,
  translations,
  medicationNames,
}: MedicationTimelineProps) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    medicationId: MedicationId | null;
    scheduledTime?: string;
  }>({
    isOpen: false,
    medicationId: null,
  });

  const handleTakeClick = (medicationId: MedicationId, scheduledTime: string) => {
    setModalState({
      isOpen: true,
      medicationId,
      scheduledTime,
    });
  };

  const handleConfirm = (medicationId: MedicationId, scheduledTime?: string) => {
    onLogIntake(medicationId, scheduledTime);
    setModalState({ isOpen: false, medicationId: null });
  };

  const handleCancel = () => {
    setModalState({ isOpen: false, medicationId: null });
  };

  const getViolations = (medicationId: MedicationId): SafetyViolation[] => {
    return checkSafety(
      medicationId,
      doseTotals,
      intakeHistory,
      MEDICATIONS,
      DOSE_LIMITS
    );
  };

  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-4">{translations.schedule}</h2>
        <div className="space-y-4">
          {FIXED_SCHEDULE.map((slot) => {
            const isTaken = hasBeenTakenRecently(slot.time, intakeHistory, 4);

            return (
              <div key={slot.time} className="flex items-center gap-4">
                <div className="w-16 font-mono text-sm text-gray-500">
                  {slot.time}
                </div>
                <div className="flex-1 space-y-2">
                  {slot.medications.map((medId) => {
                    const med = MEDICATIONS.find((m) => m.id === medId);
                    if (!med) return null;

                    const violations = getViolations(medId);
                    const hasErrors = violations.some((v) => v.severity === 'error');
                    const isSafe = violations.length === 0;

                    let bgColor = 'bg-pink-50';
                    let borderColor = 'border-pink-100';
                    let textColor = 'text-pink-900';
                    let buttonColor = 'bg-pink-500';

                    if (med.color === 'orange') {
                      bgColor = 'bg-orange-50';
                      borderColor = 'border-orange-100';
                      textColor = 'text-orange-900';
                      buttonColor = 'bg-orange-500';
                    } else if (med.color === 'blue') {
                      bgColor = 'bg-blue-50';
                      borderColor = 'border-blue-100';
                      textColor = 'text-blue-900';
                      buttonColor = 'bg-blue-500';
                    } else if (med.color === 'green') {
                      bgColor = 'bg-green-50';
                      borderColor = 'border-green-100';
                      textColor = 'text-green-900';
                      buttonColor = 'bg-green-500';
                    }

                    return (
                      <div
                        key={medId}
                        className={`${bgColor} p-3 rounded-lg border ${borderColor} flex justify-between items-center`}
                      >
                        <div>
                          <div className={`font-semibold ${textColor}`}>
                            {medicationNames[medId]}
                          </div>
                          <div className={`text-xs ${textColor} opacity-70`}>
                            {med.composition
                              .map((ing) => `${ing.amountMg}mg ${ing.ingredient}`)
                              .join(', ')}
                          </div>
                          {slot.isChoice && (
                            <div className="text-xs text-gray-600 mt-1 italic">
                              {translations.choose_one}
                            </div>
                          )}
                        </div>
                        {isTaken ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <Icons.Check />
                            <span className="text-sm font-medium">
                              {translations.taken}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleTakeClick(medId, slot.time)}
                            disabled={hasErrors}
                            className={`px-3 py-1 rounded-full text-sm font-medium shadow-sm active:scale-95 transition-transform ${
                              hasErrors
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : `${buttonColor} text-white hover:opacity-90`
                            }`}
                          >
                            {translations.take}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3 items-start">
          <div className="text-yellow-600 mt-0.5">
            <Icons.Alert />
          </div>
          <div className="text-sm text-yellow-800">{translations.note}</div>
        </div>
      </div>

      {modalState.medicationId && (
        <DoseLogModal
          isOpen={modalState.isOpen}
          medicationId={modalState.medicationId}
          medicationName={medicationNames[modalState.medicationId]}
          scheduledTime={modalState.scheduledTime}
          painLevel={painLevel}
          violations={getViolations(modalState.medicationId)}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          confirmLabel={translations.confirm_intake}
          cancelLabel={translations.cancel}
        />
      )}
    </>
  );
}
