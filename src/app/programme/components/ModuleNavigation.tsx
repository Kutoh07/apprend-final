// src/app/programme/components/ModuleNavigation.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ModuleService } from '@/lib/moduleService';
import { SubPart } from '../../../lib/types/programme';

interface ModuleNavigationProps {
  currentSubPartId: number;
  currentSubPart: SubPart;
  canAccessNext: boolean;
  isLoading?: boolean;
}

export default function ModuleNavigation({ 
  currentSubPartId, 
  currentSubPart, 
  canAccessNext, 
  isLoading = false 
}: ModuleNavigationProps) {
  const router = useRouter();

  const previousModule = ModuleService.getPreviousModule(currentSubPartId);
  const nextModule = ModuleService.getNextModule(currentSubPartId);

  const handlePreviousClick = () => {
    if (previousModule) {
      router.push(`/programme/${previousModule.slug}`);
    } else {
      router.push('/programme');
    }
  };

  const handleNextClick = () => {
    if (nextModule && canAccessNext) {
      router.push(`/programme/${nextModule.slug}`);
    } else if (!nextModule && canAccessNext) {
      router.push('/programme/conclusion');
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Bouton précédent */}
      <button
        onClick={handlePreviousClick}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
      >
        <ChevronLeft size={20} />
        <span className="hidden sm:inline">
          {previousModule ? previousModule.name : 'Programme'}
        </span>
      </button>

      {/* Indicateur de position */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
        <div className={`text-4xl ${!isLoading ? '' : 'opacity-50'}`}>
          {currentSubPart.icon}
        </div>
        <div className="text-center">
          <div className={`font-bold text-sm bg-gradient-to-r ${currentSubPart.color} bg-clip-text text-transparent`}>
            {currentSubPart.name}
          </div>
          <div className="text-xs text-gray-500">
            {currentSubPartId}/8
          </div>
        </div>
      </div>

      {/* Bouton suivant */}
      <button
        onClick={handleNextClick}
        disabled={!canAccessNext || isLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
          canAccessNext && !isLoading
            ? 'bg-purple-500 hover:bg-purple-600 text-white transform hover:scale-105'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50 blur-sm'
        }`}
      >
        <span className="hidden sm:inline">
          {nextModule ? nextModule.name : 'Terminer'}
        </span>
        <ChevronRight size={20} />
      </button>
    </div>
  );
}