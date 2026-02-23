interface SymptomSliderProps {
  painLevel: number;
  onPainLevelChange: (level: number) => void;
  label: string;
}

export function SymptomSlider({
  painLevel,
  onPainLevelChange,
  label,
}: SymptomSliderProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}: {painLevel}
      </label>
      <input
        type="range"
        min="0"
        max="10"
        value={painLevel}
        onChange={(e) => onPainLevelChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
        aria-label={`${label} slider`}
      />
      <div className="flex justify-between text-xs text-gray-400 mt-2">
        <span>🙂</span>
        <span>😐</span>
        <span>😫</span>
      </div>
    </div>
  );
}
