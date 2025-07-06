// app/programme/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Check } from 'lucide-react';
import { programmeService } from '../lib/programmeService';
import { ProgrammeData } from '../lib/types/programme';

export default function ProgrammePage() {
  const router = useRouter();
  const [programmeData, setProgrammeData] = useState<ProgrammeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer l'utilisateur et initialiser le programme
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/auth');
      return;
    }

    const userData = JSON.parse(user);
    let programme = programmeService.getProgramme(userData.email);
    
    if (!programme) {
      programme = programmeService.initializeProgramme(userData.email);
    }
    
    setProgrammeData(programme);
    setLoading(false);
  }, [router]);

  const handleSubPartClick = (subPartId: number, slug: string) => {
    if (!programmeData) return;
    
    if (programmeService.canAccessSubPart(programmeData.userId, subPartId)) {
      router.push(`/programme/${slug}`);
    }
  };

  if (loading || !programmeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du programme...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              TON PROGRAMME
            </span>
          </h1>
          <p className="text-xl text-gray-700 text-center mb-6">
            C'est le moment d'intégrer ton parcours d'excellence mentale afin de l'enraciner
          </p>
          
          {/* Barre de progression globale */}
          <div className="bg-gray-200 rounded-full h-6 mb-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-1000 flex items-center justify-end pr-2"
              style={{ width: `${programmeData.overallProgress}%` }}
            >
              {programmeData.overallProgress > 0 && (
                <span className="text-white text-sm font-bold">{programmeData.overallProgress}%</span>
              )}
            </div>
          </div>
          <p className="text-center text-gray-600">Progression globale</p>
        </div>

        {/* Grille des sous-parties */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {programmeData.subParts.map((subPart, index) => {
            const canAccess = programmeService.canAccessSubPart(programmeData.userId, subPart.id);
            
            return (
              <div
                key={subPart.id}
                className={`bg-white rounded-2xl p-6 shadow-lg transform transition-all duration-300 ${
                  canAccess ? 'hover:scale-105 cursor-pointer' : 'opacity-60 cursor-not-allowed'
                }`}
                onClick={() => handleSubPartClick(subPart.id, subPart.slug)}
              >
                <div className="text-center">
                  {/* Icône et état */}
                  <div className="relative inline-block mb-4">
                    <div className={`text-6xl ${!canAccess ? 'opacity-50' : ''}`}>
                      {subPart.icon}
                    </div>
                    {!canAccess && index > 0 && (
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
          })}
        </div>

        {/* Message motivationnel */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg text-center">
          <p className="text-lg text-gray-700">
            {programmeData.overallProgress === 0 && "🌟 Commence ton parcours en cliquant sur AMBITIONS"}
            {programmeData.overallProgress > 0 && programmeData.overallProgress < 100 && "💪 Continue comme ça, tu progresses bien !"}
            {programmeData.overallProgress === 100 && "🎉 Félicitations ! Tu as complété tout le programme !"}
          </p>
        </div>

        {/* Bouton retour au dashboard */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Retour au dashboard
          </button>
        </div>
      </div>
    </div>
  );
}