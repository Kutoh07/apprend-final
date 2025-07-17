// Sélection des axes (3-6)
// src/app/renaissance/selection/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

// Types temporaires
interface RenaissanceAxe {
  id: string;
  name: string;
  icon: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  isCustomizable: boolean;
}

interface CustomAxeData {
  name: string;
  phrases: string[];
}

// Composant de carte de sélection d'axe
const AxeSelectionCard = ({ 
  axe, 
  isSelected, 
  onToggle,
  disabled = false 
}: { 
  axe: RenaissanceAxe; 
  isSelected: boolean; 
  onToggle: (axeId: string) => void;
  disabled?: boolean;
}) => {
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
          ? 'border-purple-500 bg-purple-50 shadow-lg' 
          : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {/* Badge sélectionné */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm">✓</span>
        </div>
      )}

      {/* Contenu de la carte */}
      <div className="text-center">
        <div className="text-4xl mb-4">{axe.icon}</div>
        <h3 className="font-bold text-lg text-gray-800 mb-2">{axe.name}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{axe.description}</p>
      </div>

      {/* Indicateur spécial pour axe personnalisé */}
      {axe.isCustomizable && (
        <div className="mt-4 text-center">
          <span className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full">
            Personnalisable
          </span>
        </div>
      )}
    </div>
  );
};

// Composant de modal pour axe personnalisé
const CustomAxeModal = ({ 
  isOpen, 
  onClose, 
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: CustomAxeData) => void; 
}) => {
  const [axeName, setAxeName] = useState('');
  const [phrases, setPhrases] = useState<string[]>(['', '', '']);
  const [errors, setErrors] = useState<string[]>([]);

  const addPhrase = () => {
    if (phrases.length < 10) {
      setPhrases([...phrases, '']);
    }
  };

  const removePhrase = (index: number) => {
    if (phrases.length > 3) {
      setPhrases(phrases.filter((_, i) => i !== index));
    }
  };

  const updatePhrase = (index: number, value: string) => {
    const newPhrases = [...phrases];
    newPhrases[index] = value;
    setPhrases(newPhrases);
  };

  const validateAndSave = () => {
    const newErrors: string[] = [];

    if (!axeName.trim()) {
      newErrors.push('Le nom de l\'axe est obligatoire');
    }

    const validPhrases = phrases.filter(p => p.trim());
    if (validPhrases.length < 3) {
      newErrors.push('Minimum 3 phrases requises');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      name: axeName.trim(),
      phrases: validPhrases
    });

    // Reset
    setAxeName('');
    setPhrases(['', '', '']);
    setErrors([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Créer un axe personnalisé</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Erreurs */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <ul className="text-red-600 text-sm">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Nom de l'axe */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de votre axe personnalisé
            </label>
            <input
              type="text"
              value={axeName}
              onChange={(e) => setAxeName(e.target.value)}
              placeholder="Ex: Confiance entrepreneuriale"
              className="w-full p-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
              maxLength={50}
            />
          </div>

          {/* Phrases */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vos phrases (3 à 10 phrases)
            </label>
            <div className="space-y-3">
              {phrases.map((phrase, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={phrase}
                      onChange={(e) => updatePhrase(index, e.target.value)}
                      placeholder={`Phrase ${index + 1}...`}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                      maxLength={200}
                    />
                  </div>
                  {phrases.length > 3 && (
                    <button
                      onClick={() => removePhrase(index)}
                      className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>

            {phrases.length < 10 && (
              <button
                onClick={addPhrase}
                className="mt-3 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
              >
                + Ajouter une phrase
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={validateAndSave}
              className="flex-1 py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
            >
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AxeSelectionPage() {
  const router = useRouter();
  const [availableAxes, setAvailableAxes] = useState<RenaissanceAxe[]>([]);
  const [selectedAxes, setSelectedAxes] = useState<string[]>([]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customAxeData, setCustomAxeData] = useState<CustomAxeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserAndAxes();
  }, []);

  const loadUserAndAxes = async () => {
    try {
      // Vérifier l'authentification
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        router.push('/auth');
        return;
      }

      setUserId(session.user.id);

      // Charger les axes disponibles
      const { data: axesData, error: axesError } = await supabase
        .from('renaissance_axes')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (axesError) {
        console.error('Erreur lors du chargement des axes:', axesError);
        return;
      }

      const axes: RenaissanceAxe[] = axesData.map(axe => ({
        id: axe.id,
        name: axe.name,
        icon: axe.icon,
        description: axe.description,
        sortOrder: axe.sort_order,
        isActive: axe.is_active,
        isCustomizable: axe.is_customizable
      }));

      setAvailableAxes(axes);

      // Charger les sélections existantes
      const { data: selectionsData, error: selectionsError } = await supabase
        .from('user_renaissance_selection')
        .select('axe_id, custom_name, custom_phrases')
        .eq('user_id', session.user.id);

      if (selectionsError) {
        console.error('Erreur lors du chargement des sélections:', selectionsError);
      } else if (selectionsData && selectionsData.length > 0) {
        setSelectedAxes(selectionsData.map(s => s.axe_id));
        
        // Vérifier s'il y a un axe personnalisé
        const customSelection = selectionsData.find(s => 
          axes.find(a => a.id === s.axe_id)?.isCustomizable
        );
        
        if (customSelection && customSelection.custom_name) {
          setCustomAxeData({
            name: customSelection.custom_name,
            phrases: customSelection.custom_phrases || []
          });
        }
      }

    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAxeToggle = (axeId: string) => {
    const axe = availableAxes.find(a => a.id === axeId);
    
    if (axe?.isCustomizable) {
      if (selectedAxes.includes(axeId)) {
        // Désélectionner l'axe personnalisé
        setSelectedAxes(selectedAxes.filter(id => id !== axeId));
        setCustomAxeData(null);
      } else {
        // Ouvrir la modal pour personnaliser
        setShowCustomModal(true);
      }
      return;
    }

    // Logique normale pour les autres axes
    if (selectedAxes.includes(axeId)) {
      setSelectedAxes(selectedAxes.filter(id => id !== axeId));
    } else {
      if (selectedAxes.length < 6) {
        setSelectedAxes([...selectedAxes, axeId]);
      }
    }
  };

  const handleCustomAxeSave = (data: CustomAxeData) => {
    const customAxe = availableAxes.find(a => a.isCustomizable);
    if (customAxe && !selectedAxes.includes(customAxe.id)) {
      setSelectedAxes([...selectedAxes, customAxe.id]);
    }
    setCustomAxeData(data);
  };

  const handleValidateSelection = async () => {
    if (!userId || selectedAxes.length < 3) return;

    setSaving(true);
    try {
      // Supprimer les anciennes sélections
      await supabase
        .from('user_renaissance_selection')
        .delete()
        .eq('user_id', userId);

      // Créer les nouvelles sélections
      const selections = selectedAxes.map((axeId, index) => {
        const axe = availableAxes.find(a => a.id === axeId);
        return {
          user_id: userId,
          axe_id: axeId,
          selection_order: index + 1,
          custom_name: axe?.isCustomizable ? customAxeData?.name : null,
          custom_phrases: axe?.isCustomizable ? customAxeData?.phrases : null,
          selected_at: new Date().toISOString()
        };
      });

      const { error } = await supabase
        .from('user_renaissance_selection')
        .insert(selections);

      if (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        return;
      }

      // Rediriger vers le premier axe
      router.push(`/renaissance/${selectedAxes[0]}`);

    } catch (error) {
      console.error('Erreur lors de la validation:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔄</div>
          <div className="text-2xl text-purple-600">Chargement des axes...</div>
        </div>
      </div>
    );
  }

  const canValidate = selectedAxes.length >= 3 && selectedAxes.length <= 6;
  const isMaxReached = selectedAxes.length >= 6;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              AXES DE RENAISSANCE
            </span>
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            Sélectionnez un axe que vous voulez travailler en plus et ajoutez le à ton programme de renaissance
          </p>
          
          {/* Compteur */}
          <div className="bg-white rounded-2xl shadow-lg p-4 inline-block">
            <span className="text-sm text-gray-600">Axes sélectionnés : </span>
            <span className={`font-bold ${canValidate ? 'text-green-600' : 'text-red-600'}`}>
              {selectedAxes.length}/6
            </span>
            <span className="text-sm text-gray-600 ml-2">(minimum 3)</span>
          </div>
        </div>

        {/* Grille d'axes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {availableAxes.map(axe => (
            <AxeSelectionCard
              key={axe.id}
              axe={axe}
              isSelected={selectedAxes.includes(axe.id)}
              onToggle={handleAxeToggle}
              disabled={!selectedAxes.includes(axe.id) && isMaxReached}
            />
          ))}
        </div>

        {/* Affichage axe personnalisé */}
        {customAxeData && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-purple-600 mb-4">
              Votre axe personnalisé : {customAxeData.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {customAxeData.phrases.map((phrase, index) => (
                <div key={index} className="text-sm bg-purple-50 p-3 rounded-lg">
                  {index + 1}. {phrase}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="text-center">
          <button
            onClick={handleValidateSelection}
            disabled={!canValidate || saving}
            className={`
              px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200
              ${canValidate 
                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
              ${saving ? 'opacity-50' : ''}
            `}
          >
            {saving ? 'Sauvegarde...' : 'Valider ma sélection'}
          </button>
        </div>
      </div>

      {/* Modal axe personnalisé */}
      <CustomAxeModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onSave={handleCustomAxeSave}
      />
    </div>
  );
}