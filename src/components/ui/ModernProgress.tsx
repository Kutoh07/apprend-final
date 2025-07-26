// src/components/ui/ModernProgress.tsx

'use client';

import React, { useEffect, useState } from 'react';

export interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'gradient' | 'success' | 'warning' | 'error';
  showValue?: boolean;
  showPercentage?: boolean;
  animated?: boolean;
  shimmer?: boolean;
  label?: string;
  className?: string;
}

export interface CircularProgressProps extends Omit<ProgressProps, 'size'> {
  size?: number;
  strokeWidth?: number;
  showCenter?: boolean;
  centerContent?: React.ReactNode;
}

const ProgressSizes = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
  xl: 'h-4'
};

const ProgressVariants = {
  default: 'bg-gradient-to-r from-primary-500 to-primary-600',
  gradient: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500',
  success: 'bg-gradient-to-r from-success-500 to-success-600',
  warning: 'bg-gradient-to-r from-warning-500 to-warning-600',
  error: 'bg-gradient-to-r from-error-500 to-error-600'
};

export const ModernProgress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showValue = false,
  showPercentage = true,
  animated = true,
  shimmer = false,
  label,
  className = ''
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayValue(percentage);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(percentage);
    }
  }, [percentage, animated]);

  const sizeClasses = ProgressSizes[size];
  const variantClasses = ProgressVariants[variant];

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            {showValue && <span>{value}</span>}
            {showValue && showPercentage && <span>/</span>}
            {showPercentage && <span>{Math.round(percentage)}%</span>}
          </div>
        </div>
      )}
      
      <div className={`progress-bar ${sizeClasses}`}>
        <div
          className={`progress-fill ${variantClasses} ${animated ? 'transition-all duration-1000 ease-out' : ''}`}
          style={{ width: `${displayValue}%` }}
        >
          {shimmer && (
            <div className="progress-shimmer" />
          )}
        </div>
      </div>
    </div>
  );
};

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  variant = 'default',
  showPercentage = true,
  animated = true,
  showCenter = true,
  centerContent,
  label,
  className = ''
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (displayValue / 100) * circumference;

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayValue(percentage);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(percentage);
    }
  }, [percentage, animated]);

  const getStrokeColor = () => {
    switch (variant) {
      case 'gradient':
        return 'url(#gradient)';
      case 'success':
        return '#22c55e';
      case 'warning':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      default:
        return '#3b82f6';
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {label && (
        <span className="text-sm font-medium text-gray-700 mb-2">{label}</span>
      )}
      
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getStrokeColor()}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={animated ? 'transition-all duration-1000 ease-out' : ''}
          />
        </svg>
        
        {showCenter && (
          <div className="absolute inset-0 flex items-center justify-center">
            {centerContent || (
              <div className="text-center">
                {showPercentage && (
                  <span className="text-2xl font-bold text-gray-900">
                    {Math.round(displayValue)}%
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Composant de barre de compétences avec label et icône
interface SkillBarProps extends ProgressProps {
  skill: string;
  icon?: string;
  level?: string;
}

export const SkillBar: React.FC<SkillBarProps> = ({
  skill,
  icon,
  level,
  value,
  ...props
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {icon && <span className="text-lg">{icon}</span>}
          <span className="text-sm font-medium text-gray-700">{skill}</span>
        </div>
        <div className="flex items-center space-x-2">
          {level && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {level}
            </span>
          )}
          <span className="text-sm font-semibold text-gray-900">
            {Math.round(value)}%
          </span>
        </div>
      </div>
      <ModernProgress value={value} showPercentage={false} {...props} />
    </div>
  );
};

// Composant de progress multi-étapes
interface StepProgressProps {
  steps: Array<{
    label: string;
    completed: boolean;
    current?: boolean;
  }>;
  className?: string;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  className = ''
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  transition-all duration-300
                  ${step.completed
                    ? 'bg-success-500 text-white'
                    : step.current
                    ? 'bg-primary-500 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                {step.completed ? '✓' : index + 1}
              </div>
              <span
                className={`
                  mt-2 text-xs text-center max-w-16
                  ${step.completed || step.current ? 'text-gray-900 font-medium' : 'text-gray-500'}
                `}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`
                  flex-1 h-1 mx-4 rounded-full transition-all duration-300
                  ${step.completed ? 'bg-success-500' : 'bg-gray-200'}
                `}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ModernProgress;
