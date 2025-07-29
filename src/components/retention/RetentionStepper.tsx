// src/components/retention/RetentionStepper.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import StepperNavigation from './StepperNavigation';
import StepContent from './StepContent';
import { LoadingSpinner } from '@/app/dashboard/components/LoadingSpinner';
import { RetentionValidationService } from '@/lib/services/retentionValidationService';
import { RETENTION_STEPS_CONFIG } from '@/lib/types/retention';
import type { 
  RetentionStepperProps, 
  RetentionValidationStep, 
  RetentionValidationState 
} from '@/lib/types/retention';

// Fonction simple de notification (peut être remplacée par une vraie solution toast plus tard)
const showNotification = (message: string, type: 'success' | 'error' = 'error') => {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // Ici on pourrait utiliser une vraie notification plus tard
};

export default function RetentionStepper({ 
  userId, 
  onComplete, 
  className = '' 
}: RetentionStepperProps) {
  
  const router = useRouter();
  const [validationState, setValidationState] = useState<RetentionValidationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [steps, setSteps] = useState<RetentionValidationStep[]>([]);

  // Charger l'état initial
  useEffect(() => {
    loadValidationState();
  }, [userId]);

  const loadValidationState = async () => {
    try {
      setLoading(true);
      const { data, error } = await RetentionValidationService.getOrCreateValidationState(userId);
      
      if (error) {
        console.error('Erreur lors du chargement de l\'état:', error);
        
        // Mode démo si la table n'existe pas
        if (error.code === '42P01') {
          console.log('🎭 Mode démo activé - table retention_validation manquante');
          const demoState: RetentionValidationState = {
            id: 'demo-id',
            userId: userId,
            currentStep: 1,
            completedSteps: [],
            stepTimestamps: {},
            isCompleted: false,
            startedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setValidationState(demoState);
          updateStepsFromState(demoState);
        } else {
          showNotification('Erreur lors du chargement de votre progression');
        }
        return;
      }

      if (data) {
        setValidationState(data);
        updateStepsFromState(data);
      }
    } catch (error) {
      console.error('Erreur dans loadValidationState:', error);
      showNotification('Une erreur inattendue s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  const updateStepsFromState = (state: RetentionValidationState) => {
    const updatedSteps = RETENTION_STEPS_CONFIG.map(stepConfig => ({
      ...stepConfig,
      completed: state.completedSteps.includes(stepConfig.id),
      current: state.currentStep === stepConfig.id,
      locked: stepConfig.id > state.currentStep && !state.completedSteps.includes(stepConfig.id)
    }));
    
    setSteps(updatedSteps);
    
    // Calculer et synchroniser la progression
    const progress = Math.round((state.completedSteps.length / 6) * 100);
    console.log(`📊 Progression calculée: ${state.completedSteps.length}/6 étapes = ${progress}%`);
    
    // Synchroniser avec le module principal
    RetentionValidationService.syncRetentionProgressWithModule(userId, progress);
  };

  const handleStepChange = useCallback(async (newStepId: number) => {
    if (!validationState || updating) return;

    // Vérifier si l'étape est accessible
    const targetStep = steps.find(s => s.id === newStepId);
    if (!targetStep || targetStep.locked) {
      showNotification('Cette étape n\'est pas encore accessible');
      return;
    }

    try {
      setUpdating(true);
      
      // Mettre à jour l'état local immédiatement pour une meilleure UX
      const newState = {
        ...validationState,
        currentStep: newStepId
      };
      setValidationState(newState);
      updateStepsFromState(newState);

      // Mode démo - ne pas sauvegarder en base
      if (validationState.id === 'demo-id') {
        console.log('🎭 Mode démo - mise à jour locale uniquement');
        setUpdating(false);
        return;
      }

      // Mettre à jour en base de données
      const { data, error } = await RetentionValidationService.updateCurrentStep(userId, newStepId);
      
      if (error) {
        console.error('Erreur lors de la mise à jour:', error);
        // Revenir à l'état précédent en cas d'erreur
        setValidationState(validationState);
        updateStepsFromState(validationState);
        showNotification('Erreur lors de la sauvegarde');
        return;
      }

      if (data) {
        setValidationState(data);
        updateStepsFromState(data);
      }
    } catch (error) {
      console.error('Erreur dans handleStepChange:', error);
      showNotification('Une erreur inattendue s\'est produite');
    } finally {
      setUpdating(false);
    }
  }, [validationState, updating, steps, userId]);

  const handleNextStep = useCallback(async () => {
    if (!validationState || updating) return;

    console.log('🔄 handleNextStep appelée - état actuel:', {
      currentStep: validationState.currentStep,
      completedSteps: validationState.completedSteps
    });

    const currentStepId = validationState.currentStep;
    const nextStepId = currentStepId + 1;

    // Si c'est la dernière étape, marquer comme terminé et rediriger
    if (currentStepId === 6) {
      try {
        setUpdating(true);
        
        // Mode démo - redirection directe
        if (validationState.id === 'demo-id') {
          console.log('🎭 Mode démo - redirection directe vers Renaissance');
          // Marquer le module RETENTION comme complété dans le localStorage
          try {
            const programmeData = JSON.parse(localStorage.getItem(`programme_data_${userId}`) || '{}');
            if (programmeData.subParts) {
              const retentionModule = programmeData.subParts.find((part: any) => part.id === 8);
              if (retentionModule) {
                retentionModule.progress = 100;
                retentionModule.completed = true;
                // Recalculer la progression globale
                const totalProgress = programmeData.subParts.reduce((acc: number, part: any) => acc + part.progress, 0);
                programmeData.overallProgress = Math.round(totalProgress / programmeData.subParts.length);
                programmeData.lastUpdated = new Date();
                localStorage.setItem(`programme_data_${userId}`, JSON.stringify(programmeData));
                console.log('✅ Module RETENTION marqué comme complété (100%)');
              }
            }
          } catch (error) {
            console.warn('Erreur lors de la mise à jour locale:', error);
          }
          
          showNotification('🎉 Félicitations ! Direction la Renaissance !', 'success');
          setTimeout(() => {
            router.push('/renaissance');
            onComplete();
          }, 2000);
          return;
        }
        
        const { error } = await RetentionValidationService.markAsCompleted(userId);
        
        if (error) {
          console.error('Erreur lors de la finalisation:', error);
          showNotification('Erreur lors de la finalisation');
          return;
        }

        // Marquer le module RETENTION comme complété (progression 100%)
        try {
          const { ModuleService } = await import('@/lib/moduleService');
          await ModuleService.recalculateAllModulesProgress(userId);
          console.log('✅ Module RETENTION marqué comme complété dans la base');
        } catch (error) {
          console.warn('Erreur lors de la mise à jour du module:', error);
        }

        showNotification('🎉 Félicitations ! Vous êtes prête pour la Renaissance !', 'success');
        
        // Rediriger vers la page Renaissance
        setTimeout(() => {
          router.push('/renaissance');
          onComplete();
        }, 2000);
        
      } catch (error) {
        console.error('Erreur dans la finalisation:', error);
        showNotification('Une erreur inattendue s\'est produite');
      } finally {
        setUpdating(false);
      }
      return;
    }

    // Marquer l'étape courante comme complétée et passer à la suivante
    try {
      setUpdating(true);
      
      const updatedCompletedSteps = [...validationState.completedSteps];
      if (!updatedCompletedSteps.includes(currentStepId)) {
        updatedCompletedSteps.push(currentStepId);
      }

      const newState = {
        ...validationState,
        currentStep: nextStepId,
        completedSteps: updatedCompletedSteps
      };

      console.log('📈 Mise à jour vers:', {
        currentStep: newState.currentStep,
        completedSteps: newState.completedSteps
      });

      setValidationState(newState);
      updateStepsFromState(newState);

      // Mode démo - ne pas sauvegarder en base
      if (validationState.id === 'demo-id') {
        console.log('🎭 Mode démo - progression locale uniquement');
        // Pas de sauvegarde en base pour le mode démo
      } else {
        // Sauvegarder en base seulement si ce n'est pas le mode démo
        const { error } = await RetentionValidationService.updateCurrentStep(userId, nextStepId);
        
        if (error) {
          console.error('Erreur lors de la mise à jour:', error);
          // Revenir à l'état précédent
          setValidationState(validationState);
          updateStepsFromState(validationState);
          showNotification('Erreur lors de la sauvegarde');
          return;
        }
      }
    } catch (error) {
      console.error('Erreur dans handleNextStep:', error);
      showNotification('Une erreur inattendue s\'est produite');
    } finally {
      setUpdating(false);
    }
  }, [validationState, updating, userId, router, onComplete]);

  const handlePreviousStep = useCallback(() => {
    if (!validationState || updating) return;

    const currentStepId = validationState.currentStep;
    const previousStepId = Math.max(1, currentStepId - 1);
    
    handleStepChange(previousStepId);
  }, [validationState, updating, handleStepChange]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Chargement de votre parcours de validation...</p>
        </div>
      </div>
    );
  }

  // Error state - ne devrait plus se produire avec le mode démo
  if (!validationState) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Initialisation du parcours...</p>
        </div>
      </div>
    );
  }

  const currentStep = steps.find(s => s.current);
  
  if (!currentStep) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Aucune étape trouvée</p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Indicateur de mode démo */}
      {validationState.id === 'demo-id' && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center text-amber-800">
            <span className="text-2xl mr-3">🎭</span>
            <div>
              <p className="font-medium">Mode Démonstration</p>
              <p className="text-sm text-amber-700">
                La table de base de données n'est pas configurée. Votre progression ne sera pas sauvegardée.
                <br />
                <a 
                  href="/GUIDE_RETENTION_SETUP.md" 
                  target="_blank"
                  className="underline hover:text-amber-900"
                >
                  Voir le guide de configuration →
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation du stepper */}
      <StepperNavigation
        steps={steps}
        currentStep={validationState.currentStep}
        onStepChange={handleStepChange}
        className="mb-8"
      />

      {/* Contenu de l'étape courante */}
      <StepContent
        step={currentStep}
        onNext={handleNextStep}
        onPrevious={validationState.currentStep > 1 ? handlePreviousStep : undefined}
        isLoading={updating}
      />
    </div>
  );
}
