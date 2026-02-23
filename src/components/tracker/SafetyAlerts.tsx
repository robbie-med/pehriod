import { SafetyViolation } from '../../lib/types';
import { Icons } from '../ui/Icons';

interface SafetyAlertsProps {
  violations: SafetyViolation[];
  onDismiss?: (violation: SafetyViolation) => void;
}

export function SafetyAlerts({ violations }: SafetyAlertsProps) {
  if (violations.length === 0) return null;

  return (
    <div className="space-y-3">
      {violations.map((violation, index) => {
        const isError = violation.severity === 'error';
        const bgColor = isError ? 'bg-red-50' : 'bg-yellow-50';
        const borderColor = isError ? 'border-red-200' : 'border-yellow-200';
        const textColor = isError ? 'text-red-800' : 'text-yellow-800';
        const iconColor = isError ? 'text-red-600' : 'text-yellow-600';

        return (
          <div
            key={`${violation.type}-${index}`}
            className={`p-4 ${bgColor} border ${borderColor} rounded-lg flex gap-3 items-start`}
          >
            <div className={`${iconColor} mt-0.5`}>
              <Icons.Alert />
            </div>
            <div className={`text-sm ${textColor} flex-1`}>
              <p className="font-semibold">
                {isError ? 'Error' : 'Warning'}
              </p>
              <p className="mt-1">
                {getViolationMessage(violation)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getViolationMessage(violation: SafetyViolation): string {
  const { details } = violation;

  switch (violation.type) {
    case 'daily-limit-exceeded':
      return `Daily limit exceeded for ${details?.ingredient}. Current: ${details?.currentMg}mg, Limit: ${details?.limitMg}mg.`;
    case 'conflicting-medications':
      return `Cannot mix this medication with ${details?.conflictingMed} in the same 24-hour period.`;
    case 'too-soon-since-last-dose':
      return `Too soon since last dose. Please wait ${details?.minutesUntilSafe} more minutes.`;
    case 'approaching-limit':
      return `Approaching daily limit for ${details?.ingredient}. Current: ${details?.currentMg}mg, Limit: ${details?.limitMg}mg.`;
    default:
      return 'Safety warning detected.';
  }
}
