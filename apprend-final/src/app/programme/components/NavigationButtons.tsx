// app/programme/components/NavigationButtons.tsx

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NavigationButtonsProps {
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  previousLabel?: string;
  nextLabel?: string;
}

export function NavigationButtons({ 
  onPrevious, 
  onNext, 
  canGoPrevious, 
  canGoNext,
  previousLabel = 'Précédent',
  nextLabel = 'Suivant'
}: NavigationButtonsProps) {
  return (
    <div className="flex justify-between mt-8">
      <button
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
          !canGoPrevious 
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
            : 'bg-purple-500 hover:bg-purple-600 text-white'
            
        }`}
      >
        <ChevronLeft size={20} />
        {previousLabel}
      </button>
      
      <button
        onClick={onNext}
        disabled={!canGoNext}
        className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
          !canGoNext
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
            : 'bg-purple-500 hover:bg-purple-600 text-white'
        }`}
      >
        {nextLabel}
        <ChevronRight size={20} />
      </button>
    </div>
  );
}