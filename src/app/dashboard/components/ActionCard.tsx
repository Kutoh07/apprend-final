'use client';
import React from 'react';
import type { ActionCard } from '../types';

export interface ActionCardComponentProps {
  action: ActionCard;
}

export const ActionCardComponent: React.FC<ActionCardComponentProps> = ({ action }) => {
  const IconComponent = action.icon;
  return (
    <button
      onClick={action.onClick}
      className={`${action.color} text-white p-6 rounded-xl transition-all duration-200 transform hover:scale-105 group`}
    >
      <IconComponent size={32} className="mx-auto mb-3 group-hover:scale-110 transition-transform" />
      <div className="font-semibold text-lg">{action.title}</div>
      <div className="text-sm opacity-90 mt-1">{action.subtitle}</div>
    </button>
  );
};
