// src/components/dashboard/JourneyPath.tsx

'use client';

import React from 'react';
import { CheckCircle, Circle, Lock, User, BookOpen, Sparkles } from 'lucide-react';
import { ModernCard, CardContent } from '../ui/ModernCard';
import { CircularProgress } from '../ui/ModernProgress';

interface Module {
  id: string;
  name: string;
  completed: boolean;
  progress: number;
}

interface JourneyStage {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'locked';
  progress: number;
  modules?: Module[];
  completedDate?: string;
}

interface JourneyPathProps {
  stages: JourneyStage[];
  currentStage: string;
}

export default function JourneyPath({ stages, currentStage }: JourneyPathProps) {
  const getStageIcon = (stage: JourneyStage) => {
    if (stage.status === 'completed') {
      return <CheckCircle className="w-8 h-8 text-white" />;
    } else if (stage.status === 'current') {
      return stage.icon;
    } else {
      return <Lock className="w-8 h-8 text-gray-400" />;
    }
  };

  const getStageColors = (stage: JourneyStage) => {
    if (stage.status === 'completed') {
      return {
        container: 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg',
        border: 'border-green-500'
      };
    } else if (stage.status === 'current') {
      return {
        container: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg animate-glow',
        border: 'border-blue-500'
      };
    } else {
      return {
        container: 'bg-gray-100 text-gray-400 border border-gray-200',
        border: 'border-gray-300'
      };
    }
  };

  return (
    <ModernCard>
      <CardContent spacing="lg">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ton Parcours de Transformation</h2>
          <p className="text-gray-600">Personalisation • Programme • Renaissance</p>
        </div>

        <div className="relative">
          {/* Ligne de connexion - masquée sur mobile */}
          <div className="hidden md:block absolute top-20 left-0 right-0 h-1 bg-gray-200 z-0" />
          <div 
            className="hidden md:block absolute top-20 left-0 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 z-0 transition-all duration-1000"
            style={{ 
              width: `${(stages.findIndex(s => s.status === 'current') + 0.5) / stages.length * 100}%`
            }}
          />

          {/* Étapes */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {stages.map((stage, index) => (
              <div key={stage.id} className="relative">
                {/* Carte de l'étape avec effets visuels améliorés */}
                <div className="relative group">
                  {/* Effet de halo au hover */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  
                  <div className={`
                    relative rounded-2xl p-4 md:p-6 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl
                    ${stage.status === 'completed' 
                      ? 'bg-white border border-green-100 shadow-sm hover:shadow-green-200/50' 
                      : stage.status === 'current'
                      ? 'bg-white border border-blue-100 shadow-sm hover:shadow-blue-200/50'
                      : 'bg-white border border-gray-100 shadow-sm hover:shadow-gray-200/50'
                    }
                  `}>
                    {/* Badge de statut amélioré */}
                    <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3">
                      <div className={`
                        w-8 h-8 md:w-10 md:h-10 rounded-full border-4 bg-white flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110
                        ${stage.status === 'completed' 
                          ? 'border-green-500 bg-gradient-to-br from-green-400 to-green-600' 
                          : stage.status === 'current'
                          ? 'border-blue-500 bg-gradient-to-br from-blue-400 to-blue-600 animate-pulse'
                          : 'border-gray-300 bg-gradient-to-br from-gray-400 to-gray-600'
                        }
                      `}>
                        {getStageIcon(stage)}
                      </div>
                    </div>

                    {/* Contenu principal */}
                    <div className="text-center space-y-3 md:space-y-4">
                      {/* Icône principale avec effet */}
                      <div className={`
                        w-12 h-12 md:w-16 md:h-16 mx-auto rounded-full flex items-center justify-center mb-3 md:mb-4 transform transition-all duration-300 hover:scale-110
                        ${stage.status === 'completed' 
                          ? 'bg-gradient-to-br from-green-100 to-green-200 text-green-600' 
                          : stage.status === 'current'
                          ? 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600'
                          : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400'
                        }
                      `}>
                        {stage.icon}
                      </div>

                      <div>
                        <h3 className={`text-lg md:text-xl font-bold mb-2 ${
                          stage.status === 'locked' ? 'text-gray-500' : 'text-gray-800'
                        }`}>
                          {stage.name}
                        </h3>
                        <p className={`text-xs md:text-sm ${
                          stage.status === 'locked' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {stage.description}
                        </p>
                      </div>

                      {/* Progression améliorée avec jauge horizontale */}
                      {stage.status !== 'locked' && (
                        <div className="space-y-2 md:space-y-3">
                          {/* Jauge horizontale élégante */}
                          <div className="relative">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Progression</span>
                              <span className="text-lg font-bold text-gray-800">{stage.progress}%</span>
                            </div>
                            
                            <div className="relative">
                              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-1000 ease-out relative rounded-full ${
                                    stage.status === 'completed' 
                                      ? 'bg-gradient-to-r from-green-400 to-green-600' 
                                      : 'bg-gradient-to-r from-blue-400 to-blue-600'
                                  }`}
                                  style={{ width: `${stage.progress}%` }}
                                >
                                  {/* Effet de brillance */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                                </div>
                              </div>
                              
                              {/* Points de palier */}
                              <div className="absolute top-0 left-0 right-0 flex justify-between items-center h-3">
                                {[25, 50, 75].map((threshold) => (
                                  <div 
                                    key={threshold}
                                    className={`w-1 h-3 rounded-full ${
                                      stage.progress >= threshold ? 'bg-white shadow-sm' : 'bg-gray-300'
                                    }`}
                                    style={{ marginLeft: `${threshold}%` }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {/* Étoiles d'animation pour les étapes complétées */}
                          {stage.status === 'completed' && (
                            <div className="flex justify-center gap-2">
                              <div className="text-yellow-400 text-sm animate-bounce">⭐</div>
                              <div className="text-green-400 text-xs animate-pulse">✨</div>
                              <div className="text-blue-400 text-xs animate-ping">💫</div>
                            </div>
                          )}
                          
                          {/* Badge de statut textuel */}
                          <div className="flex justify-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              stage.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {stage.status === 'completed' ? '✓ Complété' : '⚡ En cours'}
                            </span>
                          </div>
                          
                          {stage.completedDate && (
                            <p className="text-xs text-gray-500 text-center">
                              Complété le {stage.completedDate}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modules détaillés avec design amélioré */}
                  {stage.modules && stage.modules.length > 0 && (
                    <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-gray-200">
                      <h4 className={`text-xs md:text-sm font-semibold mb-2 md:mb-3 flex items-center gap-2 ${
                        stage.status === 'locked' ? 'text-gray-500' : 'text-gray-800'
                      }`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          stage.status === 'completed' 
                            ? 'bg-green-100 text-green-600' 
                            : stage.status === 'current'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {stage.id === 'personalisation' ? '🎯' : stage.id === 'renaissance' ? '🦋' : '📚'}
                        </div>
                        {stage.id === 'personalisation' 
                          ? `Thématiques (${stage.modules.filter(m => m.completed).length}/${stage.modules.length})`
                          : stage.id === 'renaissance'
                          ? `Axes (${stage.modules.filter(m => m.completed).length}/${stage.modules.length})`
                          : `Modules (${stage.modules.filter(m => m.completed).length}/${stage.modules.length})`
                        }
                      </h4>
                      
                      <div className="space-y-1 md:space-y-2">
                        {stage.modules.map((module) => (
                          <div
                            key={module.id}
                            className={`flex items-center justify-between rounded-lg p-2 md:p-3 border transition-all duration-200 hover:shadow-sm ${
                              module.completed 
                                ? 'bg-green-50 border-green-100 hover:bg-green-100' 
                                : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {module.completed ? (
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center">
                                  <Circle className="w-3 h-3 md:w-4 md:h-4 text-gray-300" />
                                </div>
                              )}
                              <span className={`text-xs md:text-sm font-medium ${
                                module.completed ? 'text-green-800' : 'text-gray-700'
                              }`}>
                                {module.name}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {!module.completed && module.progress > 0 && (
                                <div className="flex items-center gap-1">
                                  <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                      style={{ width: `${module.progress}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {module.progress}%
                                  </span>
                                </div>
                              )}
                              {module.completed && (
                                <span className="text-xs font-medium text-green-600">✓ Fait</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Résumé global avec design amélioré */}
        <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <div className="text-center p-3 md:p-4 bg-green-50 border border-green-100 rounded-xl hover:shadow-sm transition-all duration-200">
              <div className="text-xl md:text-2xl font-bold text-green-600 mb-1">
                {stages.filter(s => s.status === 'completed').length}
              </div>
              <div className="text-xs md:text-sm text-green-700 font-medium">Étapes complètes</div>
              <div className="mt-1 text-green-500">
                <div className="w-2 h-2 bg-green-500 rounded-full mx-auto"></div>
              </div>
            </div>
            
            <div className="text-center p-3 md:p-4 bg-blue-50 border border-blue-100 rounded-xl hover:shadow-sm transition-all duration-200">
              <div className="text-xl md:text-2xl font-bold text-blue-600 mb-1">
                {stages.reduce((total, stage) => {
                  return total + (stage.modules?.filter(m => m.completed).length || 0);
                }, 0)}
              </div>
              <div className="text-xs md:text-sm text-blue-700 font-medium">Parties terminées</div>
              <div className="mt-1 text-blue-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto"></div>
              </div>
            </div>
            
            <div className="text-center p-3 md:p-4 bg-purple-50 border border-purple-100 rounded-xl hover:shadow-sm transition-all duration-200">
              <div className="text-xl md:text-2xl font-bold text-purple-600 mb-1">
                {Math.round(stages.reduce((total, stage) => total + stage.progress, 0) / stages.length)}%
              </div>
              <div className="text-xs md:text-sm text-purple-700 font-medium">Progression totale</div>
              <div className="mt-1">
                <div className="w-8 h-1.5 bg-purple-200 rounded-full mx-auto overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${Math.round(stages.reduce((total, stage) => total + stage.progress, 0) / stages.length)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </ModernCard>
  );
}
