'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Eye, EyeOff, AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [emailSent, setEmailSent] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 6) errors.push('Au moins 6 caractères');
    if (!/[A-Z]/.test(password)) errors.push('Une majuscule');
    if (!/[0-9]/.test(password)) errors.push('Un chiffre');
    return errors;
  };

  const handleValider = async () => {
    // Validation des champs
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      setError(`Mot de passe faible. Manque : ${passwordErrors.join(', ')}`);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔄 Début création compte...');
      
      // Inscription avec Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.email.split('@')[0], // Nom par défaut basé sur l'email
          }
        }
      });

      // LOG DÉTAILLÉ DE LA RÉPONSE
      console.log('📊 Réponse Supabase complète:', { data, error: authError });

      // VÉRIFICATION 1: Erreur
      if (authError) {
        console.error('❌ Erreur Supabase:', authError);
        
        // Messages d'erreur personnalisés en français
        switch (authError.message) {
          case 'User already registered':
            setError('Un compte existe déjà avec cette adresse email');
            break;
          case 'Password should be at least 6 characters':
            setError('Le mot de passe doit contenir au moins 6 caractères');
            break;
          case 'Signup requires a valid password':
            setError('Mot de passe invalide');
            break;
          case 'Invalid email':
            setError('Adresse email invalide');
            break;
          default:
            setError(`Erreur: ${authError.message}`);
        }
        return;
      }

      // VÉRIFICATION 2: Utilisateur créé
      if (!data.user) {
        console.error('❌ Pas d\'utilisateur dans la réponse');
        setError('Erreur: Utilisateur non créé');
        return;
      }

      // SUCCÈS - L'utilisateur a été créé
      console.log('✅ SUCCÈS! Utilisateur créé:', data.user.id);
      
      // VÉRIFICATION 3: Type de confirmation
      if (data.session) {
        // Cas 1: Connexion automatique (pas de confirmation email requise)
        console.log('🎉 Connexion automatique - pas de confirmation requise');
        setSuccess('✅ Compte créé avec succès ! Connexion automatique...');
        
        // Sauvegarder les infos utilisateur
        const userInfo = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
          created_at: data.user.created_at,
          email_confirmed: !!data.user.email_confirmed_at,
          progress: {
            level: 25, // Nouvel utilisateur commence à 25%
            skills: {
              confiance: 20,
              discipline: 15,
              action: 30
            }
          }
        };
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(userInfo));
        }
        
        // Redirection immédiate
        setTimeout(() => {
          router.push('/personalisation');
        }, 1500);
        
      } else {
        // Cas 2: Confirmation email requise
        console.log('📧 Confirmation email requise');
        setEmailSent(true);
        setSuccess('✅ Compte créé ! Un email de confirmation a été envoyé.');
        
        // Sauvegarder temporairement l'ID utilisateur (non confirmé)
        if (typeof window !== 'undefined') {
          localStorage.setItem('pendingUserId', data.user.id);
        }
      }

      // AFFICHAGE DES DÉTAILS POUR DEBUG
      console.log('📋 Détails utilisateur:');
      console.log('- ID:', data.user.id);
      console.log('- Email:', data.user.email);
      console.log('- Créé le:', data.user.created_at);
      console.log('- Email confirmé:', data.user.email_confirmed_at ? 'OUI' : 'NON');
      console.log('- Session créée:', data.session ? 'OUI' : 'NON');

    } catch (err) {
      console.error('💥 Exception:', err);
      if (err instanceof Error) {
        setError(`Exception: ${err.message}`);
      } else {
        setError('Une erreur inconnue est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetour = () => {
    router.back();
  };

  const handleResendEmail = async () => {
    if (!formData.email) {
      setError('Veuillez saisir votre email');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
      });

      if (error) {
        setError(`Erreur lors du renvoi: ${error.message}`);
      } else {
        setSuccess('Email de confirmation renvoyé !');
      }
    } catch (err) {
      setError('Erreur lors du renvoi de l\'email');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = validatePassword(formData.password);
  const isPasswordValid = passwordStrength.length === 0 && formData.password.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Créer un compte</h1>
          <p className="text-gray-600">Rejoins la communauté APPREND+</p>
        </div>

        {/* Icône */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            {emailSent ? <Mail size={32} className="text-white" /> : <User size={32} className="text-white" />}
          </div>
        </div>

        {/* Message de succès */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center space-x-2 text-green-700">
            <CheckCircle size={16} />
            <span className="text-sm">{success}</span>
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-2 text-red-700">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Message email envoyé */}
        {emailSent && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
            <div className="flex items-center space-x-2 text-blue-700 mb-2">
              <Mail size={16} />
              <span className="text-sm font-medium">Email de confirmation envoyé</span>
            </div>
            <p className="text-xs text-blue-600 mb-3">
              Vérifiez votre boîte de réception et cliquez sur le lien de confirmation.
            </p>
            <button 
              onClick={handleResendEmail}
              disabled={loading}
              className="text-xs text-blue-500 hover:text-blue-600 underline disabled:opacity-50"
            >
              Renvoyer l'email
            </button>
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
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="ton@email.com"
              disabled={loading || emailSent}
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
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                placeholder="••••••••"
                disabled={loading || emailSent}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {/* Indicateur de force du mot de passe */}
            {formData.password && (
              <div className="flex items-center space-x-2 text-sm">
                {isPasswordValid ? (
                  <CheckCircle size={16} className="text-green-500" />
                ) : (
                  <AlertCircle size={16} className="text-orange-500" />
                )}
                <span className={isPasswordValid ? 'text-green-600' : 'text-orange-600'}>
                  {isPasswordValid ? 'Mot de passe fort' : `Manque : ${passwordStrength.join(', ')}`}
                </span>
              </div>
            )}
          </div>

          {/* Confirmation mot de passe */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Confirmer le mot de passe *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                placeholder="••••••••"
                disabled={loading || emailSent}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formData.password && formData.confirmPassword && (
              <div className="flex items-center space-x-2 text-sm">
                {formData.password === formData.confirmPassword ? (
                  <>
                    <CheckCircle size={16} className="text-green-500" />
                    <span className="text-green-600">Les mots de passe correspondent</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} className="text-red-500" />
                    <span className="text-red-600">Les mots de passe ne correspondent pas</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Bouton de validation */}
          {!emailSent && (
            <button
              onClick={handleValider}
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
                  <span>Création du compte...</span>
                </div>
              ) : (
                'Valider'
              )}
            </button>
          )}
        </div>

        {/* Conditions d'utilisation */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            En créant un compte, tu acceptes nos{' '}
            <button className="text-blue-500 hover:text-blue-600 underline">
              conditions d'utilisation
            </button>
            {' '}et notre{' '}
            <button className="text-blue-500 hover:text-blue-600 underline">
              politique de confidentialité
            </button>
          </p>
        </div>

        {/* Connexion existante */}
        <div className="text-center mt-6 border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600 mb-2">Déjà un compte ?</p>
          <button 
            onClick={() => router.push('/auth/login')}
            className="text-teal-500 hover:text-teal-600 font-medium"
          >
            Se connecter
          </button>
        </div>

        {/* Retour */}
        <div className="text-center mt-8">
          <button 
            onClick={handleRetour}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 text-sm disabled:cursor-not-allowed"
          >
            ← Retour aux options
          </button>
        </div>
      </div>
    </div>
  );
}