// src/components/ui/SimpleNotification.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  duration?: number;
  onClose: () => void;
}

export default function SimpleNotification({ 
  message, 
  type, 
  duration = 5000, 
  onClose 
}: NotificationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Attendre la fin de l'animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div 
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full mx-4
        transform transition-all duration-300 ease-in-out
        ${visible 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
      `}
    >
      <div className={`
        rounded-xl shadow-xl border backdrop-blur-sm
        ${type === 'success'
          ? 'bg-green-50/90 border-green-200 text-green-800'
          : 'bg-red-50/90 border-red-200 text-red-800'
        }
      `}>
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {type === 'success' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-relaxed">
                {message}
              </p>
            </div>
            
            <button
              onClick={handleClose}
              className={`
                flex-shrink-0 rounded-full p-1 transition-colors
                ${type === 'success'
                  ? 'hover:bg-green-100 text-green-600'
                  : 'hover:bg-red-100 text-red-600'
                }
              `}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Provider de contexte pour gérer les notifications globalement
interface NotificationContextType {
  showNotification: (message: string, type?: 'success' | 'error') => void;
}

const NotificationContext = React.createContext<NotificationContextType | null>(null);

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error';
  }>>([]);

  const showNotification = (message: string, type: 'success' | 'error' = 'error') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
        {notifications.map(notification => (
          <SimpleNotification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
