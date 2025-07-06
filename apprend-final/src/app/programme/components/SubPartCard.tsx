// app/programme/components/SubPartCard.tsx

import { Lock, Check } from 'lucide-react';
import { SubPart } from '@/lib/types/programme';

interface SubPartCardProps {
  subPart: SubPart;
  canAccess: boolean;
  onClick: () => void;
}

export function SubPartCard({ subPart, canAccess, onClick }: SubPartCardProps) {
  const isLocked = !canAccess && subPart.id > 1;

  return (
    <div
      className={`bg-white rounded-2xl p-6 shadow-lg transform transition-all duration-300 ${
        canAccess ? 'hover:scale-105 cursor-pointer' : 'opacity-60 cursor-not-allowed'
      }`}
      onClick={canAccess ? onClick : undefined}
    >
      <div className="text-center">
        {/* Icône et état */}
        <div className="relative inline-block mb-4">
          <div className={`text-6xl ${!canAccess ? 'opacity-50' : ''}`}>
            {subPart.icon}
          </div>
          {isLocked && (
            <div className="absolute -top-2 -right-2 bg-gray-500 rounded-full p-1">
              <Lock size={16} className="text-white" />
            </div>
          )}
          {subPart.completed && (
            <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
              <Check size={16} className="text-white" />
            </div>
          )}
        </div>
        
        {/* Nom */}
        <h3 className={`font-bold text-sm mb-3 bg-gradient-to-r ${subPart.color} bg-clip-text text-transparent`}>
          {subPart.name}
        </h3>
        
        {/* Barre de progression */}
        <div className="bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className={`h-full bg-gradient-to-r ${subPart.color} rounded-full transition-all duration-500`}
            style={{ width: `${subPart.progress}%` }}
          />
        </div>
        
        {/* Statut */}
        <p className="text-xs text-gray-500">
          {subPart.completed ? 'Complété' : canAccess ? 'À compléter' : 'Verrouillé'}
        </p>
      </div>
    </div>
  );
}