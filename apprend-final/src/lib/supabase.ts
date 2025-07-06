import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types pour l'authentification
export interface UserProfile {
  id: string
  email: string
  name: string
  avatar_url?: string
  progress?: {
    level: number
    skills: {
      confiance: number
      discipline: number
      action: number
    }
  }
  created_at: string
}