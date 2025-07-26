// src/components/ui/Notification.tsx

'use client';

import React, { forwardRef } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface NotificationProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message?: string;
  onClose?: () => void;
  showIcon?: boolean;
  progress?: number;
  actions?: React.ReactNode;
}

const NotificationVariants = {
  success: {
    container: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg',
    icon: CheckCircle,
    iconColor: 'text-white'
  },
  error: {
    container: 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg',
    icon: AlertCircle,
    iconColor: 'text-white'
  },
  warning: {
    container: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg',
    icon: AlertTriangle,
    iconColor: 'text-white'
  },
  info: {
    container: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg',
    icon: Info,
    iconColor: 'text-white'
  }
};

export const Notification = forwardRef<HTMLDivElement, NotificationProps>(
  ({
    variant = 'info',
    title,
    message,
    onClose,
    showIcon = true,
    progress,
    actions,
    children,
    className = '',
    ...props
  }, ref) => {
    const config = NotificationVariants[variant];
    const Icon = config.icon;

    return (
      <div
        ref={ref}
        className={`
          relative rounded-2xl p-6 backdrop-blur-sm border border-white/20
          ${config.container} ${className}
        `}
        {...props}
      >
        {/* Contenu principal */}
        <div className="flex items-start gap-4">
          {showIcon && (
            <div className="flex-shrink-0">
              <Icon className={`w-6 h-6 ${config.iconColor} drop-shadow-sm`} />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="font-bold text-lg text-white mb-2 drop-shadow-sm">
                {title}
              </h3>
            )}
            
            {message && (
              <p className="text-white/90 text-sm mb-3 drop-shadow-sm">
                {message}
              </p>
            )}
            
            {children && (
              <div className="text-white/95 drop-shadow-sm">
                {children}
              </div>
            )}
            
            {/* Barre de progression */}
            {typeof progress === 'number' && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-white/90 drop-shadow-sm">
                    Progression
                  </span>
                  <span className="text-sm font-bold text-white drop-shadow-sm">
                    {progress}%
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-white/80 rounded-full transition-all duration-500 ease-out relative"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </div>
                </div>
              </div>
            )}
            
            {/* Actions */}
            {actions && (
              <div className="mt-4 flex gap-2">
                {actions}
              </div>
            )}
          </div>
          
          {/* Bouton fermer */}
          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              aria-label="Fermer la notification"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

Notification.displayName = 'Notification';

// Composant pour les notifications Mission Accomplie
interface MissionCompleteNotificationProps {
  progress: number;
  message?: string;
  onClose?: () => void;
  className?: string;
}

export const MissionCompleteNotification = forwardRef<HTMLDivElement, MissionCompleteNotificationProps>(
  ({ progress, message, onClose, className = '' }, ref) => {
    return (
      <Notification
        ref={ref}
        variant="success"
        title="🏆 Mission accomplie !"
        message={message || "Félicitations ! Tu as terminé cette étape avec brio. Time to level up !"}
        progress={progress}
        onClose={onClose}
        className={className}
        actions={
          <button className="bg-white/20 hover:bg-white/30 text-white font-medium px-4 py-2 rounded-lg transition-colors backdrop-blur-sm border border-white/20">
            Continuer
          </button>
        }
      />
    );
  }
);

MissionCompleteNotification.displayName = 'MissionCompleteNotification';

// Composant pour afficher les informations utilisateur sur fond sombre
interface UserInfoCardProps {
  userData: {
    name: string;
    birthYear: string | number;
    profession: string;
    gender?: string;
    phone?: string;
    country?: string;
  };
  className?: string;
}

export const UserInfoCard = forwardRef<HTMLDivElement, UserInfoCardProps>(
  ({ userData, className = '' }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl 
          border border-white/20 ${className}
        `}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4 drop-shadow-sm">
          Récapitulatif de tes informations
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-bold">👤</span>
            </div>
            <div>
              <span className="text-sm text-gray-600 font-medium">Nom</span>
              <p className="font-bold text-gray-900 drop-shadow-sm">{userData.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
              <span className="text-secondary-600 font-bold">📅</span>
            </div>
            <div>
              <span className="text-sm text-gray-600 font-medium">Année de naissance</span>
              <p className="font-bold text-gray-900 drop-shadow-sm">{userData.birthYear}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
              <span className="text-accent-600 font-bold">💼</span>
            </div>
            <div>
              <span className="text-sm text-gray-600 font-medium">Profession</span>
              <p className="font-bold text-gray-900 drop-shadow-sm">{userData.profession}</p>
            </div>
          </div>
          
          {userData.gender && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-bold">👤</span>
              </div>
              <div>
                <span className="text-sm text-gray-600 font-medium">Genre</span>
                <p className="font-bold text-gray-900 drop-shadow-sm">{userData.gender}</p>
              </div>
            </div>
          )}
          
          {userData.phone && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
                <span className="text-secondary-600 font-bold">📱</span>
              </div>
              <div>
                <span className="text-sm text-gray-600 font-medium">Téléphone</span>
                <p className="font-bold text-gray-900 drop-shadow-sm">{userData.phone}</p>
              </div>
            </div>
          )}
          
          {userData.country && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
                <span className="text-accent-600 font-bold">🌍</span>
              </div>
              <div>
                <span className="text-sm text-gray-600 font-medium">Pays</span>
                <p className="font-bold text-gray-900 drop-shadow-sm">{userData.country}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

UserInfoCard.displayName = 'UserInfoCard';
