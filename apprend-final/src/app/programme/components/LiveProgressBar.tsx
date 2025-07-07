// src/app/programme/components/LiveProgressBar.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, Target } from 'lucide-react';
import { SubPart } from '../../../lib/types/programme';

interface LiveProgressBarProps {
  subPart: SubPart;
  currentCount: number;
  onProgressUpdate?: (progress: number) => void;
}

export default function LiveProgressBar({ 
  subPart, 
  currentCount, 
  onProgressUpdate 
}: LiveProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(subPart.progress);
  const [isAnimating, setIsAnimating] = useState(false);

  const minRequired = subPart.minFields || 1;
  const maxAllowed = subPart.maxFields || Infinity;
  const newProgress = Math.min(100, Math.round((currentCount / minRequired) * 100));
  const isCompleted = newProgress >= 100;

  useEffect(() => {
    if (newProgress !== displayProgress) {
      setIsAnimating(true);
      
      // Animation progressive
      const duration = 800; // 800ms
      const steps = 20;
      const stepDuration = duration / steps;
      const progressDiff = newProgress - displayProgress;
      const stepSize = progressDiff / steps;
      
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        const intermediateProgress = displayProgress + (stepSize * currentStep);
        
        if (currentStep >= steps) {
          setDisplayProgress(newProgress);
          setIsAnimating(false);
          clearInterval(interval);
          onProgressUpdate?.(newProgress);
        } else {
          setDisplayProgress(Math.round(intermediateProgress));
        }
      }, stepDuration);

      return () => clearInterval(interval);
    }
  }, [newProgress, displayProgress, onProgressUpdate]);

  return (
    <div className="space-y-4">
      {/* Barre de progression principale */}
      <div className="relative">
        <div className="bg-gray-200 rounded-full h-6 overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${subPart.color} transition-all duration-300 flex items-center justify-end pr-3 relative ${
              isAnimating ? 'animate-pulse' : ''
            }`}
            style={{ width: `${displayProgress}%` }}
          >
            {/* Effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            
            {displayProgress > 0 && (
              <span className="text-white text-sm font-bold relative z-10">
                {displayProgress}%
              </span>
            )}
          </div>
        </div>
        
        {/* Icône de succès */}
        {isCompleted && (
          <div className="absolute -right-2 -top-2 bg-green-500 rounded-full p-1 animate-bounce">
            <CheckCircle size={16} className="text-white" />
          </div>
        )}
      </div>

      {/* Informations détaillées */}
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-gray-500" />
          <span className="text-gray-600">
            {currentCount} / {minRequired} minimum
          </span>
          {maxAllowed !== Infinity && (
            <span className="text-gray-400">
              (max: {maxAllowed})
            </span>
          )}
        </div>
        
        <div className={`font-medium ${isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
          {isCompleted ? (
            <span className="flex items-center gap-1">
              <CheckCircle size={16} />
              Complété
            </span>
          ) : (
            <span>
              {minRequired - currentCount} restant{minRequired - currentCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Barre de progression vers l'objectif maximum (optionnel) */}
      {maxAllowed !== Infinity && currentCount > minRequired && (
        <div className="mt-2">
          <div className="text-xs text-gray-500 mb-1">
            Progression vers le maximum ({maxAllowed})
          </div>
          <div className="bg-gray-100 rounded-full h-2">
            <div 
              className={`h-full bg-gradient-to-r ${subPart.color} opacity-50 rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(100, (currentCount / maxAllowed) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}