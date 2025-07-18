'use client';
import React from 'react';
import type { Level } from '../types';

export interface LevelCardProps {
  level: Level;
  onLevelClick: (level: Level) => void;
}

export const LevelCard: React.FC<LevelCardProps> = ({ level, onLevelClick }) => {
  const IconComponent = level.icon;

  return (
    <div className="text-center group">
      <div
        className={`w-20 h-20 mx-auto mb-4 bg-gradient-to-br ${level.color} rounded-2xl flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-105 group-hover:shadow-xl ${
          level.isClickable ? 'cursor-pointer hover:ring-4 hover:ring-pink-300 hover:ring-opacity-50' : ''
        }`}
        onClick={() => level.isClickable && onLevelClick(level)}
      >
        <IconComponent size={28} className="text-white" />
      </div>
      <h3
        className={`font-bold text-gray-800 text-sm mb-2 ${
          level.isClickable ? 'cursor-pointer hover:text-pink-600' : ''
        }`}
        onClick={() => level.isClickable && onLevelClick(level)}
      >
        {level.name}
      </h3>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`bg-gradient-to-r ${level.color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${level.progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mb-1">{Math.round(level.progress)}%</p>
      <p className="text-xs text-gray-400 hidden group-hover:block transition-all duration-300">
        {level.description}
      </p>
      {level.isClickable && (
        <p className="text-xs text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
          Cliquer pour commencer
        </p>
      )}
    </div>
  );
};
