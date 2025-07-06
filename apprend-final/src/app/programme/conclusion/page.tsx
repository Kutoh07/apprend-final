// app/programme/conclusion/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { programmeService } from '@/lib/programmeService';
import { ProgrammeData } from '@/lib/types/programme';

export default function ConclusionPage() {
  const router = useRouter();
  const [programmeData, setProgrammeData] = useState<ProgrammeData | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/auth');
      return;
    }

    const userData = JSON.parse(user);
    const programme = programmeService.getProgramme(userData.email);
    
    if (!programme || programme.overallProgress < 100) {
      router.push('/programme');
      return;
    }

    setProgrammeData(programme);
  }, [router]);

  if (!programmeData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-orange-100 p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
          <div className="text-8xl mb-6">🎉</div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
            FÉLICITATIONS !
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Tu as complété l'intégralité de ton programme d'excellence mentale !
          </p>
          
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-6 mb-8">
            <p className="text-lg text-gray-800 font-medium mb-4">
              Tu as maintenant tous les outils pour :
            </p>
            <ul className="text-left space-y-2 max-w-md mx-auto">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Atteindre tes objectifs les plus ambitieux</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Transformer tes croyances limitantes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Gérer tes émotions avec maîtrise</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Créer l'environnement propice à ta réussite</span>
              </li>
            </ul>
          </div>

          {/* Statistiques du programme */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-100 rounded-xl p-4">
              <p className="text-3xl font-bold text-purple-600">
                {programmeData.subParts.reduce((acc, part) => acc + part.fields.length, 0)}
              </p>
              <p className="text-sm text-gray-600">Entrées complétées</p>
            </div>
            <div className="bg-gray-100 rounded-xl p-4">
              <p className="text-3xl font-bold text-green-600">100%</p>
              <p className="text-sm text-gray-600">Programme complété</p>
            </div>
          </div>

          {programmeData.completedAt && (
            <p className="text-sm text-gray-500 mb-8">
              Complété le {new Date(programmeData.completedAt).toLocaleDateString('fr-FR')}
            </p>
          )}
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/programme')}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105"
            >
              Revoir mon programme
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-4 rounded-full text-lg font-semibold transition-all"
            >
              Retour au dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}