// Carte de sélection d'axe
// src/app/renaissance/components/AxeSelectionCard.tsx

'use client';

import React from 'react';
import type { RenaissanceAxe } from '@/lib/types/renaissance';

interface AxeSelectionCardProps {
  axe: RenaissanceAxe;
  isSelected: boolean;
  onToggle: (axeId: string) => void;
  disabled?: boolean;
  isStarted?: boolean; // Nouvelle prop pour indiquer si l'axe a commencé
}

export default function AxeSelectionCard({ 
  axe, 
  isSelected, 
  onToggle,
  disabled = false,
  isStarted = false
}: AxeSelectionCardProps) {
  const handleClick = () => {
    if (!disabled) {
      onToggle(axe.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 transform hover:scale-105
        ${isSelected 
          ? 'border-purple-500 bg-purple-50 shadow-lg ring-2 ring-purple-200' 
          : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed transform-none hover:scale-100' : ''}
      `}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Badge sélectionné */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white text-sm font-bold">✓</span>
        </div>
      )}

      {/* Badge désactivé */}
      {disabled && !isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white text-xs">🔒</span>
        </div>
      )}

      {/* Contenu de la carte */}
      <div className="text-center">
        <div className="text-4xl mb-4 select-none">{axe.icon}</div>
        <h3 className="font-bold text-lg text-gray-800 mb-2 leading-tight">
          {axe.name}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          {axe.description}
        </p>

        {/* Indicateur spécial pour axe personnalisé */}
        {axe.isCustomizable && (
          <div className="mt-4">
            <span className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-medium">
              Personnalisable
            </span>
          </div>
        )}

        {/* État de sélection */}
        <div className="mt-4">
          {isSelected ? (
            <div className="text-purple-600 font-semibold text-sm">
              {isStarted ? '🚀 Commencé' : '✅ Sélectionné'}
            </div>
          ) : disabled ? (
            <div className="text-gray-500 text-sm">
              Maximum atteint
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              Cliquez pour sélectionner
            </div>
          )}
        </div>
      </div>

      {/* Effet de hover */}
      {!disabled && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
      )}
    </div>
  );
}