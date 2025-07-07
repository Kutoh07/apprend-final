'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Target, TrendingUp, Award, Smile, Home, LogOut, User, Calendar, BookOpen, BarChart3, Settings } from 'lucide-react';
import { UserProfileService } from '../../lib/userProfileService';
import { programmeSupabaseService } from '../../lib/programmeSupabaseService';
import { ProgrammeData } from '../../lib/types/programme';
import { supabase } from '../../lib/supabase';

interface UserProgress {
  level: number;
  skills: {
    confiance: number;
    discipline: number;
    action: number;
  };
}

interface User {
  email: string;
  name: string;
  progress: UserProgress;
  createdAt?: string;
}

interface Level {
  name: string;
  color: string;
  icon: any;
  progress: number;
  description: string;
  isClickable?: boolean;
}

interface Skill {
  name: string;
  value: number;
  color: string;
  description: string;
  icon: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [programmeData, setProgrammeData] = useState<ProgrammeData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Vérification de l'authentification et chargement des données
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Vérifier l'authentification Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          router.push('/auth');
          return;
        }

        // Récupérer le profil utilisateur
        const { data: profile } = await UserProfileService.getUserProfile();
        
        // Récupérer les données du programme
        const programme = await programmeSupabaseService.getProgramme(session.user.id);
        
        // Construire l'objet utilisateur
        const userData: User = {
          email: session.user.email || '',
          name: profile?.name || session.user.email?.split('@')[0] || 'Utilisateur',
          progress: {
            level: programme?.overallProgress || 0,
            skills: {
              confiance: 85,  // Valeurs par défaut
              discipline: 70,
              action: 95
            }
          },
          createdAt: session.user.created_at
        };

        setUser(userData);
        setProgrammeData(programme);
        
        // Sauvegarder aussi localement pour compatibilité
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

  // Fonction pour gérer les clics sur les niveaux
  const handleLevelClick = (level: Level) => {
    if (level.name === "PERSONNALISÉ" || level.name === "PERSONALISE") {
      router.push('/personalisation');
    } else if (level.name === "PROGRAMME") {
      router.push('/programme');
    } else {
      alert(`${level.name} : Cette fonctionnalité sera bientôt disponible !`);
    }
  };

  const skills: Skill[] = user?.progress?.skills ? [
    { 
      name: "CONFIANCE", 
      value: user.progress.skills.confiance, 
      color: "bg-yellow-400",
      description: "Croire en ses capacités",
      icon: "💪"
    },
    { 
      name: "DISCIPLINE", 
      value: user.progress.skills.discipline, 
      color: "bg-red-400",
      description: "Constance dans l'action",
      icon: "🎯"
    },
    { 
      name: "ACTION", 
      value: user.progress.skills.action, 
      color: "bg-purple-400",
      description: "Passage à l'acte",
      icon: "🚀"
    }
  ] : [
    { name: "CONFIANCE", value: 85, color: "bg-yellow-400", description: "Croire en ses capacités", icon: "💪" },
    { name: "DISCIPLINE", value: 70, color: "bg-red-400", description: "Constance dans l'action", icon: "🎯" },
    { name: "ACTION", value: 95, color: "bg-purple-400", description: "Passage à l'acte", icon: "🚀" }
  ];

  // Utiliser la progression du programme réel si disponible, sinon la moyenne des compétences
  const averageProgress = programmeData?.overallProgress || Math.round((skills[0].value + skills[1].value + skills[2].value) / 3);

  const levels: Level[] = [
    {
      name: "PERSONNALISÉ",
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
      progress: averageProgress >= 100 ? 100 : Math.max(0, (averageProgress - 60) / 40) * 100,
      description: "Transformation profonde",
      isClickable: false
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

  // Fonction avec 4 niveaux basée sur la progression réelle du programme
  const getProgressMessage = () => {
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    router.push('/');
  };

  const progressInfo = getProgressMessage();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de ton espace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 p-4">
      {/* Header avec navigation */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-teal-600 mb-2">
                APPREND<span className="text-xl">+</span>
              </h1>
              <p className="text-gray-600">
                Bienvenue, <span className="font-semibold">{user.name}</span> !
              </p>
              {user.createdAt && (
                <p className="text-sm text-gray-500">
                  Membre depuis le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </p>
              )}
              {programmeData && (
                <p className="text-sm text-teal-600 font-medium">
                  Programme : {programmeData.subParts.filter(sp => sp.completed).length}/8 parties complétées
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => router.push('/')}
                className="p-2 text-teal-600 hover:bg-teal-100 rounded-lg transition-colors"
                title="Accueil"
              >
                <Home size={24} />
              </button>
              <button 
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Paramètres"
              >
                <Settings size={24} />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                title="Déconnexion"
              >
                <LogOut size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Niveaux de progression */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Ton Parcours</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {levels.map((level, index) => {
              const IconComponent = level.icon;
              return (
                <div key={level.name} className="text-center group">
                  <div 
                    className={`w-20 h-20 mx-auto mb-4 bg-gradient-to-br ${level.color} rounded-2xl flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-105 group-hover:shadow-xl ${
                      level.isClickable ? 'cursor-pointer hover:ring-4 hover:ring-pink-300 hover:ring-opacity-50' : ''
                    }`}
                    onClick={() => level.isClickable && handleLevelClick(level)}
                  >
                    <IconComponent size={28} className="text-white" />
                  </div>
                  <h3 
                    className={`font-bold text-gray-800 text-sm mb-2 ${
                      level.isClickable ? 'cursor-pointer hover:text-pink-600' : ''
                    }`}
                    onClick={() => level.isClickable && handleLevelClick(level)}
                  >
                    {level.name}
                  </h3>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className={`bg-gradient-to-r ${level.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${level.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{Math.round(level.progress)}%</p>
                  <p className="text-xs text-gray-400 hidden group-hover:block transition-all duration-300">
                    {level.description}
                  </p>
                  {level.isClickable && (
                    <p className="text-xs text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                      Cliquer pour commencer
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section des compétences ET Message de progression */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Section des compétences (gauche) */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Tes Compétences</h2>
            
            <div className="space-y-8">
              {skills.map((skill, index) => (
                <div key={skill.name} className="group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{skill.icon}</span>
                      <div className="text-sm font-bold text-gray-700">
                        {skill.name}
                      </div>
                    </div>
                    <span className="text-lg font-bold text-gray-600">{skill.value}%</span>
                  </div>
                  
                  {/* Double barre : objectif + progression */}
                  <div className="relative">
                    {/* Barre objectif (100%) avec transparence */}
                    <div className="w-full bg-gray-200 rounded-full h-8 mb-2">
                      <div 
                        className={`${skill.color} opacity-30 h-8 rounded-full w-full flex items-center justify-center`}
                      >
                        <span className="text-white text-xs font-bold opacity-70">Objectif 100%</span>
                      </div>
                    </div>
                    
                    {/* Barre progression actuelle */}
                    <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                      <div 
                        className={`${skill.color} h-8 rounded-full transition-all duration-1000 flex items-center justify-end pr-3 relative`}
                        style={{ width: `${skill.value}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        <span className="text-white text-sm font-bold relative z-10">{skill.value}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message de progression (droite) */}
          <div className="flex items-center">
            <div className={`rounded-3xl shadow-lg p-8 text-center border-2 ${progressInfo.bgColor} w-full`}>
              <div className="mb-6">
                <span className="text-6xl">{progressInfo.emoji}</span>
              </div>
              
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Évolution de <span className="underline">{user.name}</span>
                </h2>
                
                {/* Pourcentage basé sur la progression réelle du programme */}
                <div className={`text-8xl font-bold mb-4 ${
                  averageProgress >= 100 
                    ? 'text-yellow-500' 
                    : 'text-gray-600'
                }`}>
                  {averageProgress}%
                </div>
                
                <div className={`inline-block px-6 py-3 rounded-full text-lg font-bold mb-6 ${
                  averageProgress >= 100 
                    ? 'bg-yellow-400 text-yellow-900' 
                    : 'bg-teal-100 text-teal-800'
                }`}>
                  {progressInfo.range}
                </div>
              </div>
              
              <p className={`${progressInfo.textColor} text-xl leading-relaxed font-medium`}>
                {progressInfo.message}
              </p>
              
              {/* Statistiques du programme si disponible */}
              {programmeData && (
                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/50 rounded-lg p-3">
                    <p className="font-bold text-gray-700">
                      {programmeData.subParts.reduce((acc, sp) => acc + sp.fields.length, 0)}
                    </p>
                    <p className="text-gray-600">Entrées créées</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3">
                    <p className="font-bold text-gray-700">
                      {programmeData.subParts.filter(sp => sp.completed).length}/8
                    </p>
                    <p className="text-gray-600">Parties complétées</p>
                  </div>
                </div>
              )}
              
              {averageProgress >= 100 && (
                <div className="mt-6 flex justify-center space-x-4">
                  <div className="text-6xl animate-bounce">😊</div>
                  <div className="text-6xl animate-bounce" style={{animationDelay: '0.1s'}}>😄</div>
                  <div className="text-6xl animate-bounce" style={{animationDelay: '0.2s'}}>🎉</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Actions du jour</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => router.push('/programme')}
              className="bg-teal-500 hover:bg-teal-600 text-white p-6 rounded-xl transition-all duration-200 transform hover:scale-105 group"
            >
              <BookOpen size={32} className="mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="font-semibold text-lg">Continuer le programme</div>
              <div className="text-sm opacity-90 mt-1">
                {programmeData ? `${programmeData.overallProgress}% complété` : 'Commencer le parcours'}
              </div>
            </button>
            
            <button className="bg-purple-500 hover:bg-purple-600 text-white p-6 rounded-xl transition-all duration-200 transform hover:scale-105 group">
              <BarChart3 size={32} className="mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="font-semibold text-lg">Analyser mes progrès</div>
              <div className="text-sm opacity-90 mt-1">Voir l'évolution détaillée</div>
            </button>
            
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white p-6 rounded-xl transition-all duration-200 transform hover:scale-105 group">
              <Target size={32} className="mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="font-semibold text-lg">Définir objectif</div>
              <div className="text-sm opacity-90 mt-1">Planifier la prochaine étape</div>
            </button>
          </div>
        </div>
      </div>

      {/* Informations de debug pour développement */}
      {programmeData && (
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-100 rounded-2xl p-6 text-center">
            <h3 className="text-lg font-bold text-gray-700 mb-4">📊 Données synchronisées avec Supabase</h3>
            <p className="text-sm text-gray-600">
              Programme chargé depuis la base de données • Dernière mise à jour : {programmeData.lastUpdated.toLocaleString('fr-FR')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}