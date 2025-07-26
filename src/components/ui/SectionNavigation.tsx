// src/components/ui/SectionNavigation.tsx

'use client';

import React from 'react';
import { User, BookOpen, Sparkles } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface NavigationSection {
  id: string;
  name: string;
  icon: React.ReactNode;
  path: string;
  status: 'completed' | 'current' | 'locked';
}

interface SectionNavigationProps {
  sections: NavigationSection[];
  currentSection: string;
  className?: string;
}

export default function SectionNavigation({ sections, currentSection, className = '' }: SectionNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSectionClick = (section: NavigationSection) => {
    if (section.status !== 'locked') {
      router.push(section.path);
    }
  };

  const getSectionColors = (section: NavigationSection, isActive: boolean) => {
    if (section.status === 'locked') {
      return 'bg-gray-100 text-gray-400 cursor-not-allowed';
    } else if (isActive) {
      return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg';
    } else if (section.status === 'completed') {
      return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg';
    } else {
      return 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:shadow-md';
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 mb-8 ${className}`}>
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-4">
          {sections.map((section, index) => {
            const isActive = section.id === currentSection || pathname.includes(section.path);
            
            return (
              <React.Fragment key={section.id}>
                <button
                  onClick={() => handleSectionClick(section)}
                  disabled={section.status === 'locked'}
                  className={`
                    flex items-center gap-3 px-6 py-4 rounded-xl font-semibold
                    transition-all duration-300 transform hover:scale-105
                    ${getSectionColors(section, isActive)}
                    ${section.status === 'locked' ? '' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex-shrink-0">
                    {section.icon}
                  </div>
                  <span className="text-sm font-medium">
                    {section.name}
                  </span>
                  
                  {/* Indicateur de statut */}
                  {section.status === 'completed' && !isActive && (
                    <div className="w-2 h-2 bg-white rounded-full ml-2" />
                  )}
                  {section.status === 'current' && !isActive && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full ml-2 animate-pulse" />
                  )}
                </button>
                
                {/* Flèche de connexion */}
                {index < sections.length - 1 && (
                  <div className="flex-shrink-0">
                    <svg 
                      className="w-6 h-6 text-gray-300" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 5l7 7-7 7" 
                      />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Hook pour créer les sections de navigation
export function useNavigationSections(programmeProgress: number, renaissanceProgress: number) {
  const sections: NavigationSection[] = [
    {
      id: 'personalisation',
      name: 'Personalisation',
      icon: <User className="w-5 h-5" />,
      path: '/personalisation',
      status: 'completed' // Toujours complété si on est sur le dashboard
    },
    {
      id: 'programme',
      name: 'Programme',
      icon: <BookOpen className="w-5 h-5" />,
      path: '/programme',
      status: programmeProgress === 100 ? 'completed' : programmeProgress > 0 ? 'current' : 'current'
    },
    {
      id: 'renaissance',
      name: 'Renaissance',
      icon: <Sparkles className="w-5 h-5" />,
      path: '/renaissance',
      status: programmeProgress === 100 
        ? (renaissanceProgress === 100 ? 'completed' : 'current')
        : 'locked'
    }
  ];

  return sections;
}
