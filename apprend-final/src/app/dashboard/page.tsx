'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Target, TrendingUp, Award, Smile, Home, LogOut, User, Calendar, BookOpen, BarChart3, Settings } from 'lucide-react';
import { UserProfileService } from '../../lib/userProfileService';

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
  const [loading, setLoading] = useState<boolean>(true);

  // Vérification de l'authentification
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData: User = JSON.parse(storedUser);
          
          // Récupérer le profil depuis Supabase
          const { data: profile } = await UserProfileService.getUserProfile();
          if (profile) {
            // Fusionner les données
            userData.name = profile.name;
            // Autres données...
          }
          
          setUser(userData);
        } else {
          router.push('/auth');
          return;
        }
      }
      setLoading(false);
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

  // Calculer la moyenne des 3 axes (CECI SERA MAINTENANT LA PROGRESSION PRINCIPALE)
  const averageProgress = Math.round((skills[0].value + skills[1].value + skills[2].value) / 3);

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
      progress: averageProgress >= 60 ? 100 : Math.max(0, (averageProgress - 20) / 40) * 100,
      description: "Structuration de ton parcours",
      isClickable: false
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

  // Fonction avec 4 niveaux basée sur la MOYENNE des compétences
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

  const handleLogout = () => {
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
                Bienvenue, <span className="font-semibold">{user.name || user.email}</span> !
              </p>
              {user.createdAt && (
                <p className="text-sm text-gray-500">
                  Membre depuis le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
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

      {/* Niveaux de progression avec navigation pour PERSONNALISÉ */}
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

      {/* Section des compétences ET Message de progression sur la même ligne */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Section des compétences (gauche) - SANS la moyenne */}
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

          {/* Message de progression (droite) - AVEC la moyenne calculée */}
          <div className="flex items-center">
            <div className={`rounded-3xl shadow-lg p-8 text-center border-2 ${progressInfo.bgColor} w-full`}>
              <div className="mb-6">
                <span className="text-6xl">{progressInfo.emoji}</span>
              </div>
              
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Évolution de <span className="underline">{user.name || 'Prénom Nom'}</span>
                </h2>
                
                {/* Pourcentage imposant - MAINTENANT BASÉ SUR LA MOYENNE */}
                <div className={`text-8xl font-bold mb-4 ${
                  averageProgress >= 100 
                    ? 'text-yellow-500' // Couleur gold pour 100%
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
            <button className="bg-teal-500 hover:bg-teal-600 text-white p-6 rounded-xl transition-all duration-200 transform hover:scale-105 group">
              <BookOpen size={32} className="mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="font-semibold text-lg">Nouvelle réflexion</div>
              <div className="text-sm opacity-90 mt-1">Ajouter une entrée de journal</div>
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

      {/* Simulateur de progression pour test - MAINTENANT BASÉ SUR LES COMPÉTENCES */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-100 rounded-2xl p-6 text-center">
          <h3 className="text-lg font-bold text-gray-700 mb-4">🧪 Moyenne actuelle des compétences: {averageProgress}%</h3>
          <p className="text-sm text-gray-600">
            La progression afichée est calculée automatiquement à partir de la moyenne de tes 3 compétences: 
            Confiance ({skills[0].value}%) + Discipline ({skills[1].value}%) + Action ({skills[2].value}%) = {averageProgress}%
          </p>
        </div>
      </div>
    </div>
  );
}