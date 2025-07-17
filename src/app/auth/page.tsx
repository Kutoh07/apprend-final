// src/app/auth/page.tsx

'use client';
import { useRouter } from 'next/navigation';
import { Mail, Smartphone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User } from '@supabase/supabase-js'; // Import du type User

export default function AuthChoicePage() {
  const router = useRouter();
  // Corriger le type : User | null au lieu de null
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
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
          setUser(null); // Réinitialiser à null si pas de session
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const handleGoogleAuth = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      console.error('Erreur Google:', error);
      alert(`Erreur: ${error.message}`);
    } else {
      console.log('Redirection vers Google:', data);
    };
  };

  const handleAppleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) console.error('Erreur Apple:', error);
  };

  const handleMicrosoftAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) console.error('Erreur Microsoft:', error);
  };

  const handleEmailAuth = () => {
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-teal-500 mb-2">
            APPREND<span className="text-2xl">+</span>
          </h1>
          <p className="text-sm text-gray-600 italic mb-6">
            L'excellence mentale ancrée de manière durable.
          </p>
        </div>

        {/* Section illustrative */}
        <div className="flex justify-center items-center mb-8">
          {/* Illustration gauche - Formulaire */}
          <div className="bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl p-6 w-48 h-64 flex flex-col items-center justify-center mr-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-md">
              <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
            
            <div className="space-y-3 w-full">
              <div className="bg-white rounded-lg h-3 w-full flex items-center px-2">
                <div className="w-8 h-1 bg-teal-400 rounded"></div>
                <div className="ml-auto">
                  <Mail size={12} className="text-gray-400" />
                </div>
              </div>
              <div className="bg-white rounded-lg h-3 w-full flex items-center px-2">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  ))}
                </div>
                <div className="ml-auto">
                  <div className="w-3 h-3 border border-gray-400 rounded"></div>
                </div>
              </div>
            </div>
            
            <button className="bg-red-500 text-white text-xs py-2 px-4 rounded-full mt-4 font-medium">
              Se connecter
            </button>
          </div>

          {/* Options de connexion avec vrais logos */}
          <div className="flex flex-col space-y-4 flex-1">
            <button 
              onClick={handleGoogleAuth}
              className="flex items-center justify-center w-full py-4 px-6 border-2 border-gray-300 rounded-2xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 group hover:shadow-md"
            >
              <Image
                src="/images/icons/google.svg"
                alt="Google"
                width={30}
                height={30}
                className="mr-4"
              />
              <span className="text-gray-700 font-medium">Se connecter avec Google</span>
            </button>

            <button 
              onClick={handleAppleAuth}
              className="flex items-center justify-center w-full py-4 px-6 border-2 border-gray-300 rounded-2xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 group hover:shadow-md"
            >
              <Image
                src="/images/icons/apple.svg"
                alt="Apple"
                width={30}
                height={30}
                className="mr-4"
              />
              <span className="text-gray-700 font-medium">Se connecter avec Apple</span>
            </button>

            <button 
              onClick={handleMicrosoftAuth}
              className="flex items-center justify-center w-full py-4 px-6 border-2 border-gray-300 rounded-2xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 group hover:shadow-md"
            >
              <Image
                src="/images/icons/microsoft.svg"
                alt="Microsoft"
                width={30}
                height={30}
                className="mr-4"
              />
              <span className="text-gray-700 font-medium">Se connecter avec Microsoft</span>
            </button>

            <button 
              onClick={handleEmailAuth}
              className="flex items-center justify-center w-full py-4 px-6 border-2 border-gray-300 rounded-2xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 group hover:shadow-md"
            >
              <Mail size={30} className="mr-4 text-gray-600" />
              <span className="text-gray-700 font-medium">Se connecter avec un email</span>
            </button>
          </div>
        </div>

        {/* Note explicative */}
        <div className="mt-8 text-xs text-gray-500 italic text-center">
          Authentification sécurisée avec Supabase
        </div>
      </div>
    </div>
  );
}