'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface FormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSeConnecter = async () => {
    if (!formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔄 Tentative de connexion avec Supabase...');
      
      // Connexion avec Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        console.error('❌ Erreur Supabase Auth:', authError);
        
        // Messages d'erreur personnalisés en français
        switch (authError.message) {
          case 'Invalid login credentials':
            setError('Email ou mot de passe incorrect');
            break;
          case 'Email not confirmed':
            setError('Veuillez confirmer votre email avant de vous connecter');
            break;
          case 'Too many requests':
            setError('Trop de tentatives. Veuillez réessayer plus tard');
            break;
          default:
            setError(`Erreur de connexion: ${authError.message}`);
        }
        return;
      }

      if (data.user) {
        console.log('✅ Connexion réussie:', data.user);
        
        // Sauvegarder les informations utilisateur
        const userInfo = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
          created_at: data.user.created_at,
          progress: {
            level: 100,
            skills: {
              confiance: 85,
              discipline: 70,
              action: 95
            }
          }
        };
        
        // Stocker aussi localement pour la compatibilité
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(userInfo));
        }

        console.log('🚀 Redirection vers dashboard...');
        router.push('/dashboard');
      }
      
    } catch (err) {
      console.error('💥 Exception lors de la connexion:', err);
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleRetour = () => {
    router.back();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSeConnecter();
    }
  };

  // Fonction pour tester la connexion Supabase
  const testSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      console.log('🔍 Session actuelle:', data);
      if (error) console.error('❌ Erreur session:', error);
    } catch (err) {
      console.error('💥 Erreur test connexion:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Se connecter</h1>
          <p className="text-gray-600">Accède à ton espace personnel</p>
        </div>

        {/* Icône */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <User size={32} className="text-white" />
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-2 text-red-700">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Formulaire */}
        <div className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Adresse email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="ton@email.com"
              disabled={loading}
            />
          </div>

          {/* Mot de passe */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Mot de passe *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Bouton de connexion */}
          <button
            onClick={handleSeConnecter}
            disabled={loading}
            className={`
              w-full py-4 px-8 rounded-2xl text-lg font-semibold transition-all duration-200 shadow-lg
              ${loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-red-500 hover:bg-red-600 transform hover:scale-105'
              } 
              text-white
            `}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Connexion...</span>
              </div>
            ) : (
              'Se connecter'
            )}
          </button>
        </div>

        {/* Options supplémentaires */}
        <div className="text-center mt-6 space-y-4">
          <button 
            onClick={() => {
              // TODO: Implémenter la récupération de mot de passe avec Supabase
              alert('Fonctionnalité à implémenter avec Supabase Auth');
            }}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            Mot de passe oublié ?
          </button>
          
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600 mb-2">Pas encore de compte ?</p>
            <button 
              onClick={() => router.push('/auth/register')}
              className="text-teal-500 hover:text-teal-600 font-medium"
            >
              Créer un compte
            </button>
          </div>
        </div>

        {/* Retour */}
        <div className="text-center mt-8">
          <button 
            onClick={handleRetour}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 text-sm disabled:cursor-not-allowed"
          >
            ◀️ Retour aux options
          </button>
        </div>

        {/* Debug - À supprimer en production */}
        <div className="mt-4 text-center">
          <button 
            onClick={testSupabaseConnection}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            🔍 Test connexion Supabase
          </button>
        </div>

        {/* Demo credentials pour développement */}
        <div className="mt-8 p-4 bg-blue-50 rounded-2xl">
          <p className="text-xs text-blue-600 font-medium mb-2">🔹 Pour tester (créez d'abord un compte) :</p>
          <p className="text-xs text-blue-600">Utilisez un email valide</p>
          <p className="text-xs text-blue-600">Mot de passe : minimum 6 caractères</p>
        </div>
      </div>
    </div>
  );
}