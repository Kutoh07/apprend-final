// src/components/ui/NotificationCenter.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Toast, MissionAccomplieToast, InfoRecapToast } from './Toast';

export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'mission' | 'recap';
  title: string;
  message?: string;
  progress?: number;
  data?: Array<{ label: string; value: string }>;
  duration?: number; // en millisecondes, 0 = ne se ferme pas automatiquement
  autoClose?: boolean;
}

interface NotificationCenterProps {
  notifications: NotificationData[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onRemove,
  position = 'top-right'
}) => {
  useEffect(() => {
    notifications.forEach(notification => {
      if (notification.autoClose !== false && notification.duration !== 0) {
        const timer = setTimeout(() => {
          onRemove(notification.id);
        }, notification.duration || 5000);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications, onRemove]);

  if (notifications.length === 0) return null;

  return (
    <div className={`fixed ${positionClasses[position]} z-50 space-y-4 max-w-md w-full`}>
      {notifications.map((notification) => {
        if (notification.type === 'mission') {
          return (
            <MissionAccomplieToast
              key={notification.id}
              progress={notification.progress}
              onClose={() => onRemove(notification.id)}
            />
          );
        }

        if (notification.type === 'recap') {
          return (
            <InfoRecapToast
              key={notification.id}
              title={notification.title}
              data={notification.data || []}
              onClose={() => onRemove(notification.id)}
            />
          );
        }

        return (
          <Toast
            key={notification.id}
            type={notification.type as 'success' | 'error' | 'info' | 'warning'}
            title={notification.title}
            message={notification.message}
            progress={notification.progress}
            onClose={() => onRemove(notification.id)}
          />
        );
      })}
    </div>
  );
};

// Hook pour gérer les notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = (notification: Omit<NotificationData, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setNotifications(prev => [...prev, { ...notification, id }]);
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const showMissionAccomplie = (progress: number = 100) => {
    return addNotification({
      type: 'mission',
      title: '🏆 Mission accomplie !',
      message: 'Félicitations ! Tu as terminé cette étape avec brio. Time to level up !',
      progress,
      duration: 8000
    });
  };

  const showInfoRecap = (data: Array<{ label: string; value: string }>, title?: string) => {
    return addNotification({
      type: 'recap',
      title: title || 'Récapitulatif de tes informations',
      data,
      duration: 0, // Ne se ferme pas automatiquement
      autoClose: false
    });
  };

  const showSuccess = (title: string, message?: string, progress?: number) => {
    return addNotification({
      type: 'success',
      title,
      message,
      progress,
      duration: 5000
    });
  };

  const showError = (title: string, message?: string) => {
    return addNotification({
      type: 'error',
      title,
      message,
      duration: 7000
    });
  };

  const showInfo = (title: string, message?: string, progress?: number) => {
    return addNotification({
      type: 'info',
      title,
      message,
      progress,
      duration: 5000
    });
  };

  const showWarning = (title: string, message?: string) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      duration: 6000
    });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showMissionAccomplie,
    showInfoRecap,
    showSuccess,
    showError,
    showInfo,
    showWarning
  };
};

export default NotificationCenter;
