// components/SubPartTemplate/SubPartFieldsList.tsx

import React from 'react';
import { Save, Edit, Trash2, Clock } from 'lucide-react';
import { SubPart } from '../../../../lib/types/programme';
import EditableField from '../EditableField';

interface SubPartFieldsListProps {
  subPart: SubPart;
  onUpdate: (fieldId: string, newValue: string) => Promise<void>;
  onDelete: (fieldId: string) => Promise<void>;
  onSave: () => Promise<void>;
  isUpdating: boolean;
}

const SubPartFieldsList: React.FC<SubPartFieldsListProps> = ({
  subPart,
  onUpdate,
  onDelete,
  onSave,
  isUpdating
}) => {
  // Ne s'affiche que s'il y a des entrées
  if (subPart.fields.length === 0) {
    return null;
  }

  // Calcul des statistiques
  const hasMaxLimit = subPart.maxFields !== undefined;
  const remainingSlots = hasMaxLimit ? subPart.maxFields! - subPart.fields.length : null;
  const isNearLimit = hasMaxLimit && remainingSlots !== null && remainingSlots <= 2;
  const progressPercentage = hasMaxLimit ? (subPart.fields.length / subPart.maxFields!) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      {/* Header avec informations et bouton de sauvegarde */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-800">
              Tes entrées ({subPart.fields.length})
            </h3>
            {hasMaxLimit && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <span>/</span>
                <span className={isNearLimit ? 'text-orange-600 font-medium' : ''}>
                  {subPart.maxFields}
                </span>
              </div>
            )}
          </div>
          
          {/* Barre de progression si limite définie */}
          {hasMaxLimit && (
            <div className="mb-2">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <span>Progression</span>
                <span className="font-medium">{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    progressPercentage >= 100 ? 'bg-green-500' :
                    progressPercentage >= 80 ? 'bg-orange-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/*<div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock size={14} />
            <span>Édition en temps réel avec throttle 500ms pour les performances</span>
          </div>*/}
        </div>
        
        <button
          onClick={() => onSave()}
          disabled={isUpdating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 shadow-md hover:shadow-lg ml-4"
        >
          <Save size={16} />
          <span className="hidden sm:inline">
            {isUpdating ? 'Sauvegarde...' : 'Sauvegarder'}
          </span>
        </button>
      </div>

      {/* Informations sur les limites */}
      {hasMaxLimit && remainingSlots !== null && remainingSlots > 0 && (
        <div className={`mb-4 p-3 rounded-lg ${
          isNearLimit ? 'bg-orange-50 border border-orange-200' : 'bg-blue-50 border border-blue-200'
        }`}>
          <p className={`text-sm ${isNearLimit ? 'text-orange-700' : 'text-blue-700'}`}>
            <span className="font-medium">
              {remainingSlots} place{remainingSlots > 1 ? 's' : ''} restante{remainingSlots > 1 ? 's' : ''}
            </span>
            {isNearLimit && <span> • Bientôt la limite maximale !</span>}
          </p>
        </div>
      )}
      
      {/* Liste des entrées */}
      <div className="space-y-4">
        {subPart.fields.map((field, index) => (
          <div key={field.id} className="group">
            <EditableField
              field={field}
              index={index}
              onUpdate={onUpdate}
              onDelete={onDelete}
              isUpdating={isUpdating}
            />
          </div>
        ))}
      </div>

      {/* Actions rapides pour les listes importantes */}
      {subPart.fields.length > 3 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-gray-500">
              <div className="flex items-center gap-1">
                <Edit size={14} />
                <span>Cliquez sur une entrée pour l'éditer</span>
              </div>
              <div className="flex items-center gap-1">
                <Trash2 size={14} />
                <span>Icône poubelle pour supprimer</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Statistiques détaillées pour les listes importantes */}
      {subPart.fields.length > 5 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-blue-600">{subPart.fields.length}</div>
              <div className="text-xs text-gray-600">Entrées créées</div>
            </div>
            {hasMaxLimit && (
              <div>
                <div className="text-xl font-bold text-green-600">{Math.round(progressPercentage)}%</div>
                <div className="text-xs text-gray-600">Complété</div>
              </div>
            )}
            <div>
              <div className="text-xl font-bold text-purple-600">
                {hasMaxLimit ? (remainingSlots || 0) : '∞'}
              </div>
              <div className="text-xs text-gray-600">données restantes</div>
            </div>
          </div>
          
          {hasMaxLimit && progressPercentage >= 100 && (
            <div className="mt-3 text-center">
              <span className="inline-flex items-center gap-1 text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full">
                ✨ Module complètement rempli !
              </span>
            </div>
          )}
        </div>
      )}

      {/* Message pour les petites listes */}
      {subPart.fields.length <= 3 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-600">
            💡 <strong>Astuce :</strong> Plus vous ajoutez d'entrées détaillées, plus votre réflexion sera riche et complète
          </p>
        </div>
      )}
    </div>
  );
};

export default SubPartFieldsList;