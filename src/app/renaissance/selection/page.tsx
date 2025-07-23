// Sélection des axes (3-6)
// src/app/renaissance/selection/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { renaissanceService } from '../../../lib/services/renaissanceService';
import type { RenaissanceAxe } from '@/lib/types/renaissance';
import AxeSelectionCard from '../components/AxeSelectionCard';
import CustomAxeModal, { CustomAxeData } from '../components/CustomAxeModal';

export default function AxeSelectionPage() {
  const router = useRouter();
  const [availableAxes, setAvailableAxes] = useState<RenaissanceAxe[]>([]);
  const [selectedAxes, setSelectedAxes] = useState<string[]>([]);
  const [startedAxes, setStartedAxes] = useState<string[]>([]); // Axes qui ont commencé (non désélectionnables)
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customAxeData, setCustomAxeData] = useState<CustomAxeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

      // Charger les axes disponibles via le service
      const axes = await renaissanceService.getAvailableAxes();
      // Normaliser pour garantir que phrases est toujours un tableau
      const normalizedAxes = axes.map(a => ({
        ...a,
        phrases: a.phrases ?? [],
      }));
      setAvailableAxes(normalizedAxes);

      // Charger les sélections existantes
      const { data: selectionsData, error: selectionsError } = await supabase
        .from('user_renaissance_selection')
        .select('axe_id, custom_name, custom_phrases, is_started')
        .eq('user_id', session.user.id);

      if (selectionsError) {
        console.error('Erreur lors du chargement des sélections:', selectionsError);
      } else if (selectionsData && selectionsData.length > 0) {
        setSelectedAxes(selectionsData.map(s => s.axe_id));
        
        // Identifier les axes qui ont commencé (is_started = true)
        let started = selectionsData.filter(s => s.is_started).map(s => s.axe_id);
        
        // Vérifier aussi s'il y a des données de progression pour ces axes
        const { data: progressData } = await supabase
          .from('user_renaissance_progress')
          .select('axe_id')
          .eq('user_id', session.user.id)
          .in('axe_id', selectionsData.map(s => s.axe_id));
        
        // Ajouter les axes qui ont des données de progression aux axes non désélectionnables
        if (progressData && progressData.length > 0) {
          const axesWithProgress = progressData.map(p => p.axe_id);
          started = [...new Set([...started, ...axesWithProgress])]; // Utiliser Set pour éviter les doublons
        }
        
        setStartedAxes(started);
        
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
    
    // Effacer le message d'erreur précédent
    setErrorMessage(null);
    
    // Vérifier si l'axe a commencé ou a des données de progression - ne peut pas être désélectionné
    if (startedAxes.includes(axeId)) {
      // Si l'utilisateur essaie de désélectionner un axe sur lequel il a progressé
      if (selectedAxes.includes(axeId)) {
        setErrorMessage("Impossible de désélectionner cet axe car vous avez déjà commencé à travailler dessus. Vos données de progression seraient perdues.");
        return;
      }
    }
    
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
    if (selectedAxes.length < 3) return;

    setSaving(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        router.push('/auth');
        return;
      }

      const uid = session.user.id;
      setUserId(uid);

      const selections = selectedAxes.map((axeId) => {
        const axe = availableAxes.find(a => a.id === axeId);
        return {
          axeId,
          customName: axe?.isCustomizable ? customAxeData?.name : undefined,
          customPhrases: axe?.isCustomizable ? customAxeData?.phrases : undefined,
        };
      });

      await renaissanceService.saveAxeSelection(uid, selections);

      // Rediriger vers le premier axe
      router.push(`/renaissance/${selectedAxes[0]}`);

    } catch (error) {
      const message = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('Erreur lors de la validation:', message);
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
              SÉLECTION DES AXES DE RENAISSANCE
            </span>
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            Gérez vos axes sélectionnés ou ajoutez-en de nouveaux
          </p>
          
          {/* Compteur */}
          <div className="bg-white rounded-2xl shadow-lg p-4 inline-block">
            <span className="text-sm text-gray-600">Axes sélectionnés : </span>
            <span className={`font-bold ${canValidate ? 'text-green-600' : 'text-red-600'}`}>
              {selectedAxes.length}/6
            </span>
            <span className="text-sm text-gray-600 ml-2">(minimum 3)</span>
          </div>

          {/* Message d'erreur */}
          {errorMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mt-4 max-w-2xl mx-auto">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span className="font-medium">{errorMessage}</span>
              </div>
            </div>
          )}
        </div>

        {/* Section des axes sélectionnés */}
        {selectedAxes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>✅</span>
              Vos axes sélectionnés ({selectedAxes.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableAxes
                .filter(axe => selectedAxes.includes(axe.id))
                .map(axe => (
                  <AxeSelectionCard
                    key={axe.id}
                    axe={axe}
                    isSelected={true}
                    onToggle={handleAxeToggle}
                    disabled={startedAxes.includes(axe.id)} // Désactivé si l'axe a commencé
                    isStarted={startedAxes.includes(axe.id)} // Nouvelle prop pour indiquer qu'il a commencé
                  />
                ))}
            </div>
            {startedAxes.length > 0 && (
              <p className="text-sm text-orange-600 mt-2">
                ⚠️ Les axes sur lesquels vous avez déjà progressé ne peuvent plus être désélectionnés pour préserver vos données
              </p>
            )}
          </div>
        )}

        {/* Section des axes disponibles */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🎯</span>
            Axes disponibles ({availableAxes.filter(axe => !selectedAxes.includes(axe.id)).length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableAxes
              .filter(axe => !selectedAxes.includes(axe.id))
              .map(axe => (
                <AxeSelectionCard
                  key={axe.id}
                  axe={axe}
                  isSelected={false}
                  onToggle={handleAxeToggle}
                  disabled={isMaxReached}
                />
              ))}
          </div>
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
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={() => router.push('/renaissance')}
            className="px-6 py-3 text-purple-600 hover:text-purple-800 font-medium border border-purple-300 hover:border-purple-400 rounded-2xl transition-all duration-200"
          >
            🏃‍♂️ Retour à Renaissance
          </button>
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