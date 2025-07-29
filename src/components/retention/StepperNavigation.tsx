// src/components/retention/StepperNavigation.tsx

'use client';

import React from 'react';
import { Check, Lock } from 'lucide-react';
import type { StepperNavigationProps } from '@/lib/types/retention';

export default function StepperNavigation({ 
  steps, 
  currentStep, 
  onStepChange, 
  className = '' 
}: StepperNavigationProps) {
  
  const handleStepClick = (stepId: number) => {
    const step = steps.find(s => s.id === stepId);
    if (step && !step.locked) {
      onStepChange(stepId);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Navigation desktop */}
      <div className="hidden md:flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              {/* Cercle de l'étape */}
              <button
                onClick={() => handleStepClick(step.id)}
                disabled={step.locked}
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold
                  transition-all duration-300 transform hover:scale-105
                  ${step.completed
                    ? 'bg-green-500 text-white shadow-lg'
                    : step.current
                    ? 'bg-gradient-to-r ' + step.color + ' text-white shadow-lg animate-pulse'
                    : step.locked
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-2 border-gray-300 text-gray-600 hover:border-gray-400 cursor-pointer'
                  }
                `}
              >
                {step.completed ? (
                  <Check className="w-6 h-6" />
                ) : step.locked ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <span className="text-lg">{step.icon}</span>
                )}
              </button>
              
              {/* Label de l'étape */}
              <div className="mt-3 text-center max-w-20">
                <div className={`text-xs font-medium ${
                  step.completed || step.current 
                    ? 'text-gray-900' 
                    : 'text-gray-500'
                }`}>
                  Étape {step.id}
                </div>
              </div>
            </div>
            
            {/* Ligne de connexion */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-4">
                <div className={`h-full transition-all duration-500 ${
                  steps[index + 1].completed || steps[index + 1].current
                    ? 'bg-gradient-to-r from-green-500 to-blue-500'
                    : 'bg-gray-200'
                }`} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Navigation mobile */}
      <div className="md:hidden mb-6">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">
              Étape {currentStep} sur {steps.length}
            </span>
            <span className="text-xs text-gray-500">
              {Math.round((currentStep / steps.length) * 100)}% terminé
            </span>
          </div>
          
          {/* Barre de progression mobile */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
          
          {/* Titre de l'étape courante */}
          <div className="mt-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {steps.find(s => s.current)?.title}
            </h3>
            {steps.find(s => s.current)?.subtitle && (
              <p className="text-sm text-gray-600 mt-1">
                {steps.find(s => s.current)?.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Indicateur de progression global */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progression globale</span>
          <span>{Math.round((steps.filter(s => s.completed).length / steps.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-yellow-400 via-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(steps.filter(s => s.completed).length / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
