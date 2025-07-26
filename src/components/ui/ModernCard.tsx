// src/components/ui/ModernCard.tsx

'use client';

import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'glass' | 'elevated' | 'bordered' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  interactive?: boolean;
  glow?: boolean;
  animate?: boolean;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  action?: React.ReactNode;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  justify?: 'start' | 'center' | 'end' | 'between';
}

const CardVariants = {
  default: 'bg-white border border-gray-200 shadow-soft',
  gradient: 'bg-gradient-primary text-white shadow-medium',
  glass: 'glass-effect shadow-medium',
  elevated: 'bg-white shadow-large border-0',
  bordered: 'bg-white border-2 border-gray-200 shadow-none',
  flat: 'bg-gray-50 border-0 shadow-none'
};

const CardPadding = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8'
};

const ContentSpacing = {
  none: 'space-y-0',
  sm: 'space-y-2',
  md: 'space-y-4',
  lg: 'space-y-6'
};

export const ModernCard = forwardRef<HTMLDivElement, CardProps>(
  ({
    children,
    variant = 'default',
    padding = 'md',
    hover = false,
    interactive = false,
    glow = false,
    animate = true,
    className = '',
    ...props
  }, ref) => {
    const baseClasses = `
      rounded-2xl transition-all duration-300
      ${animate ? (interactive ? 'hover-lift cursor-pointer' : hover ? 'hover:shadow-medium' : '') : ''}
      ${glow ? 'hover-glow' : ''}
    `;

    const variantClasses = CardVariants[variant];
    const paddingClasses = CardPadding[padding];

    return (
      <div
        ref={ref}
        className={`${baseClasses} ${variantClasses} ${paddingClasses} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ModernCard.displayName = 'ModernCard';

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({
    children,
    title,
    subtitle,
    icon: Icon,
    iconColor = 'text-primary-500',
    action,
    className = '',
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-start justify-between ${className}`}
        {...props}
      >
        <div className="flex items-start space-x-3 flex-1">
          {Icon && (
            <div className={`p-2 rounded-xl bg-gray-100 ${iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 mb-2">
                {subtitle}
              </p>
            )}
            {children}
          </div>
        </div>
        {action && (
          <div className="flex-shrink-0 ml-4">
            {action}
          </div>
        )}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({
    children,
    spacing = 'md',
    className = '',
    ...props
  }, ref) => {
    const spacingClasses = ContentSpacing[spacing];
    
    return (
      <div
        ref={ref}
        className={`${spacingClasses} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({
    children,
    justify = 'end',
    className = '',
    ...props
  }, ref) => {
    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between'
    };

    return (
      <div
        ref={ref}
        className={`flex items-center ${justifyClasses[justify]} pt-4 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

// Composant spécialisé pour les statistiques
interface StatsCardProps extends Omit<CardProps, 'children'> {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
}

export const StatsCard = forwardRef<HTMLDivElement, StatsCardProps>(
  ({
    title,
    value,
    change,
    icon: Icon,
    trend = 'neutral',
    ...props
  }, ref) => {
    const trendColors = {
      up: 'text-success-600 bg-success-50',
      down: 'text-error-600 bg-error-50',
      neutral: 'text-gray-600 bg-gray-50'
    };

    return (
      <ModernCard ref={ref} variant="elevated" hover {...props}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
            {change && (
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${trendColors[trend]}`}>
                <span className="mr-1">
                  {change.positive ? '↗' : change.positive === false ? '↘' : '→'}
                </span>
                {change.value}% {change.label}
              </div>
            )}
          </div>
          {Icon && (
            <div className="p-3 bg-primary-100 text-primary-600 rounded-xl">
              <Icon className="w-6 h-6" />
            </div>
          )}
        </div>
      </ModernCard>
    );
  }
);

StatsCard.displayName = 'StatsCard';

export default ModernCard;
