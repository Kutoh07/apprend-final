// src/components/evolution/MetricCard.tsx

'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ModernCard, CardContent } from '@/components/ui/ModernCard';
import type { MetricCardProps } from '@/lib/types/evolution';

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  color = 'bg-gradient-to-r from-blue-500 to-purple-600',
  animated = true 
}: MetricCardProps) {
  return (
    <ModernCard variant="glass" className={`${animated ? 'hover:scale-105 transition-transform duration-300' : ''}`}>
      <CardContent spacing="md">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white shadow-lg`}>
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              trend.positive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.positive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{trend.positive ? '+' : ''}{trend.value}%</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <p className="text-xs text-gray-500">{trend.label}</p>
          )}
        </div>
      </CardContent>
    </ModernCard>
  );
}
