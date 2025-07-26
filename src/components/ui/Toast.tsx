// src/components/ui/Toast.tsx

'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  type?: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  progress?: number;
  onClose?: () => void;
  className?: string;
}

const toastStyles = {
  success: {
    bg: 'bg-gradient-to-br from-green-500 to-emerald-600',
    icon: CheckCircle,
    iconColor: 'text-white',
    titleColor: 'text-white font-bold drop-shadow-sm',
    messageColor: 'text-green-100 drop-shadow-sm',
    progressBg: 'bg-white/20',
    progressFill: 'bg-white/80'
  },
  error: {
    bg: 'bg-gradient-to-br from-red-500 to-rose-600',
    icon: AlertCircle,
    iconColor: 'text-white',
    titleColor: 'text-white font-bold drop-shadow-sm',
    messageColor: 'text-red-100 drop-shadow-sm',
    progressBg: 'bg-white/20',
    progressFill: 'bg-white/80'
  },
  warning: {
    bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    icon: AlertCircle,
    iconColor: 'text-white',
    titleColor: 'text-white font-bold drop-shadow-sm',
    messageColor: 'text-amber-100 drop-shadow-sm',
    progressBg: 'bg-white/20',
    progressFill: 'bg-white/80'
  },
  info: {
    bg: 'bg-gradient-to-br from-purple-500 to-violet-600',
    icon: Info,
    iconColor: 'text-white',
    titleColor: 'text-white font-bold drop-shadow-sm',
    messageColor: 'text-purple-100 drop-shadow-sm',
    progressBg: 'bg-white/20',
    progressFill: 'bg-white/80'
  }
};

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  title,
  message,
  progress,
  onClose,
  className = ''
}) => {
  const style = toastStyles[type];
  const IconComponent = style.icon;

  return (
    <div className={`
      ${style.bg} 
      rounded-2xl 
      p-6 
      shadow-2xl 
      border 
      border-white/20 
      backdrop-blur-sm
      animate-scale-in
      hover:scale-105
      transition-transform
      duration-300
      ${className}
    `}>
      <div className="flex items-start gap-4">
        {/* Icône */}
        <div className="flex-shrink-0">
          <IconComponent className={`w-8 h-8 ${style.iconColor} drop-shadow-lg`} />
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg ${style.titleColor} mb-1`}>
            {title}
          </h3>
          {message && (
            <p className={`text-sm ${style.messageColor} leading-relaxed mb-3`}>
              {message}
            </p>
          )}

          {/* Barre de progression si fournie */}
          {typeof progress === 'number' && (
            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs ${style.messageColor}`}>
                  Progression
                </span>
                <span className={`text-xs ${style.titleColor}`}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div className={`h-2 ${style.progressBg} rounded-full overflow-hidden`}>
                <div 
                  className={`h-full ${style.progressFill} rounded-full transition-all duration-500 ease-out`}
                  style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bouton de fermeture */}
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Fermer la notification"
          >
            <X className="w-5 h-5 text-white drop-shadow-sm" />
          </button>
        )}
      </div>
    </div>
  );
};

// Composant spécifique pour les notifications de mission accomplie
export const MissionAccomplieToast: React.FC<{
  progress?: number;
  onClose?: () => void;
  className?: string;
}> = ({ progress = 100, onClose, className }) => {
  return (
    <Toast
      type="info"
      title="🏆 Mission accomplie !"
      message="Félicitations ! Tu as terminé cette étape avec brio. Time to level up !"
      progress={progress}
      onClose={onClose}
      className={className}
    />
  );
};

// Composant pour récapitulatif d'informations
export const InfoRecapToast: React.FC<{
  title?: string;
  data: Array<{ label: string; value: string }>;
  onClose?: () => void;
  className?: string;
}> = ({ 
  title = "Récapitulatif de tes informations", 
  data, 
  onClose, 
  className 
}) => {
  return (
    <div className={`
      bg-gradient-to-br from-purple-500 to-violet-600
      rounded-2xl 
      p-6 
      shadow-2xl 
      border 
      border-white/20 
      backdrop-blur-sm
      animate-scale-in
      ${className}
    `}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-bold text-white drop-shadow-sm">
          {title}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Fermer la notification"
          >
            <X className="w-5 h-5 text-white drop-shadow-sm" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {item.label.charAt(0)}
              </span>
            </div>
            <div>
              <div className="text-xs text-purple-100 drop-shadow-sm">
                {item.label}
              </div>
              <div className="text-sm font-semibold text-white drop-shadow-sm">
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Toast;
