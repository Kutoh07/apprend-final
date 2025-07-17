
// components/SubPartTemplate/SubPartForm.tsx

import React from 'react';
import { Plus, Zap } from 'lucide-react';
import { SubPart } from '../../../../lib/types/programme';

interface SubPartFormProps {
  subPart: SubPart;
  newValue: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  isUpdating: boolean;
  canAddMore: boolean;
}

export default function SubPartForm({
  subPart,
  newValue,
  onValueChange,
  onSubmit,
  isUpdating,
  canAddMore
}: SubPartFormProps) {
  if (!canAddMore) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4">Ajouter une nouvelle entrée</h3>
      
      {/* Informations sur les optimisations 
      <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <Zap size={14} />
          <span>
            <strong>Optimisations actives:</strong> Debounce 300ms • Cache intelligent • Recalcul batch • Requêtes parallèles
          </span>
        </div>
      </div>*/}

      {/* Formulaire */}
      <div className="flex gap-4">
        <textarea
          value={newValue}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={subPart.placeholder}
          className="flex-1 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-all"
          rows={3}
          disabled={isUpdating}
        />
        <button
          onClick={onSubmit}
          disabled={!newValue.trim() || isUpdating}
          className={`flex flex-col items-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all ${
            !newValue.trim() || isUpdating
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-500 hover:bg-purple-600 text-white transform hover:scale-105 shadow-lg hover:shadow-xl'
          }`}
        >
          {isUpdating ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <Plus size={20} />
          )}
          <span className="text-sm">
            {isUpdating ? 'Ajout...' : 'Ajouter'}
          </span>
        </button>
      </div>

      {/* Tip */}
      <div className="mt-2 text-xs text-gray-500">
        💡 <strong>Tip:</strong> Votre saisie est automatiquement sauvegardée après 300ms d'inactivité
      </div>
    </div>
  );
}