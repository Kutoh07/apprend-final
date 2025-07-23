// Vérification des variables d'environnement Supabase
// Ajoutez ceci temporairement dans votre page auth pour debug

console.log('=== DEBUG SUPABASE CONFIG ===');
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...');
console.log('SUPABASE_KEY présente:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log('Window origin:', typeof window !== 'undefined' ? window.location.origin : 'N/A');

// Testez aussi la connection Supabase
import { supabase } from '../../lib/supabase';

const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('Test Supabase - Session:', !!data.session, error);
  } catch (err) {
    console.error('Test Supabase - Erreur:', err);
  }
};

// Appelez cette fonction dans useEffect
