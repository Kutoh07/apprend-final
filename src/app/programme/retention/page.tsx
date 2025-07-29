// app/programme/retention/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ModernLayout } from '@/components/layout/ModernLayout';
import { LoadingSpinner } from '@/app/dashboard/components/LoadingSpinner';
import RetentionStepper from '@/components/retention/RetentionStepper';
import { ModernCard, CardContent } from '@/components/ui/ModernCard';

// Force dynamic rendering pour éviter les erreurs SSR avec localStorage
export const dynamic = 'force-dynamic';

export default function RetentionPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Erreur de session:', sessionError);
          setError('Erreur d\'authentification');
          return;
        }

        if (!session?.user) {
          router.push('/auth');
          return;
        }

        const currentUserId = session.user.id;
        setUserId(currentUserId);

        // Vérifier que l'ENVIRONNEMENT est complété avant d'autoriser l'accès à la RETENTION
        try {
          console.log('🔍 Vérification de l\'accès RETENTION via Supabase...');
          
          // Utiliser le service Supabase pour récupérer les données
          const { programmeSupabaseService } = await import('@/lib/programmeSupabaseService');
          const programmeData = await programmeSupabaseService.getProgramme(currentUserId);
          
          console.log('� Programme data récupéré:', programmeData);
          
          if (!programmeData || !programmeData.subParts) {
            console.log('⚠️ Aucune donnée programme trouvée via Supabase');
            setAccessDenied(true);
            return;
          }
          
          const environnementModule = programmeData.subParts.find((part: any) => part.id === 7); // ENVIRONNEMENT
          console.log('🌍 Module ENVIRONNEMENT trouvé:', environnementModule);
          
          if (!environnementModule || !environnementModule.completed || environnementModule.progress < 100) {
            console.log('🚫 Accès refusé: ENVIRONNEMENT non complété', {
              existe: !!environnementModule,
              completed: environnementModule?.completed,
              progress: environnementModule?.progress
            });
            setAccessDenied(true);
            return;
          }
          
          console.log('✅ Accès autorisé: ENVIRONNEMENT complété à 100%');
        } catch (error) {
          console.warn('Erreur lors de la vérification d\'accès Supabase:', error);
          setAccessDenied(true);
          return;
        }

      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        setError('Une erreur inattendue s\'est produite');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleComplete = () => {
    console.log('🎉 Parcours de rétention terminé !');
    // Le stepper s'occupe de la redirection vers /renaissance
  };

  if (accessDenied) {
    return (
      <ModernLayout 
        title="Accès Restreint" 
        className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50"
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <ModernCard variant="elevated" className="text-center max-w-md">
            <CardContent spacing="lg">
              <div className="text-orange-500 text-6xl mb-4">🔒</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Accès Restreint
              </h3>
              <p className="text-gray-600 mb-6">
                Vous devez d'abord compléter le module <strong>ENVIRONNEMENT</strong> à 100% 
                avant d'accéder à la Rétention.
              </p>
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/programme/environnement')}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="text-xl">🌍</span>
                  Compléter ENVIRONNEMENT
                </button>
                <button 
                  onClick={() => router.push('/programme')}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Retour au Programme
                </button>
              </div>
            </CardContent>
          </ModernCard>
        </div>
      </ModernLayout>
    );
  }

  if (loading) {
    return (
      <ModernLayout 
        title="Rétention - Validation Progressive" 
        className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50"
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <ModernCard variant="glass" className="text-center">
            <CardContent spacing="lg">
              <LoadingSpinner />
              <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">
                Chargement de votre parcours
              </h3>
              <p className="text-gray-600">
                Préparation de votre validation progressive...
              </p>
            </CardContent>
          </ModernCard>
        </div>
      </ModernLayout>
    );
  }

  if (error) {
    return (
      <ModernLayout 
        title="Erreur" 
        className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50"
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <ModernCard variant="elevated" className="text-center">
            <CardContent spacing="lg">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Une erreur s'est produite
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Réessayer
              </button>
            </CardContent>
          </ModernCard>
        </div>
      </ModernLayout>
    );
  }

  if (!userId) {
    return null; // Redirection en cours
  }

  return (
    <ModernLayout 
      title="Rétention" 
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50"
    >
      <div className="container mx-auto px-4 py-8">
        {/* Bouton retour ENVIRONNEMENT - positionné à gauche */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/programme/environnement')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="text-xl">◀</span>
            <span className="font-medium">ENVIRONNEMENT</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-6 py-3 rounded-full text-sm font-medium mb-6">
            <span className="text-2xl">🎯</span>
            <span>Rétention - Comprendre la suite de ta transformation</span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Prépare-toi pour la{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Renaissance
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Découvre étape par étape comment ta transformation va s'ancrer durablement 
            grâce au module Renaissance. Chaque information que tu vas découvrir est 
            essentielle pour ta réussite.
          </p>
        </div>

        {/* Stepper principal */}
        <RetentionStepper
          userId={userId}
          onComplete={handleComplete}
          className="max-w-6xl mx-auto"
        />

        {/* Footer informatif */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-2 text-gray-500 text-sm">
            <span>💡</span>
            <span>
              Prends le temps d'assimiler chaque information. 
              Elles sont toutes importantes pour ta transformation durable.
            </span>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}