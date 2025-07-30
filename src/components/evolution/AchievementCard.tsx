// src/components/evolution/AchievementCard.tsx

'use client';

import React from 'react';
import { Trophy, Star, Target, Zap, Clock, Award } from 'lucide-react';
import { ModernCard, CardContent } from '@/components/ui/ModernCard';
import type { Achievement } from '@/lib/types/evolution';

interface AchievementCardProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
}

const getAchievementIcon = (type: Achievement['type']) => {
  const iconMap = {
    streak: <Zap className="w-6 h-6" />,
    completion: <Trophy className="w-6 h-6" />,
    milestone: <Star className="w-6 h-6" />,
    time_based: <Clock className="w-6 h-6" />,
    special: <Award className="w-6 h-6" />
  };
  return iconMap[type] || <Target className="w-6 h-6" />;
};

const getAchievementColor = (type: Achievement['type']) => {
  const colorMap = {
    streak: 'from-orange-500 to-red-500',
    completion: 'from-yellow-500 to-orange-500',
    milestone: 'from-purple-500 to-pink-500',
    time_based: 'from-blue-500 to-cyan-500',
    special: 'from-green-500 to-emerald-500'
  };
  return colorMap[type] || 'from-gray-500 to-gray-600';
};

export default function AchievementCard({ achievement, size = 'md' }: AchievementCardProps) {
  const isUnlocked = achievement.unlocked;
  const iconColor = getAchievementColor(achievement.type);
  
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  return (
    <ModernCard 
      variant="glass" 
      className={`${sizeClasses[size]} ${isUnlocked ? 'ring-2 ring-yellow-300' : ''} 
                 transition-all duration-300 hover:scale-105`}
    >
      <CardContent spacing="none">
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${iconColor} 
                          flex items-center justify-center text-white shadow-lg
                          ${!isUnlocked ? 'grayscale opacity-50' : ''}`}>
            {getAchievementIcon(achievement.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-semibold ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                {achievement.title}
              </h4>
              {isUnlocked && (
                <div className="flex">
                  {[...Array(achievement.rarity)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              )}
            </div>
            
            <p className={`text-sm ${isUnlocked ? 'text-gray-600' : 'text-gray-400'} mb-2`}>
              {achievement.description}
            </p>
            
            {achievement.progress !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">
                    Progression
                  </span>
                  <span className={`font-medium ${isUnlocked ? 'text-green-600' : 'text-gray-500'}`}>
                    {achievement.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isUnlocked 
                        ? `bg-gradient-to-r ${iconColor}` 
                        : 'bg-gray-300'
                    }`}
                    style={{ width: `${Math.min(achievement.progress || 0, 100)}%` }}
                  />
                </div>
              </div>
            )}
            
            {achievement.unlockedAt && (
              <p className="text-xs text-gray-400 mt-2">
                Débloqué le {new Date(achievement.unlockedAt).toLocaleDateString('fr-FR')}
              </p>
            )}
            
            {!isUnlocked && achievement.requirement && (
              <p className="text-xs text-gray-400 mt-2">
                Requis: {achievement.requirement}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </ModernCard>
  );
}
