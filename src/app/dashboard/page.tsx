// src/app/dashboard/page.tsx

'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Target, TrendingUp, Award, Smile, Home, LogOut, Settings, BookOpen, BarChart3 } from 'lucide-react';
import { UserProfileService } from '../../lib/userProfileService';
import { programmeSupabaseService } from '../../lib/programmeSupabaseService';
import { ProgrammeData } from '../../lib/types/programme';
import { supabase } from '../../lib/supabase';
import type { User, UserProgress, Level, Skill, ProgressMessage, ActionCard } from './types';
import { Header } from './components/Header';
import { LevelCard } from './components/LevelCard';
import { SkillBar } from './components/SkillBar';
import { ProgressDisplay } from './components/ProgressDisplay';
import { ActionCardComponent } from './components/ActionCard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { renaissanceService } from '../../lib/services/renaissanceService';
import type { RenaissanceStats } from '@/lib/types/renaissance';

// ====== UTILITAIRES PURS ======
const skillsConfig: Omit<Skill, 'value'>[] = [
  { 
    name: "CONFIANCE", 
    color: "bg-yellow-400",
    description: "Croire en ses capacités",
    icon: "💪"
  },
  { 
    name: "DISCIPLINE", 
    color: "bg-red-400",
    description: "Constance dans l'action",
    icon: "🎯"
  },
  { 
    name: "ACTION", 
    color: "bg-purple-400",
    description: "Passage à l'acte",
    icon: "🚀"
  }
];

const defaultSkillValues = { confiance: 85, discipline: 70, action: 95 };

// Fonctions utilitaires pures
const calculateAverageProgress = (programmeData: ProgrammeData | null, skills: Skill[]): number => {
  return programmeData?.overallProgress || Math.round(skills.reduce((acc, skill) => acc + skill.value, 0) / skills.length);
};

const createSkills = (userProgress?: UserProgress): Skill[] => {
  return skillsConfig.map(config => ({
    ...config,
    value: userProgress?.skills[config.name.toLowerCase() as keyof typeof userProgress.skills] || 
           defaultSkillValues[config.name.toLowerCase() as keyof typeof defaultSkillValues]
  }));
};

const createLevels = (averageProgress: number, programmeData: ProgrammeData | null, renaissanceStats: RenaissanceStats | null): Level[] => [
  {
    name: "PERSONNALISE",
    color: "from-pink-400 to-pink-600",
    icon: Target,
    progress: averageProgress >= 20 ? 100 : (averageProgress / 20) * 100,
    description: "Découverte de ton profil unique",
    isClickable: true
  },
  {
    name: "PROGRAMME", 
    color: "from-purple-400 to-purple-600",
    icon: TrendingUp,
    progress: programmeData ? programmeData.overallProgress : Math.max(0, (averageProgress - 20) / 40) * 100,
    description: "Structuration de ton parcours",
    isClickable: true
  },
  {
    name: "RENAISSANCE",
    color: "from-indigo-400 to-indigo-600", 
    icon: Award,
    progress: renaissanceStats ? renaissanceStats.totalProgress : 0,
    description: "Transformation profonde",
    isClickable: programmeData ? programmeData.overallProgress >= 100 : false
  },
  {
    name: "ÉVOLUTION",
    color: "from-yellow-400 to-yellow-600",
    icon: Smile,
    progress: averageProgress >= 100 ? 100 : 0,
    description: "Maîtrise et rayonnement",
    isClickable: false
  }
];

const getProgressMessage = (averageProgress: number): ProgressMessage => {
  if (averageProgress < 20) {
    return {
      range: "0% - 19%",
      message: "Tu débutes ton voyage de transformation. Chaque petit pas te rapproche de tes objectifs !",
      emoji: "🌱",
      bgColor: "bg-green-50 border-green-200",
      textColor: "text-green-800"
    };
  } else if (averageProgress < 60) {
    return {
      range: "20% - 59%",
      message: "Tu progresses bien ! Ta motivation et ta persévérance commencent à payer.",
      emoji: "🚀",
      bgColor: "bg-blue-50 border-blue-200", 
      textColor: "text-blue-800"
    };
  } else if (averageProgress < 100) {
    return {
      range: "60% - 99%",
      message: "Tu es à quelques pas d'être la femme qui atteint ses objectifs les plus ambitieux",
      emoji: "✨",
      bgColor: "bg-purple-50 border-purple-200",
      textColor: "text-purple-800"
    };
  } else {
    return {
      range: "100%",
      message: "Tu rayonnes grâce à ton travail, ta discipline et ta détermination. Tu es la femme qui atteint ses objectifs les plus ambitieux !",
      emoji: "👑",
      bgColor: "bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-300",
      textColor: "text-yellow-800"
    };
  }
};

// ====== COMPOSANT PRINCIPAL ======
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [programmeData, setProgrammeData] = useState<ProgrammeData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [renaissanceStats, setRenaissanceStats] = useState<RenaissanceStats | null>(null);

  // Handlers
  const handleNavigate = (path: string) => router.push(path);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    router.push('/');
  };

  const loadRenaissanceStats = async (userId: string) => {
    try {
      const stats = await renaissanceService.getUserStats(userId);
      setRenaissanceStats(stats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques Renaissance:', error);
      // En cas d'erreur, on laisse renaissanceStats à null (progression = 0)
    }
  };

  const handleLevelClick = (level: Level) => {
    const routeMap: Record<string, string> = {
      "PERSONNALISE": '/personalisation',
      "PERSONALISE": '/personalisation',
      "PROGRAMME": '/programme',
      "RENAISSANCE": '/renaissance'
    };
    
    const route = routeMap[level.name];
    if (route) {
      // Vérification spéciale pour Renaissance
      if (level.name === "RENAISSANCE" && programmeData && programmeData.overallProgress < 100) {
        alert("Vous devez compléter 100% du programme pour accéder à Renaissance !");
        return;
      }
      router.push(route);
    } else {
      alert(`${level.name} : Cette fonctionnalité sera bientôt disponible !`);
    }
  };

  // Chargement des données
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          router.push('/auth');
          return;
        }

        const { data: profile } = await UserProfileService.getUserProfile();
        
        // Récupérer les données du programme SANS les réinitialiser
        let programme = await programmeSupabaseService.getProgramme(session.user.id);
        
        // Si le programme n'existe pas, l'initialiser seulement
        if (!programme) {
          programme = await programmeSupabaseService.initializeProgramme(session.user.id);
        }

        // Charger les statistiques Renaissance si le programme est complété
        if (programme && programme.overallProgress >= 100) {
          await loadRenaissanceStats(session.user.id);
        }

        const userData: User = {
          email: session.user.email || '',
          name: profile?.name || session.user.email?.split('@')[0] || 'Utilisateur',
          progress: {
            level: programme?.overallProgress || 0,
            skills: {
              confiance: 85,
              discipline: 70,
              action: 95
            }
          },
          createdAt: session.user.created_at
        };

        setUser(userData);
        setProgrammeData(programme);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Calculs dérivés
  const skills = user ? createSkills(user.progress) : createSkills();
  const averageProgress = calculateAverageProgress(programmeData, skills);
  const levels = createLevels(averageProgress, programmeData, renaissanceStats);
  const progressInfo = getProgressMessage(averageProgress);
  
  // ✅ AJOUT: Logique pour déterminer le texte du bouton principal
  const getMainActionButton = () => {
    const personalisationProgress = averageProgress >= 20 ? 100 : (averageProgress / 20) * 100;
    const programmeProgress = programmeData ? programmeData.overallProgress : 0;
    const renaissanceProgress = renaissanceStats ? renaissanceStats.totalProgress : 0;

    // Vérifier où on en est dans le parcours
    if (personalisationProgress < 100) {
      return {
        title: "Débute ta personnalisation",
        subtitle: `${Math.round(personalisationProgress)}% complété`,
        route: '/personalisation'
      };
    } else if (programmeProgress < 100) {
      return {
        title: "Continue ton programme", 
        subtitle: `${programmeProgress}% complété`,
        route: '/programme'
      };
    } else if (renaissanceProgress < 100) {
      return {
        title: "Continue ta renaissance",
        subtitle: `${renaissanceProgress}% complété`,
        route: '/renaissance'
      };
    } else {
      return {
        title: "Parcours terminé !",
        subtitle: "Félicitations pour votre réussite",
        route: '/dashboard'
      };
    }
  };

  const mainAction = getMainActionButton();
  
  const actionCards: ActionCard[] = [
    {
      title: mainAction.title,
      subtitle: mainAction.subtitle,
      icon: BookOpen,
      color: "bg-teal-500 hover:bg-teal-600",
      onClick: () => handleNavigate(mainAction.route)
    },
    {
      title: "Analyser mes progrès",
      subtitle: "Voir l'évolution détaillée",
      icon: BarChart3,
      color: "bg-purple-500 hover:bg-purple-600",
      onClick: () => alert("Fonctionnalité bientôt disponible !")
    },
    {
      title: "Définir objectif",
      subtitle: "Planifier la prochaine étape",
      icon: Target,
      color: "bg-yellow-500 hover:bg-yellow-600",
      onClick: () => alert("Fonctionnalité bientôt disponible !")
    }
  ];

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 p-4">
      <Header 
        user={user} 
        programmeData={programmeData} 
        onNavigate={handleNavigate} 
        onLogout={handleLogout} 
      />

      {/* Actions rapides */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Actions du jour</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {actionCards.map((action) => (
              <ActionCardComponent key={action.title} action={action} />
            ))}
          </div>
        </div>
      </div>

      {/* Niveaux de progression et Compétences - Côte à côte */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Niveaux de progression - Colonne gauche */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Ton Parcours</h2>
            <div className="space-y-6">
              {levels.map((level) => (
                <LevelCard key={level.name} level={level} onLevelClick={handleLevelClick} />
              ))}
            </div>
          </div>

          {/* Compétences et progression - Colonne droite */}
          <ProgressDisplay 
            user={user} 
            averageProgress={averageProgress} 
            progressInfo={progressInfo} 
            programmeData={programmeData} 
          />
        </div>
      </div>

      {/* Debug info */}
      {programmeData && (
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-100 rounded-2xl p-6 text-center">
            <h3 className="text-lg font-bold text-gray-700 mb-4">📊 Données synchronisées</h3>
            <p className="text-sm text-gray-600">
              Parcours chargé depuis la base de données • Dernière mise à jour : {programmeData.lastUpdated.toLocaleString('fr-FR')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}