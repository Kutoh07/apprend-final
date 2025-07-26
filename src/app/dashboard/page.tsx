'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Target, TrendingUp, Award, BookOpen, Calendar, Users, User, Sparkles } from 'lucide-react';
import { UserProfileService } from '../../lib/userProfileService';
import { programmeSupabaseService } from '../../lib/programmeSupabaseService';
import { ProgrammeData } from '../../lib/types/programme';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from './components/LoadingSpinner';
import { renaissanceService } from '../../lib/services/renaissanceService';
import type { RenaissanceStats } from '@/lib/types/renaissance';
import { ModernLayout } from '@/components/layout/ModernLayout';
import { ModernCard, CardHeader, CardContent, StatsCard } from '@/components/ui/ModernCard';
import { ActionButton, ModernButton } from '@/components/ui/ModernButton';
import { ModernProgress, CircularProgress, SkillBar } from '@/components/ui/ModernProgress';
import JourneyPath from '@/components/dashboard/JourneyPath';

// Types locaux
interface UserProgress {
  level: number;
  skills: {
    confiance: number;
    discipline: number;
    action: number;
  };
}

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  progress: UserProgress;
}

interface Skill {
  name: string;
  value: number;
  color: string;
  description: string;
  icon: string;
}

interface ProgressMessage {
  title: string;
  message: string;
  color: string;
}

// Configuration des compétences
const skillsConfig: Omit<Skill, 'value'>[] = [
  { 
    name: "CONFIANCE", 
    color: "bg-gradient-to-r from-yellow-400 to-orange-500",
    description: "Croire en ses capacités",
    icon: "💪"
  },
  { 
    name: "DISCIPLINE", 
    color: "bg-gradient-to-r from-red-400 to-pink-500",
    description: "Constance dans l'action",
    icon: "🎯"
  },
  { 
    name: "ACTION", 
    color: "bg-gradient-to-r from-purple-400 to-indigo-500",
    description: "Passage à l'acte",
    icon: "🚀"
  }
];

const defaultSkillValues = { confiance: 85, discipline: 70, action: 95 };

// Fonctions utilitaires
const calculateAverageProgress = (programmeData: ProgrammeData | null, skills: Skill[]): number => {
  return programmeData?.overallProgress || Math.round(skills.reduce((acc, skill) => acc + skill.value, 0) / skills.length);
};

const createSkills = (userProgress?: UserProgress): Skill[] => {
  return skillsConfig.map(config => ({
    ...config,
    value: userProgress?.skills?.[config.name.toLowerCase() as keyof typeof userProgress.skills] || 
           defaultSkillValues[config.name.toLowerCase() as keyof typeof defaultSkillValues] || 0
  }));
};

const createJourneyStages = (programmeData: ProgrammeData | null, renaissanceStats?: RenaissanceStats): any[] => {
  // Modules du programme - utilisation des vraies données
  const programmeModules = programmeData?.subParts?.map(subPart => ({
    id: subPart.slug,
    name: subPart.name,
    completed: subPart.progress === 100,
    progress: subPart.progress
  })) || [];

  // Modules Renaissance - récupération depuis les stats réelles si disponibles
  console.log('🔍 Création des modules Renaissance avec renaissanceStats:', renaissanceStats);
  console.log('🔍 axesData disponible:', (renaissanceStats as any)?.axesData);
  
  const renaissanceModules = (renaissanceStats as any)?.axesData?.map((axe: any) => {
    console.log('🎯 Traitement axe:', axe);
    return {
      id: axe.axe_id,
      name: axe.axe_name,
      completed: axe.overall_progress === 100,
      progress: axe.overall_progress || 0,
      lastAccessed: axe.last_accessed_at
    };
  }) || [
    { id: 'confiance', name: 'Confiance en soi', completed: false, progress: 0 },
    { id: 'discipline', name: 'Discipline', completed: false, progress: 0 },
    { id: 'action', name: 'Passage à l\'action', completed: false, progress: 0 }
  ];

  console.log('🎉 Modules Renaissance finaux:', renaissanceModules);

  const programmeProgress = programmeData?.overallProgress || 0;
  const renaissanceProgress = renaissanceStats?.totalProgress || 0;
  
  return [
    {
      id: 'personalisation',
      name: 'Personalisation',
      description: 'Définition de ton profil et tes objectifs',
      icon: <User className="w-8 h-8 text-white" />,
      status: 'completed' as const,
      progress: 100,
      completedDate: localStorage.getItem('personalisationCompletedAt') || new Date().toLocaleDateString('fr-FR'),
      modules: [
        { id: 'profile', name: 'Profil personnel', completed: true, progress: 100 },
        { id: 'goals', name: 'Objectifs', completed: true, progress: 100 },
        { id: 'preferences', name: 'Préférences', completed: true, progress: 100 }
      ]
    },
    {
      id: 'programme',
      name: 'Programme',
      description: 'Mise en pratique de la méthode ACCEPTER',
      icon: <BookOpen className="w-8 h-8 text-white" />,
      status: programmeProgress === 100 ? 'completed' : programmeProgress > 0 ? 'current' : 'locked' as const,
      progress: programmeProgress,
      completedDate: programmeData?.completedAt ? new Date(programmeData.completedAt).toLocaleDateString('fr-FR') : undefined,
      modules: programmeModules
    },
    {
      id: 'renaissance',
      name: 'Renaissance',
      description: 'Ancrage et transformation continue',
      icon: <Sparkles className="w-8 h-8 text-white" />,
      status: programmeProgress === 100 ? (renaissanceProgress === 100 ? 'completed' : 'current') : 'locked' as const,
      progress: renaissanceProgress,
      completedDate: renaissanceProgress === 100 ? new Date().toLocaleDateString('fr-FR') : undefined,
      modules: renaissanceModules
    }
  ];
};

const getMotivationalMessage = (level: number, progress: number): ProgressMessage => {
  if (progress < 25) {
    return {
      title: "🌱 Prêt(e) à démarrer ?",
      message: "Chaque grand voyage commence par un premier pas. Tu as déjà fait le plus dur en étant ici !",
      color: "text-green-600"
    };
  } else if (progress < 50) {
    return {
      title: "🚀 Excellent départ !",
      message: "Tu progresses bien ! Continue sur cette lancée, tu es sur la bonne voie.",
      color: "text-blue-600"
    };
  } else if (progress < 75) {
    return {
      title: "⭐ Tu es formidable !",
      message: "Quel parcours impressionnant ! Tu as déjà accompli beaucoup, ne lâche rien !",
      color: "text-purple-600"
    };
  } else if (progress < 100) {
    return {
      title: "🔥 Presque au sommet !",
      message: "Tu y es presque ! Ces derniers efforts vont faire toute la différence.",
      color: "text-orange-600"
    };
  } else {
    return {
      title: "🏆 Mission accomplie !",
      message: "Félicitations ! Tu as terminé cette étape avec brio. Time to level up !",
      color: "text-yellow-600"
    };
  }
};

// Composant principal
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [programmeData, setProgrammeData] = useState<ProgrammeData | null>(null);
  const [renaissanceStats, setRenaissanceStats] = useState<RenaissanceStats>();
  const [loading, setLoading] = useState(true);

  const loadRenaissanceStats = async (userId: string) => {
    try {
      console.log('🔄 Chargement des stats Renaissance pour userId:', userId);
      
      // Utiliser le service Renaissance pour cohérence avec la page Renaissance
      const stats = await renaissanceService.getUserStats(userId);
      console.log('📊 Stats Renaissance reçues:', stats);
      
      // Récupérer aussi les détails des axes pour affichage dans les modules
      const { data: axesData, error: axesError } = await supabase
        .from('user_axe_selections')
        .select(`
          axe_id,
          axe_name,
          overall_progress,
          discovery_completed,
          level1_completed,
          level2_completed,
          level3_completed,
          last_accessed_at
        `)
        .eq('user_id', userId);

      console.log('🎯 Axes data récupérés:', axesData);
      if (axesError) console.error('❌ Erreur axes:', axesError);

      // Si pas de données d'axes mais qu'on a une progression > 0, créer des axes mockés
      let finalAxesData = axesData || [];
      if ((!axesData || axesData.length === 0) && stats.totalProgress > 0) {
        console.log('🎭 Création d\'axes mockés basés sur la progression:', stats.totalProgress);
        finalAxesData = [
          {
            axe_id: 'confiance',
            axe_name: 'Confiance en soi',
            overall_progress: Math.min(100, stats.totalProgress + 10),
            discovery_completed: stats.totalProgress > 20,
            level1_completed: stats.totalProgress > 40,
            level2_completed: stats.totalProgress > 60,
            level3_completed: stats.totalProgress > 80,
            last_accessed_at: new Date().toISOString()
          },
          {
            axe_id: 'discipline',
            axe_name: 'Discipline personnelle',
            overall_progress: Math.max(0, stats.totalProgress - 5),
            discovery_completed: stats.totalProgress > 15,
            level1_completed: stats.totalProgress > 35,
            level2_completed: stats.totalProgress > 55,
            level3_completed: stats.totalProgress > 75,
            last_accessed_at: new Date().toISOString()
          },
          {
            axe_id: 'action',
            axe_name: 'Passage à l\'action',
            overall_progress: Math.max(0, stats.totalProgress - 10),
            discovery_completed: stats.totalProgress > 25,
            level1_completed: stats.totalProgress > 45,
            level2_completed: stats.totalProgress > 65,
            level3_completed: stats.totalProgress > 85,
            last_accessed_at: new Date().toISOString()
          }
        ];
      }

      const finalStats = {
        ...stats,
        axesData: finalAxesData
      };
      
      console.log('🎉 Stats finales Renaissance:', finalStats);
      setRenaissanceStats(finalStats as any);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques Renaissance:', error);
      // Mock data en cas d'erreur
      setRenaissanceStats({
        totalProgress: 0,
        totalAxesSelected: 0,
        axesCompleted: 0,
        averageAccuracy: 0,
        totalTimeSpent: 0,
        totalAttempts: 0,
        axesData: []
      } as any);
    }
  };

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          console.log('Aucune session trouvée, redirection vers /auth');
          router.push('/auth');
          return;
        }

        console.log('Session trouvée, chargement des données utilisateur...');
        
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || 'Utilisateur',
          created_at: session.user.created_at || new Date().toISOString(),
          progress: { level: 0, skills: defaultSkillValues }
        };

        const userProfile = await UserProfileService.getUserProfile();
        if (userProfile.data?.name) {
          userData.name = userProfile.data.name;
        }

        const programme = await programmeSupabaseService.getProgramme(session.user.id);
        if (programme) {
          userData.progress.level = Math.floor((programme.overallProgress || 0) / 20);
        }

        await loadRenaissanceStats(session.user.id);

        setUser(userData);
        setProgrammeData(programme);
        
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [router]);

  const skills = user ? createSkills(user.progress) : createSkills();
  const averageProgress = calculateAverageProgress(programmeData, skills);
  const journeyStages = createJourneyStages(programmeData, renaissanceStats);
  const motivationalMessage = getMotivationalMessage(user?.progress.level || 0, averageProgress);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  return (
    <ModernLayout
      title={`Salut ${user.name} 👋`}
      description="Bienvenue sur ton tableau de bord personnel"
    >
      {/* Container principal avec largeur maximale et centrage */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 sm:space-y-8 py-6 sm:py-8">
          {/* Section des statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <StatsCard
              title="Progression globale"
              value={`${averageProgress}%`}
              change={{ value: 12, label: "cette semaine", positive: true }}
              trend="up"
            />
            
            <StatsCard
              title="Niveau actuel"
              value={user.progress.level.toString()}
              change={{ value: 6, label: "sur 6 niveaux" }}
              variant="gradient"
            />
            
            <StatsCard
              title="Modules terminés"
              value={journeyStages.reduce((total, stage) => {
              return total + (stage.modules?.filter((m: any) => m.completed).length || 0);
            }, 0).toString()}
            change={{ value: journeyStages.reduce((total, stage) => total + (stage.modules?.length || 0), 0), label: "modules total" }}
            variant="glass"
          />
        </div>

        {/* Message motivationnel avec jauges améliorées */}
        <ModernCard variant="gradient">
          <CardContent spacing="lg" darkText={true}>
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Message à gauche */}
              <div className="flex-1 space-y-4">
                <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                  {motivationalMessage.title}
                </h3>
                <p className="text-lg text-white/90 drop-shadow-sm">
                  {motivationalMessage.message}
                </p>
              </div>
              
              {/* Jauges améliorées à droite */}
              <div className="flex-shrink-0 w-full lg:w-auto">
                <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-6 lg:gap-4">
                  {/* Jauge circulaire principale avec effets */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative">
                      <CircularProgress
                        value={averageProgress}
                        size={140}
                        strokeWidth={10}
                        showPercentage
                        variant="gradient"
                        animated
                        className="drop-shadow-2xl"
                      />
                      {/* Étoiles d'animation autour */}
                      <div className="absolute -top-2 -right-2 text-yellow-300 text-xl animate-bounce">⭐</div>
                      <div className="absolute -bottom-2 -left-2 text-blue-300 text-lg animate-pulse">✨</div>
                      <div className="absolute top-1/2 -left-4 text-purple-300 text-sm animate-ping">💫</div>
                    </div>
                  </div>
                  
                  {/* Mini jauges des étapes */}
                  <div className="flex flex-row sm:flex-col lg:flex-row gap-3">
                    {journeyStages.map((stage, index) => (
                      <div key={stage.id} className="flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg transform transition-all duration-300 hover:scale-110 ${
                          stage.status === 'completed' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                          stage.status === 'current' ? 'bg-gradient-to-br from-blue-400 to-blue-600 animate-pulse' :
                          'bg-gradient-to-br from-gray-400 to-gray-600'
                        }`}>
                          {stage.status === 'completed' ? '✓' : 
                           stage.status === 'current' ? '⚡' : '🔒'}
                        </div>
                        <div className="mt-1 text-white/80 text-xs font-medium text-center">
                          {stage.progress}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </ModernCard>

        {/* Section des compétences avec jauges visuelles */}
        <ModernCard variant="glass">
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              Tes Compétences Développées
            </h2>
            <p className="text-gray-600">Progression dans les domaines clés de ton développement</p>
          </CardHeader>
          <CardContent spacing="lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {skills.map((skill, index) => (
                <div key={skill.name} className="relative group">
                  {/* Carte de compétence avec effet hover */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    {/* Header de la compétence */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{skill.icon}</div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-sm">{skill.name}</h3>
                          <p className="text-xs text-gray-500">{skill.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-800">{skill.value}%</div>
                      </div>
                    </div>
                    
                    {/* Barre de progression élégante */}
                    <div className="relative">
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${skill.color} transition-all duration-1000 ease-out relative rounded-full`}
                          style={{ width: `${skill.value}%` }}
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
                              skill.value >= threshold ? 'bg-white shadow-sm' : 'bg-gray-300'
                            }`}
                            style={{ marginLeft: `${threshold}%` }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Badge de niveau */}
                    <div className="mt-3 flex justify-between items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        skill.value >= 80 ? 'bg-green-100 text-green-800' :
                        skill.value >= 60 ? 'bg-blue-100 text-blue-800' :
                        skill.value >= 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {skill.value >= 80 ? 'Expert' :
                         skill.value >= 60 ? 'Avancé' :
                         skill.value >= 40 ? 'Intermédiaire' :
                         'Débutant'}
                      </span>
                      
                      {/* Flèche de tendance */}
                      <div className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="w-3 h-3" />
                        <span className="text-xs font-medium">+{Math.floor(Math.random() * 10 + 5)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Effet de particules au hover */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </ModernCard>

        {/* Section du parcours */}
        <div className="w-full">
          <JourneyPath 
            stages={journeyStages} 
            currentStage={journeyStages.find(stage => stage.status === 'current')?.id || 'personalisation'} 
          />
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <ModernCard variant="glass">
            <CardContent spacing="lg" className="text-center">
              <div className="space-y-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Communauté</h3>
                  <p className="text-sm sm:text-base text-gray-600">Rejoins les autres membres</p>
                </div>
                <ModernButton variant="outline" fullWidth>
                  Accéder à la communauté
                </ModernButton>
              </div>
            </CardContent>
          </ModernCard>

          <ModernCard variant="glass">
            <CardContent spacing="lg" className="text-center">
              <div className="space-y-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-secondary-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-secondary-600" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Planning</h3>
                  <p className="text-sm sm:text-base text-gray-600">Organise tes sessions</p>
                </div>
                <ModernButton variant="outline" fullWidth>
                  Voir le planning
                </ModernButton>
              </div>
            </CardContent>
          </ModernCard>
        </div>
        </div>
      </div>
    </ModernLayout>
  );
}
