// Modale pour axe personnalisé
// src/app/renaissance/components/CustomAxeModal.tsx

'use client';

import React, { useState, useEffect } from 'react';

export interface CustomAxeData {
  name: string;
  phrases: string[];
}

interface CustomAxeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CustomAxeData) => void;
  initialData?: CustomAxeData;
}

export default function CustomAxeModal({ 
  isOpen, 
  onClose, 
  onSave,
  initialData 
}: CustomAxeModalProps) {
  const [axeName, setAxeName] = useState('');
  const [phrases, setPhrases] = useState<string[]>(['', '', '']);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger les données initiales si fournies
  useEffect(() => {
    if (initialData) {
      setAxeName(initialData.name);
      setPhrases(initialData.phrases.length >= 3 ? initialData.phrases : [...initialData.phrases, '', '', ''].slice(0, Math.max(3, initialData.phrases.length)));
    } else {
      setAxeName('');
      setPhrases(['', '', '']);
    }
    setErrors([]);
  }, [initialData, isOpen]);

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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

  const validateAndSave = async () => {
    const newErrors: string[] = [];

    // Validation du nom
    if (!axeName.trim()) {
      newErrors.push('Le nom de l\'axe est obligatoire');
    } else if (axeName.trim().length < 2) {
      newErrors.push('Le nom doit contenir au moins 2 caractères');
    } else if (axeName.trim().length > 50) {
      newErrors.push('Le nom ne peut pas dépasser 50 caractères');
    }

    // Validation des phrases
    const validPhrases = phrases.filter(p => p.trim());
    if (validPhrases.length < 3) {
      newErrors.push('Minimum 3 phrases non vides requises');
    }

    // Vérifier les phrases trop courtes
    const shortPhrases = validPhrases.filter(p => p.trim().length < 5);
    if (shortPhrases.length > 0) {
      newErrors.push('Chaque phrase doit contenir au moins 5 caractères');
    }

    // Vérifier les phrases trop longues
    const longPhrases = validPhrases.filter(p => p.trim().length > 200);
    if (longPhrases.length > 0) {
      newErrors.push('Chaque phrase ne peut pas dépasser 200 caractères');
    }

    // Vérifier les doublons
    const uniquePhrases = [...new Set(validPhrases.map(p => p.trim().toLowerCase()))];
    if (uniquePhrases.length !== validPhrases.length) {
      newErrors.push('Les phrases ne peuvent pas être identiques');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      onSave({
        name: axeName.trim(),
        phrases: validPhrases.map(p => p.trim())
      });

      // Reset après succès
      setAxeName('');
      setPhrases(['', '', '']);
      setErrors([]);
      onClose();
    } catch (error) {
      setErrors(['Une erreur est survenue lors de la sauvegarde']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Créer un axe personnalisé</h2>
              <p className="text-purple-100 mt-1">Définissez votre propre axe de renaissance</p>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-white/80 hover:text-white text-3xl leading-none disabled:opacity-50"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6">
            {/* Erreurs */}
            {errors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start">
                  <div className="text-red-600 text-lg mr-2">⚠️</div>
                  <div>
                    <h4 className="font-semibold text-red-800 mb-2">Erreurs de validation</h4>
                    <ul className="text-red-600 text-sm space-y-1">
                      {errors.map((error, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Nom de l'axe */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom de votre axe personnalisé *
              </label>
              <input
                type="text"
                value={axeName}
                onChange={(e) => setAxeName(e.target.value)}
                placeholder="Ex: Confiance entrepreneuriale, Leadership bienveillant..."
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors text-lg"
                maxLength={50}
                disabled={isSubmitting}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {axeName.length}/50 caractères
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start">
                <div className="text-blue-600 text-lg mr-2">💡</div>
                <div className="text-blue-800 text-sm">
                  <strong>Conseils :</strong> Créez des phrases positives à la première personne (Je...) 
                  qui reflètent vos objectifs personnels. Évitez les négations et privilégiez 
                  des affirmations constructives.
                </div>
              </div>
            </div>

            {/* Phrases */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Vos phrases d'affirmation (3 à 10 phrases) *
              </label>
              
              <div className="space-y-3">
                {phrases.map((phrase, index) => (
                  <div key={index} className="group">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={phrase}
                          onChange={(e) => updatePhrase(index, e.target.value)}
                          placeholder={`Phrase ${index + 1}... (ex: "Je fais confiance à mes capacités")`}
                          className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none transition-colors"
                          rows={2}
                          maxLength={200}
                          disabled={isSubmitting}
                        />
                        <div className="text-right text-xs text-gray-500 mt-1">
                          {phrase.length}/200 caractères
                        </div>
                      </div>
                      {phrases.length > 3 && (
                        <button
                          onClick={() => removePhrase(index)}
                          disabled={isSubmitting}
                          className="flex-shrink-0 w-10 h-12 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                          title="Supprimer cette phrase"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {phrases.length < 10 && (
                <button
                  onClick={addPhrase}
                  disabled={isSubmitting}
                  className="mt-4 w-full p-3 border-2 border-dashed border-purple-300 text-purple-600 rounded-xl hover:bg-purple-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span className="text-lg">+</span>
                  <span>Ajouter une phrase ({phrases.length}/10)</span>
                </button>
              )}
            </div>

            {/* Résumé */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <h4 className="font-semibold text-gray-800 mb-2">Résumé</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Nom de l'axe :</span>
                  <div className="font-medium">{axeName || 'Non défini'}</div>
                </div>
                <div>
                  <span className="text-gray-600">Phrases valides :</span>
                  <div className="font-medium">
                    {phrases.filter(p => p.trim()).length}/10
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer avec actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex gap-4">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 font-medium"
            >
              Annuler
            </button>
            <button
              onClick={validateAndSave}
              disabled={isSubmitting || !axeName.trim() || phrases.filter(p => p.trim()).length < 3}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Sauvegarder l'axe</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}