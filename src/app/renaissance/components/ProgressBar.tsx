// Barre de progression
// src/app/renaissance/components/ProgressBar.tsx

'use client';

import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  total?: number;
  current?: number;
  label?: string;
  showPercentage?: boolean;
  showFraction?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'purple' | 'green' | 'blue' | 'orange' | 'red';
  animated?: boolean;
  className?: string;
}

export default function ProgressBar({
  progress,
  total,
  current,
  label,
  showPercentage = true,
  showFraction = false,
  size = 'md',
  color = 'purple',
  animated = true,
  className = ''
}: ProgressBarProps) {
  // Nettoyer la valeur de progression
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  // Classes de taille
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  // Classes de couleur
  const colorClasses = {
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500'
  };

  // Classes de couleur pour le fond
  const bgColorClasses = {
    purple: 'bg-purple-100',
    green: 'bg-green-100',
    blue: 'bg-blue-100',
    orange: 'bg-orange-100',
    red: 'bg-red-100'
  };

  // Classes d'animation
  const animationClasses = animated ? 'transition-all duration-500 ease-out' : '';

  return (
    <div className={`w-full ${className}`}>
      {/* Label et informations */}
      {(label || showPercentage || showFraction) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700">
              {label}
            </span>
          )}
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {showFraction && total && current !== undefined && (
              <span className="font-medium">
                {current}/{total}
              </span>
            )}
            
            {showPercentage && (
              <span className="font-medium">
                {Math.round(clampedProgress)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Barre de progression */}
      <div className="relative">
        {/* Fond de la barre */}
        <div 
          className={`
            w-full rounded-full overflow-hidden
            ${sizeClasses[size]}
            ${bgColorClasses[color]}
          `}
        >
          {/* Barre de progression */}
          <div
            className={`
              h-full rounded-full relative overflow-hidden
              ${colorClasses[color]}
              ${animationClasses}
            `}
            style={{ width: `${clampedProgress}%` }}
          >
            {/* Effet de brillance animé */}
            {animated && clampedProgress > 0 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            )}
          </div>
        </div>

        {/* Indicateurs de progression (segments) */}
        {total && total <= 10 && (
          <div className="absolute inset-0 flex">
            {Array.from({ length: total }, (_, index) => (
              <div
                key={index}
                className="flex-1 border-r border-white/30 last:border-r-0"
                style={{ height: sizeClasses[size].replace('h-', '') }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Indicateurs de milestone */}
      {size === 'lg' && (
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
}

// Composant de progression circulaire
interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: 'purple' | 'green' | 'blue' | 'orange' | 'red';
  showPercentage?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function CircularProgress({
  progress,
  size = 80,
  strokeWidth = 8,
  color = 'purple',
  showPercentage = true,
  children,
  className = ''
}: CircularProgressProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  const colorClasses = {
    purple: 'stroke-purple-500',
    green: 'stroke-green-500',
    blue: 'stroke-blue-500',
    orange: 'stroke-orange-500',
    red: 'stroke-red-500'
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Cercle de fond */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />
        
        {/* Cercle de progression */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={colorClasses[color]}
          style={{
            transition: 'stroke-dashoffset 0.5s ease-in-out',
          }}
        />
      </svg>
      
      {/* Contenu central */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showPercentage && (
          <span className="text-sm font-bold text-gray-700">
            {Math.round(clampedProgress)}%
          </span>
        ))}
      </div>
    </div>
  );
}

// Composant de progression par étapes
interface StepProgressProps {
  steps: Array<{
    label: string;
    completed: boolean;
    current?: boolean;
  }>;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StepProgress({
  steps,
  orientation = 'horizontal',
  size = 'md',
  className = ''
}: StepProgressProps) {
  const sizeClasses = {
    sm: { circle: 'w-6 h-6 text-xs', text: 'text-xs' },
    md: { circle: 'w-8 h-8 text-sm', text: 'text-sm' },
    lg: { circle: 'w-10 h-10 text-base', text: 'text-base' }
  };

  const isHorizontal = orientation === 'horizontal';

  return (
    <div className={`${className}`}>
      <div className={`flex ${isHorizontal ? 'flex-row items-center' : 'flex-col'}`}>
        {steps.map((step, index) => (
          <div key={index} className={`flex ${isHorizontal ? 'items-center' : 'flex-col items-start'} ${index < steps.length - 1 ? (isHorizontal ? 'flex-1' : 'mb-4') : ''}`}>
            {/* Étape */}
            <div className="flex items-center">
              {/* Cercle */}
              <div
                className={`
                  ${sizeClasses[size].circle}
                  rounded-full flex items-center justify-center font-semibold
                  ${step.completed 
                    ? 'bg-green-500 text-white' 
                    : step.current 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                {step.completed ? '✓' : index + 1}
              </div>
              
              {/* Label */}
              {!isHorizontal && (
                <span className={`ml-3 ${sizeClasses[size].text} ${step.completed ? 'text-green-600 font-medium' : step.current ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
                  {step.label}
                </span>
              )}
            </div>

            {/* Ligne de connexion */}
            {index < steps.length - 1 && (
              <div
                className={`
                  ${isHorizontal 
                    ? 'flex-1 h-0.5 mx-2' 
                    : 'w-0.5 h-4 ml-4 mt-1'
                  }
                  ${step.completed ? 'bg-green-500' : 'bg-gray-200'}
                `}
              />
            )}

            {/* Label horizontal */}
            {isHorizontal && (
              <div className="mt-2 text-center">
                <span className={`${sizeClasses[size].text} ${step.completed ? 'text-green-600 font-medium' : step.current ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
                  {step.label}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}