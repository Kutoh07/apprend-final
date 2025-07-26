// src/components/ui/ModernButton.tsx

'use client';

import React, { forwardRef } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  glow?: boolean;
  animate?: boolean;
}

const ButtonVariants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-medium hover:shadow-large border-transparent',
  secondary: 'bg-white hover:bg-gray-50 text-gray-900 shadow-soft hover:shadow-medium border-gray-200',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 hover:text-gray-900 border-transparent',
  outline: 'bg-transparent hover:bg-primary-50 text-primary-600 hover:text-primary-700 border-primary-200 hover:border-primary-300',
  danger: 'bg-error-600 hover:bg-error-700 text-white shadow-medium hover:shadow-large border-transparent',
  success: 'bg-success-600 hover:bg-success-700 text-white shadow-medium hover:shadow-large border-transparent',
  gradient: 'bg-gradient-primary hover:bg-gradient-secondary text-white shadow-medium hover:shadow-glow border-transparent'
};

const ButtonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl'
};

export const ModernButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    loadingText = 'Chargement...',
    leftIcon,
    rightIcon,
    fullWidth = false,
    glow = false,
    animate = true,
    className = '',
    disabled,
    ...props
  }, ref) => {
    const baseClasses = `
      inline-flex items-center justify-center gap-2 font-medium rounded-xl
      border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
      ${animate ? 'hover-lift' : ''}
      ${glow ? 'hover-glow' : ''}
      ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      ${fullWidth ? 'w-full' : ''}
    `;

    const variantClasses = ButtonVariants[variant];
    const sizeClasses = ButtonSizes[size];

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {loadingText}
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

ModernButton.displayName = 'ModernButton';

// Composant spécialisé pour les actions principales
export const ActionButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, rightIcon, ...props }, ref) => {
    return (
      <ModernButton
        ref={ref}
        variant="gradient"
        size="lg"
        glow
        rightIcon={rightIcon || <ArrowRight className="w-5 h-5" />}
        {...props}
      >
        {children}
      </ModernButton>
    );
  }
);

ActionButton.displayName = 'ActionButton';

export default ModernButton;
