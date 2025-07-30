// src/components/evolution/ActivityHeatmap.tsx

'use client';

import React from 'react';
import { ModernCard, CardContent } from '@/components/ui/ModernCard';
import type { HeatmapData } from '@/lib/types/evolution';

interface ActivityHeatmapProps {
  data: HeatmapData[];
  title: string;
}

const getActivityColor = (level: number): string => {
  const colors = [
    'bg-gray-100', // Niveau 0 - pas d'activité
    'bg-blue-200', // Niveau 1 - faible
    'bg-blue-400', // Niveau 2 - modéré
    'bg-blue-600', // Niveau 3 - élevé
    'bg-blue-800'  // Niveau 4 - très élevé
  ];
  return colors[Math.min(level, 4)];
};

const getActivityText = (level: number): string => {
  const texts = [
    'Aucune activité',
    'Activité faible',
    'Activité modérée', 
    'Activité élevée',
    'Activité intense'
  ];
  return texts[Math.min(level, 4)];
};

export default function ActivityHeatmap({ data, title }: ActivityHeatmapProps) {
  // Organiser les données par semaine
  const weeks: HeatmapData[][] = [];
  let currentWeek: HeatmapData[] = [];
  
  data.forEach((day, index) => {
    const dayOfWeek = new Date(day.date).getDay();
    
    // Si c'est un dimanche (0) et qu'on a déjà des jours, commencer une nouvelle semaine
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
    
    currentWeek.push(day);
    
    // Si c'est le dernier jour, ajouter la semaine actuelle
    if (index === data.length - 1) {
      weeks.push(currentWeek);
    }
  });

  return (
    <ModernCard variant="glass">
      <CardContent spacing="lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Moins</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`w-3 h-3 rounded-sm ${getActivityColor(level)}`}
                />
              ))}
            </div>
            <span>Plus</span>
          </div>
        </div>

        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`w-4 h-4 rounded-sm ${getActivityColor(day.level)} 
                            hover:ring-2 hover:ring-blue-300 transition-all duration-200 cursor-pointer`}
                  title={`${new Date(day.date).toLocaleDateString('fr-FR')} - ${getActivityText(day.level)} (${day.activity} actions)`}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {data.reduce((sum, day) => sum + day.activity, 0)}
              </p>
              <p className="text-sm text-gray-600">Actions totales</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {data.filter(day => day.activity > 0).length}
              </p>
              <p className="text-sm text-gray-600">Jours actifs</p>
            </div>
          </div>
        </div>
      </CardContent>
    </ModernCard>
  );
}
