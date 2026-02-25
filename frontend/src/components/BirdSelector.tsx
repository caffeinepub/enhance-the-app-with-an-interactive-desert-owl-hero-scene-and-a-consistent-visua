import { ChevronDown } from 'lucide-react';

interface BirdSelectorProps {
  birdNames: string[];
  selectedBird: string;
  onBirdSelect: (birdName: string) => void;
  isLoading: boolean;
}

export default function BirdSelector({ birdNames, selectedBird, onBirdSelect, isLoading }: BirdSelectorProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        value={selectedBird}
        onChange={(e) => onBirdSelect(e.target.value)}
        className="w-full px-4 py-3 pr-10 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none text-right"
        dir="rtl"
      >
        <option value="">اختر نوع الطائر...</option>
        {birdNames.map((birdName) => (
          <option key={birdName} value={birdName}>
            {birdName}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
    </div>
  );
}
