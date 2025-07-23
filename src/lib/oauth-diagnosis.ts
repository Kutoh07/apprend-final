import { supabase } from '../lib/supabase';

/**
 * Script de diagnostic pour l'authentification Google OAuth
 * À utiliser temporairement pour identifier les problèmes
 */

export const diagnoseProblem = {
  // 1. Vérifier la configuration Supabase
  checkSupabaseConfig() {
    console.log('\n=== DIAGNOSTIC SUPABASE ===');
    console.log('URL Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50) + '...');
    console.log('Clé publique présente:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    console.log('URL actuelle:', typeof window !== 'undefined' ? window.location.href : 'Server-side');
    console.log('Origin:', typeof window !== 'undefined' ? window.location.origin : 'Server-side');
  },

  // 2. Tester la connexion Supabase
  async testConnection() {
    console.log('\n=== TEST CONNEXION ===');
    try {
      const { data, error } = await supabase.auth.getSession();
      console.log('Session actuelle:', data.session ? 'Connecté' : 'Non connecté');
      if (error) console.error('Erreur session:', error);
      
      // Test ping
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      console.log('Test base de données:', testError ? 'Échec' : 'Succès');
      if (testError) console.error('Erreur DB:', testError);
      
    } catch (err) {
      console.error('Erreur test connexion:', err);
    }
  },

  // 3. Tester OAuth Google spécifiquement
  async testGoogleOAuth() {
    console.log('\n=== TEST GOOGLE OAUTH ===');
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      
      console.log('Résultat OAuth:', { data, error });
      return { data, error };
    } catch (err) {
      console.error('Erreur OAuth:', err);
      return { error: err };
    }
  },

  // 4. Analyser l'URL de callback
  analyzeCallback() {
    if (typeof window === 'undefined') return;
    
    console.log('\n=== ANALYSE CALLBACK ===');
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const hashParams = new URLSearchParams(url.hash.substring(1));
    
    console.log('URL complète:', window.location.href);
    console.log('Query params:');
    for (const [key, value] of params.entries()) {
      console.log(`  ${key}:`, value.substring(0, 50) + (value.length > 50 ? '...' : ''));
    }
    
    console.log('Hash params:');
    for (const [key, value] of hashParams.entries()) {
      console.log(`  ${key}:`, value.substring(0, 50) + (value.length > 50 ? '...' : ''));
    }
    
    // Paramètres spécifiques à vérifier
    const hasError = params.has('error') || hashParams.has('error');
    const hasCode = params.has('code') || hashParams.has('access_token');
    
    console.log('État callback:');
    console.log('  Erreur détectée:', hasError);
    console.log('  Code/Token présent:', hasCode);
    
    if (hasError) {
      console.error('Erreur OAuth:', {
        error: params.get('error') || hashParams.get('error'),
        description: params.get('error_description') || hashParams.get('error_description'),
      });
    }
  },

  // 5. Diagnostic complet
  async runFullDiagnosis() {
    console.clear();
    console.log('🔍 DÉBUT DU DIAGNOSTIC OAUTH GOOGLE\n');
    
    this.checkSupabaseConfig();
    await this.testConnection();
    this.analyzeCallback();
    
    console.log('\n✅ DIAGNOSTIC TERMINÉ');
    console.log('Vérifiez les logs ci-dessus pour identifier le problème.\n');
    console.log('Points à vérifier dans Supabase Dashboard:');
    console.log('1. Configuration du provider Google OAuth');
    console.log('2. URLs de redirection autorisées');
    console.log('3. Client ID et Secret configurés');
    console.log(`4. URL de redirection: ${window?.location?.origin}/auth/callback`);
  }
};

// Export pour utilisation temporaire
if (typeof window !== 'undefined') {
  (window as any).diagnoseProblem = diagnoseProblem;
}
