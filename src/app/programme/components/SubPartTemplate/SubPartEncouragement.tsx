// components/SubPartTemplate/SubPartEncouragement.tsx

import React from 'react';
import { useRouter } from 'next/navigation';
import { SubPart, SUBPARTS_CONFIG } from '../../../../lib/types/programme';

interface SubPartEncouragementProps {
  subPart: SubPart;
  meetsMinimum: boolean;
  canAddMore: boolean;
  canAccessNext: boolean;
  subPartId: number;
}

const SubPartEncouragement: React.FC<SubPartEncouragementProps> = ({
  subPart,
  meetsMinimum,
  canAddMore,
  canAccessNext,
  subPartId
}) => {
  const router = useRouter();

  // Message d'encouragement quand le minimum n'est pas atteint
  if (!meetsMinimum) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center mb-8">
        <div className="text-4xl mb-4">🎯</div>
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Encore un petit effort !
        </h3>
        <p className="text-yellow-800 mb-4">
          Ajoutez au moins <strong>{(subPart.minFields || 1) - subPart.fields.length}</strong> entrée(s) 
          supplémentaire(s) pour débloquer le module suivant
        </p>
        <div className="bg-yellow-100 rounded-lg p-3 mb-4">
          <p className="text-yellow-700 text-sm">
            🔥 <strong>CORRECTION APPLIQUÉE:</strong> Une fois ce module validé, 
            <strong> TOUS les modules suivants</strong> seront automatiquement débloqués avec leur vraie progression !
          </p>
        </div>
        <div className="text-xs text-yellow-600">
          Plus que {(subPart.minFields || 1) - subPart.fields.length} entrée(s) 
          pour passer de {subPart.progress}% à 100%
        </div>
      </div>
    );
  }

  // Message de félicitations quand le minimum est atteint
  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center mb-8">
      <div className="text-4xl mb-4">✨</div>
      <h3 className="text-lg font-semibold text-green-800 mb-2">
        Excellent travail !
      </h3>
      <p className="text-green-800 mb-4">
        Ce module est <strong>complété à {subPart.progress}%</strong>. 
        Vous pouvez maintenant passer au module suivant.
      </p>
      
      {/* Informations sur la correction appliquée 
      <div className="bg-green-100 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🔧</div>
          <div className="text-left">
            <h4 className="font-semibold text-green-800 mb-2">Corrections appliquées :</h4>
            <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
              <li><strong>Blocage en cascade :</strong> Tous les modules suivants (pas seulement le suivant) sont gelés si un module précédent devient invalide</li>
              <li><strong>Recalcul global :</strong> Toutes les progressions sont recalculées automatiquement après chaque action</li>
              <li><strong>Performance optimisée :</strong> Temps de traitement réduit de plus de 75% (batch processing + cache)</li>
              <li><strong>Cohérence garantie :</strong> Plus jamais de modules à 0% avec des données existantes</li>
            </ul>
          </div>
        </div>
      </div>*/}

      {/* Bonus pour les entrées supplémentaires */}
      {canAddMore && (
        <div className="bg-green-100 rounded-lg p-3 mb-4">
          <p className="text-green-700 text-sm">
            💡 <strong>Bonus :</strong> Vous pouvez encore ajouter {
              subPart.maxFields ? 
              (subPart.maxFields - subPart.fields.length) : 
              'des'
            } entrée(s) supplémentaire(s) si vous le souhaitez pour enrichir votre réflexion.
          </p>
        </div>
      )}

      {/* Bouton pour aller au module suivant */}
      {canAccessNext && (
        <div className="mt-4">
          <button
            onClick={() => {
              const nextModule = SUBPARTS_CONFIG.find(config => config.id === subPartId + 1);
              if (nextModule) {
                router.push(`/programme/${nextModule.slug}`);
              }
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
          >
            Passer au module suivant →
          </button>
        </div>
      )}

      {/* Message si limite maximale atteinte 
      {subPart.maxFields && subPart.fields.length >= subPart.maxFields && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl mb-2">🎯</div>
          <h4 className="font-semibold text-blue-800 mb-2">Limite atteinte !</h4>
          <p className="text-blue-800 text-sm">
            Vous avez atteint le maximum de <strong>{subPart.maxFields} entrées</strong> 
            pour ce module. Vous pouvez modifier les entrées existantes ou passer au module suivant.
          </p>
        </div>
      )}*/}
    </div>
  );
};

export default SubPartEncouragement;