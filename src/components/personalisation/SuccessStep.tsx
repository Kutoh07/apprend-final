// src/components/personalisation/SuccessStep.tsx

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserData } from '../../app/personalisation/page';
import { UserProfileService } from '../../lib/userProfileService';
import { programmeSupabaseService } from '../../lib/programmeSupabaseService';
import { supabase } from '../../lib/supabase';
import {
  getProfessionLabelFromValue,
  getCountryLabelFromValue,
} from '../../lib/dataMappings';

interface SuccessStepProps {
  userData: UserData;
  onNext: () => void;
  onBack: () => void;
}

export default function SuccessStep({ userData, onNext, onBack }: SuccessStepProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    setSaving(true);
    setError(null);
    
    try {
      // Récupérer l'utilisateur connecté
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Utilisateur non connecté');
      }

      // Sauvegarder le profil dans Supabase
      console.log('Sauvegarde du profil utilisateur:', userData);
      
      const result = await UserProfileService.saveUserProfile(userData);
      
      if (result && !result.error) {
        console.log('Profil sauvegardé avec succès:', result);
        
        // Initialiser le programme pour cet utilisateur
        console.log('Initialisation du programme...');
        await programmeSupabaseService.initializeProgramme(session.user.id);
        
        setSaved(true);
        
        // Sauvegarder aussi en local pour compatibilité
        const userInfo = {
          id: session.user.id,
          email: session.user.email,
          name: userData.name,
          created_at: session.user.created_at,
          progress: {
            level: 0, // Nouvel utilisateur
            skills: {
              confiance: 20,
              discipline: 15,
              action: 30
            }
          }
        };
        
        localStorage.setItem('user', JSON.stringify(userInfo));
        localStorage.setItem('userPersonalisation', JSON.stringify(userData));
        
        // Attendre 1.5 secondes pour montrer le succès, puis rediriger
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
        
      } else {
        throw new Error(result?.error?.message || 'Erreur lors de la sauvegarde');
      }

    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setError('Erreur lors de la sauvegarde. Vos données ont été sauvegardées localement.');
      
      // Sauvegarder en local même en cas d'erreur
      localStorage.setItem('userPersonalisation', JSON.stringify(userData));
      
      // Rediriger vers le dashboard après 2 secondes même en cas d'erreur
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-8">
        
        {/* Titre */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-sky-400 mb-8 tracking-wide">
            PERSONALISATION
          </h1>
        </div>

        {/* Contenu principal */}
        <div className="flex items-center justify-between">
          
          {/* Texte de félicitations */}
          <div className="flex-1 pr-8">
            <p className="text-xl text-gray-700 leading-relaxed mb-6">
              Enchanté <strong className="text-sky-600">{userData.name}</strong> ! L'équipe APPREND est 
              heureuse de t'accueillir à bord de sa fusée à destination de la femme 2.0 que tu aspires à 
              devenir.
            </p>
            <p className="text-xl text-gray-700 leading-relaxed">
              Maintenant tu peux renseigner tes résultats de la méthode "ACCEPTER"
            </p>
            
            {/* Statut de sauvegarde */}
            {saving && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-blue-700">Sauvegarde et initialisation du programme...</span>
                </div>
              </div>
            )}
            
            {saved && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-green-700">Profil sauvegardé et programme initialisé ! Redirection en cours...</span>
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-orange-600">⚠️</span>
                  <span className="text-orange-700">{error}</span>
                </div>
              </div>
            )}
          </div>

          {/* Illustration fusée */}
          <div className="flex-1 flex justify-center">
            <div className="relative">
              {/* Fusée simple */}
              <div className="w-16 h-32 bg-gradient-to-t from-red-400 via-orange-400 to-yellow-400 rounded-t-full relative mx-auto">
                {/* Corps de la fusée */}
                <div className="w-12 h-24 bg-gradient-to-t from-gray-300 to-gray-100 rounded-t-full absolute top-8 left-2"></div>
                {/* Hublot */}
                <div className="w-6 h-6 bg-blue-200 rounded-full absolute top-12 left-5 border-2 border-gray-400"></div>
                {/* Aileron gauche */}
                <div className="w-6 h-8 bg-red-500 absolute bottom-0 -left-2 transform -skew-x-12"></div>
                {/* Aileron droit */}
                <div className="w-6 h-8 bg-red-500 absolute bottom-0 -right-2 transform skew-x-12"></div>
              </div>
              {/* Flammes */}
              {saving && (
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="w-8 h-6 bg-gradient-to-t from-red-500 to-orange-400 rounded-b-full animate-pulse"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Résumé des informations */}
        <div className="mt-12 p-6 bg-sky-50 rounded-2xl">
          <h3 className="text-lg font-semibold text-sky-700 mb-4">Récapitulatif de tes informations :</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <div><strong>Nom :</strong> {userData.name}</div>
            <div><strong>Année de naissance :</strong> {userData.birthYear}</div>
            <div><strong>Profession :</strong> {getProfessionLabelFromValue(userData.profession)}</div>
            {userData.gender && <div><strong>Genre :</strong> {userData.gender}</div>}
            {userData.phone && <div><strong>Téléphone :</strong> {userData.phone}</div>}
            {userData.country && (
              <div><strong>Pays :</strong> {getCountryLabelFromValue(userData.country)}</div>
            )}
          </div>
        </div>

        {/* Boutons */}
        <div className="flex justify-between items-center mt-16">
          <button 
            onClick={onBack}
            disabled={saving || saved}
            className="bg-sky-300 hover:bg-sky-400 text-white font-semibold py-4 px-12 rounded-full text-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Retour
          </button>
          
          <button 
            onClick={handleContinue}
            disabled={saving || saved}
            className="bg-sky-400 hover:bg-sky-500 text-white font-semibold py-4 px-12 rounded-full text-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Sauvegarde...' : saved ? 'Redirection...' : 'Continuer'}
          </button>
        </div>
      </div>
    </div>
  );
}