'use client';
import React from 'react';
import type { Skill } from '../types';

export interface SkillBarProps {
  skill: Skill;
}

export const SkillBar: React.FC<SkillBarProps> = ({ skill }) => (
  <div className="group">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{skill.icon}</span>
        <div className="text-sm font-bold text-gray-700">
          {skill.name}
        </div>
      </div>
      <span className="text-lg font-bold text-gray-600">{skill.value}%</span>
    </div>

    <div className="relative">
      <div className="w-full bg-gray-200 rounded-full h-8 mb-2">
        <div className={`${skill.color} opacity-30 h-8 rounded-full w-full flex items-center justify-center`}>
          <span className="text-white text-xs font-bold opacity-70">Objectif 100%</span>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
        <div
          className={`${skill.color} h-8 rounded-full transition-all duration-1000 flex items-center justify-end pr-3 relative`}
          style={{ width: `${skill.value}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
          <span className="text-white text-sm font-bold relative z-10">{skill.value}%</span>
        </div>
      </div>
    </div>
  </div>
);
