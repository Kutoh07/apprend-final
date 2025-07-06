'use client';
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, User, BarChart3, Settings, LogOut } from 'lucide-react';

const Navigation = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/dashboard', icon: BarChart3, label: 'Tableau de bord' },
    { path: '/profile', icon: User, label: 'Profil' },
    { path: '/settings', icon: Settings, label: 'Paramètres' }
  ];

  const handleLogout = () => {
    // Logique de déconnexion
    router.push('/');
  };

  // N'afficher la navigation que sur certaines pages
  if (pathname === '/' || pathname.startsWith('/auth')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 md:relative md:bg-transparent md:border-none md:p-0">
      <div className="flex justify-around md:justify-start md:space-x-6">
        {navItems.map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            onClick={() => router.push(path)}
            className={`
              flex flex-col items-center p-2 rounded-lg transition-colors
              ${pathname === path 
                ? 'text-teal-600 bg-teal-50' 
                : 'text-gray-500 hover:text-teal-600 hover:bg-teal-50'
              }
            `}
          >
            <Icon size={20} />
            <span className="text-xs mt-1 hidden md:inline">{label}</span>
          </button>
        ))}
        
        <button
          onClick={handleLogout}
          className="flex flex-col items-center p-2 rounded-lg transition-colors text-gray-500 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut size={20} />
          <span className="text-xs mt-1 hidden md:inline">Déconnexion</span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;