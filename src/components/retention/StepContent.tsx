// src/components/retention/StepContent.tsx

'use client';

import React from 'react';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { ModernCard, CardContent } from '@/components/ui/ModernCard';
import { ActionButton, ModernButton } from '@/components/ui/ModernButton';
import type { StepContentProps } from '@/lib/types/retention';

export default function StepContent({ 
  step, 
  onNext, 
  onPrevious, 
  isLoading = false, 
  className = '' 
}: StepContentProps) {

  const formatContent = (content: string) => {
    // Remplacer les markdown basiques par du HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/•/g, '•')
      .split('\n')
      .map((line, index) => {
        if (line.trim().startsWith('•')) {
          return `<li key=${index} class="mb-2">${line.trim().substring(1).trim()}</li>`;
        }
        return line.trim() ? `<p key=${index} class="mb-4">${line.trim()}</p>` : '';
      })
      .join('');
  };

  const isLastStep = step.id === 6;

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      <ModernCard variant="elevated" className="overflow-hidden">
        {/* Header avec gradient */}
        <div className={`${step.gradient} p-8 text-white relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-lg" />
          
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="text-4xl mr-4">{step.icon}</div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{step.title}</h1>
                {step.subtitle && (
                  <p className="text-white/90 text-lg">{step.subtitle}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <CardContent spacing="lg">
          <div className="prose prose-lg max-w-none p-4">
            <div 
              className="text-gray-700 leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ 
                __html: formatContent(step.content) 
              }}
            />
          </div>

          {/* Section spéciale pour l'étape 6 avec exemples sensoriels */}
          {step.id === 6 && (
            <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
              <h3 className="text-xl font-semibold text-purple-900 mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2" />
                Exemple concret d'ancrage multisensoriel
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-2">👀 Vue - Je vois :</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Les phrases apparaître en flash sur l'application</li>
                      <li>• Les phrases que j'écris dans mon carnet arc-en-ciel</li>
                      <li>• Les couleurs vives de mes fournitures inspirantes</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-2">👂 Ouïe - J'entends :</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Ma voix lire et prononcer les affirmations</li>
                      <li>• L'application lire les phrases à voix haute</li>
                      <li>• Le son relaxant de mes fournitures</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-2">👃 Odorat - Je sens :</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• L'huile essentielle de lavande dans ma pochette</li>
                      <li>• Les arômes qui me rappellent mon enfance</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-2">✋ Toucher - Je ressens :</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• La texture soyeuse de ma pochette en satin</li>
                      <li>• Le contact agréable de mon stylo à paillettes</li>
                      <li>• La douceur du papier de mon carnet</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Boutons de navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            {step.id > 1 && onPrevious ? (
              <ModernButton
                variant="ghost"
                onClick={onPrevious}
                disabled={isLoading}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="text-gray-600"
              >
                Étape précédente
              </ModernButton>
            ) : (
              <div></div>
            )}

            <ActionButton
              onClick={onNext}
              disabled={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              size="lg"
              className="min-w-[200px] transition-none"
            >
              {isLoading ? 'Chargement...' : step.actionText}
            </ActionButton>
          </div>

          {/* Indicateur pour la dernière étape */}
          {isLastStep && (
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="flex items-center text-green-800">
                <Sparkles className="w-5 h-5 mr-2" />
                <span className="font-medium">
                  Prête à commencer ta Renaissance ? Cette étape va t'amener vers l'ancrage définitif de ta transformation !
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </ModernCard>
    </div>
  );
}
