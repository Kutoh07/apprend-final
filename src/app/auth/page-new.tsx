'use client';
import { useRouter } from 'next/navigation';
import { Mail, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User } from '@supabase/supabase-js';
import { ModernButton, ActionButton } from '@/components/ui/ModernButton';
import { ModernCard, CardHeader, CardContent } from '@/components/ui/ModernCard';

type AuthMode = 'choice' | 'login' | 'register';

export default function AuthPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<AuthMode>('choice');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });

  useEffect(() => {
    // Vérifier les erreurs dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlError = urlParams.get('error');
    const description = urlParams.get('description');
    
    if (urlError) {
      setError(`Erreur d'authentification: ${urlError}${description ? ` - ${description}` : ''}`);
    }

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        router.push('/dashboard');
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (session?.user) {
          setUser(session.user);
          router.push('/dashboard');
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    
    try {
      console.log('Tentative connexion Google...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error('Erreur Google OAuth:', error);
        setError(`Erreur Google: ${error.message}`);
      } else {
        console.log('Redirection vers Google initiée:', data);
      }
    } catch (err) {
      console.error('Exception Google Auth:', err);
      setError('Erreur inattendue lors de la connexion Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (isLogin: boolean) => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs requis.');
      setLoading(false);
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          setError(error.message);
        } else if (data.user) {
          setSuccess('Connexion réussie ! Redirection...');
          setTimeout(() => router.push('/dashboard'), 1000);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name
            }
          }
        });

        if (error) {
          setError(error.message);
        } else {
          setSuccess('Compte créé ! Vérifiez votre email pour confirmer votre inscription.');
        }
      }
    } catch (err) {
      setError('Une erreur inattendue s\'est produite.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const renderChoiceView = () => (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      {/* Fond décoratif */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-secondary-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative w-full max-w-md">
        <ModernCard variant="glass" className="animate-scale-in">
          <div className="text-center space-y-8">
            {/* Logo et titre */}
            <div className="space-y-4">
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <Image
                  src="/images/Logo_Apprend.png"
                  alt="Apprend+ Logo"
                  width={96}
                  height={96}
                  className="w-full h-full object-contain hover-lift"
                  priority
                />
              </div>
              
              <h1 className="text-3xl font-bold text-gradient-primary">
                APPREND<span className="text-2xl">+</span>
              </h1>
              
              <p className="text-gray-600 text-lg">
                Rejoins-nous pour transformer ta vie
              </p>
            </div>

            {/* Messages d'erreur/succès */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-error-50 border border-error-200 rounded-xl text-error-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2 p-3 bg-success-50 border border-success-200 rounded-xl text-success-700">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{success}</span>
              </div>
            )}

            {/* Boutons d'authentification */}
            <div className="space-y-4">
              <ModernButton
                variant="secondary"
                size="lg"
                fullWidth
                onClick={handleGoogleAuth}
                isLoading={loading}
                loadingText="Connexion Google..."
                leftIcon={
                  <Image
                    src="/images/icons/google.svg"
                    alt="Google"
                    width={20}
                    height={20}
                  />
                }
              >
                Continuer avec Google
              </ModernButton>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">ou</span>
                </div>
              </div>

              <ModernButton
                variant="outline"
                size="lg"
                fullWidth
                onClick={() => setMode('login')}
                leftIcon={<Mail className="w-5 h-5" />}
              >
                Connexion avec email
              </ModernButton>

              <ModernButton
                variant="ghost"
                size="lg"
                fullWidth
                onClick={() => setMode('register')}
              >
                Créer un compte
              </ModernButton>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500">
              <p>
                En continuant, tu acceptes nos{' '}
                <button className="text-primary-600 hover:text-primary-700 underline">
                  conditions d'utilisation
                </button>
                {' '}et notre{' '}
                <button className="text-primary-600 hover:text-primary-700 underline">
                  politique de confidentialité
                </button>
              </p>
            </div>
          </div>
        </ModernCard>
      </div>
    </div>
  );

  const renderAuthForm = (isLogin: boolean) => (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      {/* Fond décoratif */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-secondary-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative w-full max-w-md">
        <ModernCard variant="glass" className="animate-scale-in">
          <CardHeader
            title={isLogin ? 'Bon retour !' : 'Créer ton compte'}
            subtitle={isLogin ? 'Connecte-toi pour continuer' : 'Rejoins la communauté Apprend+'}
          />

          <CardContent spacing="lg">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEmailAuth(isLogin);
              }}
              className="space-y-6"
            >
              {/* Nom (uniquement pour l'inscription) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    className="input-base"
                    placeholder="Ton nom complet"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required={!isLogin}
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email
                </label>
                <input
                  type="email"
                  className="input-base"
                  placeholder="ton@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-base pr-12"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirmation mot de passe (uniquement pour l'inscription) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-base"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required={!isLogin}
                  />
                </div>
              )}

              {/* Messages d'erreur/succès */}
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-error-50 border border-error-200 rounded-xl text-error-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center space-x-2 p-3 bg-success-50 border border-success-200 rounded-xl text-success-700">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{success}</span>
                </div>
              )}

              {/* Bouton de soumission */}
              <ActionButton
                type="submit"
                size="lg"
                fullWidth
                isLoading={loading}
                loadingText={isLogin ? "Connexion..." : "Création du compte..."}
              >
                {isLogin ? 'Se connecter' : 'Créer mon compte'}
              </ActionButton>

              {/* Lien vers l'autre mode */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode(isLogin ? 'register' : 'login')}
                  className="text-sm text-primary-600 hover:text-primary-700 underline"
                >
                  {isLogin 
                    ? "Pas encore de compte ? Créer un compte" 
                    : "Déjà un compte ? Se connecter"
                  }
                </button>
              </div>

              {/* Retour au choix */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('choice')}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Retour aux options de connexion
                </button>
              </div>
            </form>
          </CardContent>
        </ModernCard>
      </div>
    </div>
  );

  // Rendu conditionnel basé sur le mode
  switch (mode) {
    case 'login':
      return renderAuthForm(true);
    case 'register':
      return renderAuthForm(false);
    default:
      return renderChoiceView();
  }
}
