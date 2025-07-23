// src/app/auth/callback/route.ts

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('Callback reçu:', { code: !!code, error, error_description })

  // Si erreur OAuth explicite
  if (error) {
    console.error('Erreur OAuth:', error, error_description)
    return NextResponse.redirect(`${origin}/auth?error=${error}&description=${encodeURIComponent(error_description || '')}`)
  }

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    try {
      const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError) {
        console.error('Erreur échange de code:', sessionError)
        return NextResponse.redirect(`${origin}/auth?error=session-exchange-failed&description=${encodeURIComponent(sessionError.message)}`)
      }

      if (data?.session) {
        console.log('Session créée avec succès pour:', data.session.user.email)
        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (err) {
      console.error('Erreur callback:', err)
      return NextResponse.redirect(`${origin}/auth?error=callback-exception`)
    }
  }

  // Aucun code reçu
  console.error('Aucun code reçu dans le callback')
  return NextResponse.redirect(`${origin}/auth?error=no-code-received`)
}