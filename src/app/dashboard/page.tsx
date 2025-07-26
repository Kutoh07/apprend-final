'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Target, TrendingUp, Award, BookOpen, Calendar, Users } from 'lucide-react';
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

interface Level {
  id: number;
  name: string;
  icon: string;
  color: string;
  progress: number;
  isUnlocked: boolean;
  isActive: boolean;
  description: string;
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

const createLevels = (averageProgress: number, programmeData: ProgrammeData | null, renaissanceStats?: RenaissanceStats): Level[] => {
  const baseLevel = Math.floor(averageProgress / 20);
  
  return [
    {
      id: 1,
      name: "ACCEPTER",
      icon: "🤝",
      color: "from-green-400 to-emerald-500",
      progress: Math.floor(Math.random() * 100), // Mock data
      isUnlocked: true,
      isActive: baseLevel >= 0,
      description: "Comprendre et accepter la situation actuelle"
    },
    {
      id: 2,
      name: "CARACTÈRE",
      icon: "⚡",
      color: "from-blue-400 to-cyan-500",
      progress: Math.floor(Math.random() * 80),
      isUnlocked: true,
      isActive: baseLevel >= 1,
      description: "Développer sa force intérieure"
    },
    {
      id: 3,
      name: "ÉMOTIONS",
      icon: "❤️",
      color: "from-pink-400 to-rose-500",
      progress: Math.floor(Math.random() * 60),
      isUnlocked: true,
      isActive: baseLevel >= 2,
      description: "Maîtriser ses émotions"
    },
    {
      id: 4,
      name: "PENSÉES",
      icon: "🧠",
      color: "from-purple-400 to-indigo-500",
      progress: Math.floor(Math.random() * 40),
      isUnlocked: true,
      isActive: baseLevel >= 3,
      description: "Transformer ses pensées limitantes"
    },
    {
      id: 5,
      name: "TRAVAIL",
      icon: "💼",
      color: "from-orange-400 to-amber-500",
      progress: Math.floor(Math.random() * 20),
      isUnlocked: true,
      isActive: baseLevel >= 4,
      description: "Optimiser sa vie professionnelle"
    },
    {
      id: 6,
      name: "RENAISSANCE",
      icon: "🦋",
      color: "from-emerald-400 to-teal-500",
      progress: renaissanceStats?.totalProgress || 0,
      isUnlocked: (programmeData?.overallProgress || 0) >= 100,
      isActive: baseLevel >= 5,
      description: "Votre nouvelle vie transformée"
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

  const routeMap: Record<string, string> = {
    'ACCEPTER': '/programme',
    'CARACTÈRE': '/programme/caractere',
    'ÉMOTIONS': '/programme/emotions',
    'PENSÉES': '/programme/pensees',
    'TRAVAIL': '/programme/travail',
    'RENAISSANCE': '/renaissance'
  };

  const loadRenaissanceStats = async (userId: string) => {
    try {
      // Mock data for now
      setRenaissanceStats({
        totalProgress: Math.floor(Math.random() * 100)
      } as RenaissanceStats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques Renaissance:', error);
    }
  };

  const handleLevelClick = (level: Level) => {
    const route = routeMap[level.name];
    if (route) {
      if (level.name === "RENAISSANCE" && programmeData && (programmeData.overallProgress || 0) < 100) {
        alert("Tu dois d'abord terminer tous les modules du programme principal !");
        return;
      }
      router.push(route);
    } else {
      alert(`${level.name} : Cette fonctionnalité sera bientôt disponible !`);
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
  const levels = createLevels(averageProgress, programmeData, renaissanceStats);
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
      <div className="space-y-8">
        {/* Section des statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            value={levels.filter(l => l.progress >= 100).length.toString()}
            change={{ value: 6, label: "modules total" }}
            variant="glass"
          />
        </div>

        {/* Message motivationnel */}
        <ModernCard variant="gradient" className="text-center">
          <CardContent spacing="lg">
            <div className="space-y-4">
              <h3 className={`text-2xl font-bold ${motivationalMessage.color}`}>
                {motivationalMessage.title}
              </h3>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                {motivationalMessage.message}
              </p>
              <ModernProgress 
                value={averageProgress} 
                size="lg" 
                variant="gradient" 
                animated 
                showPercentage 
                className="max-w-md mx-auto"
              />
            </div>
          </CardContent>
        </ModernCard>

        {/* Section des compétences */}
        <ModernCard>
          <CardHeader 
            title="Tes compétences" 
            subtitle="Développement personnel en cours"
          />
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {skills.map((skill) => (
                <div key={skill.name} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{skill.icon}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{skill.name}</h4>
                        <p className="text-sm text-gray-600">{skill.description}</p>
                      </div>
                    </div>
                    <span className="font-bold text-lg text-gray-900">{skill.value}%</span>
                  </div>
                  <ModernProgress 
                    value={skill.value}
                    className="w-full"
                    variant="gradient"
                    animated
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </ModernCard>

        {/* Section des niveaux */}
        <ModernCard>
          <CardHeader 
            title="Ton parcours" 
            subtitle="Clique sur un niveau pour commencer"
          />
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {levels.map((level) => (
                <ModernCard
                  key={level.id}
                  variant={level.isActive ? "elevated" : "bordered"}
                  className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                    level.isUnlocked ? 'hover:shadow-lg' : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => level.isUnlocked && handleLevelClick(level)}
                >
                  <CardContent spacing="md">
                    <div className="text-center space-y-4">
                      <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${level.color} flex items-center justify-center text-2xl`}>
                        {level.icon}
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{level.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{level.description}</p>
                      </div>

                      <div className="space-y-2">
                        <CircularProgress 
                          value={level.progress}
                          size={60}
                          showPercentage
                          variant={level.isActive ? "gradient" : "default"}
                        />
                        
                        {level.isUnlocked ? (
                          <ActionButton size="sm" fullWidth>
                            {level.progress === 0 ? 'Commencer' : 
                             level.progress < 100 ? 'Continuer' : 'Revoir'}
                          </ActionButton>
                        ) : (
                          <ModernButton variant="outline" size="sm" fullWidth disabled>
                            Verrouillé
                          </ModernButton>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </ModernCard>
              ))}
            </div>
          </CardContent>
        </ModernCard>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ModernCard variant="glass">
            <CardContent spacing="lg" className="text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Communauté</h3>
                  <p className="text-gray-600">Rejoins les autres membres</p>
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
                <div className="w-16 h-16 mx-auto bg-secondary-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-secondary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Planning</h3>
                  <p className="text-gray-600">Organise tes sessions</p>
                </div>
                <ModernButton variant="outline" fullWidth>
                  Voir le planning
                </ModernButton>
              </div>
            </CardContent>
          </ModernCard>
        </div>
      </div>
    </ModernLayout>
  );
}
