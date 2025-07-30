// src/components/evolution/ProgressChart.tsx

'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { ModernCard, CardContent } from '@/components/ui/ModernCard';
import type { TimeSeriesData, ProgressChartProps } from '@/lib/types/evolution';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.dataKey}:</span>
            <span className="font-medium text-gray-900">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ProgressChart({ 
  data, 
  title, 
  height = 300,
  type = 'line',
  showGrid = true 
}: ProgressChartProps) {
  if (!data || data.length === 0) {
    return (
      <ModernCard variant="glass">
        <CardContent spacing="lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>Aucune donnée disponible</p>
          </div>
        </CardContent>
      </ModernCard>
    );
  }

  const Chart = type === 'area' ? AreaChart : LineChart;

  return (
    <ModernCard variant="glass">
      <CardContent spacing="lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
        
        <ResponsiveContainer width="100%" height={height}>
          <Chart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey="date" 
              stroke="#666"
              fontSize={12}
              tickFormatter={(value: any) => new Date(value).toLocaleDateString('fr-FR', { 
                month: 'short', 
                day: 'numeric' 
              })}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
              domain={[0, 100]}
              tickFormatter={(value: any) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {type === 'area' ? (
              <>
                <defs>
                  <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fill="url(#progressGradient)"
                />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2, fill: '#fff' }}
              />
            )}
          </Chart>
        </ResponsiveContainer>
      </CardContent>
    </ModernCard>
  );
}
