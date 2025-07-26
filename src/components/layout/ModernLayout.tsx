// src/components/layout/ModernLayout.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  Home, 
  User, 
  BookOpen, 
  Star, 
  Award, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Sun,
  Moon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
  isActive?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Vue d\'ensemble de ton parcours'
  },
  {
    name: 'Personnalisation',
    href: '/personalisation',
    icon: User,
    description: 'Découvre ton profil unique'
  },
  {
    name: 'Programme',
    href: '/programme',
    icon: BookOpen,
    description: 'Structure ton développement'
  },
  {
    name: 'Renaissance',
    href: '/renaissance',
    icon: Star,
    description: 'Transformation profonde',
    badge: 'Nouveau'
  },
  {
    name: 'Évolution',
    href: '/evolution',
    icon: Award,
    description: 'Maîtrise et rayonnement'
  }
];

interface ModernLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showNavigation?: boolean;
  className?: string;
}

export function ModernLayout({ 
  children, 
  title, 
  description, 
  showNavigation = true,
  className = "" 
}: ModernLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(3);

  // Gestion du mode sombre
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('user');
      router.push('/auth/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const navigateToPage = (href: string) => {
    setIsMobileMenuOpen(false);
    router.push(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header avec navigation */}
      {showNavigation && (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200/80 dark:border-gray-700/80 glass-effect dark:glass-effect-dark">
          <div className="container-app">
            <div className="flex h-16 items-center justify-between">
              {/* Logo */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center space-x-3 hover-lift group"
                >
                  <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-medium group-hover:shadow-glow">
                    <span className="text-white font-bold text-lg">A+</span>
                  </div>
                  <div className="hidden sm:block">
                    <h1 className="text-xl font-bold text-gradient-primary">Apprend+</h1>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">Excellence mentale</p>
                  </div>
                </button>
              </div>

              {/* Navigation desktop */}
              <nav className="hidden lg:flex items-center space-x-1">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  const Icon = item.icon;
                  
                  return (
                    <button
                      key={item.name}
                      onClick={() => navigateToPage(item.href)}
                      className={`
                        relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium
                        transition-all duration-300 hover-lift group
                        ${isActive
                          ? 'bg-gradient-primary text-white shadow-medium'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="absolute -top-1 -right-1 bg-warning-400 text-white text-xs px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Actions */}
              <div className="flex items-center space-x-3">
                {/* Recherche */}
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl hover-lift">
                  <Search className="w-5 h-5" />
                </button>

                {/* Notifications */}
                <button className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl hover-lift">
                  <Bell className="w-5 h-5" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-error-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                      {notifications}
                    </span>
                  )}
                </button>

                {/* Mode sombre */}
                <button
                  onClick={toggleDarkMode}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl hover-lift"
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Paramètres */}
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl hover-lift">
                  <Settings className="w-5 h-5" />
                </button>

                {/* Déconnexion */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-xl hover-lift"
                >
                  <LogOut className="w-5 h-5" />
                </button>

                {/* Menu mobile */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl hover-lift"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Menu mobile */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200/80 dark:border-gray-700/80 animate-fade-in-down">
              <div className="container-app py-4">
                <nav className="grid grid-cols-1 gap-2">
                  {navigationItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;
                    
                    return (
                      <button
                        key={item.name}
                        onClick={() => navigateToPage(item.href)}
                        className={`
                          relative flex items-center space-x-3 p-3 rounded-xl text-left
                          transition-all duration-300 hover-lift
                          ${isActive
                            ? 'bg-gradient-primary text-white shadow-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{item.name}</span>
                            {item.badge && (
                              <span className="bg-warning-400 text-white text-xs px-2 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className={`text-sm ${isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          )}
        </header>
      )}

      {/* Contenu principal */}
      <main className={`flex-1 ${className}`}>
        {(title || description) && (
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="container-app py-8">
              {title && (
                <h1 className="heading-1 text-gradient-primary animate-fade-in-up">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-body max-w-3xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                  {description}
                </p>
              )}
            </div>
          </div>
        )}
        
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container-app py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A+</span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                © 2024 Apprend+. L'excellence mentale ancrée de manière durable.
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <button className="hover:text-gray-700 dark:hover:text-gray-300 hover-lift">
                Aide
              </button>
              <button className="hover:text-gray-700 dark:hover:text-gray-300 hover-lift">
                Confidentialité
              </button>
              <button className="hover:text-gray-700 dark:hover:text-gray-300 hover-lift">
                Contact
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ModernLayout;
