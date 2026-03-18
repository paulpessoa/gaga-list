// app/api/auth/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/auth
 * Endpoint para autenticação (Magic Link, Login com Senha, Cadastro).
 */
export async function POST(request: Request) {
  try {
    const { email, password, action } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Determina a URL base dinamicamente (para funcionar no AI Studio)
    const appUrl = process.env.APP_URL || request.headers.get('origin') || 'http://localhost:3000';
    const redirectUrl = `${appUrl}/api/auth/confirm`;

    if (action === 'magic_link') {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectUrl },
      });
      if (error) throw error;
      return NextResponse.json({ message: 'Magic link enviado com sucesso! Verifique seu e-mail.' });
    } 
    else if (action === 'password_login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return NextResponse.json({ message: 'Login realizado com sucesso!' });
    }
    else if (action === 'password_signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl },
      });
      if (error) throw error;
      return NextResponse.json({ message: 'Cadastro realizado! Verifique seu e-mail para confirmar.' });
    }
    else if (action === 'password_reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/api/auth/confirm?next=/dashboard/profile`,
      });
      if (error) throw error;
      return NextResponse.json({ message: 'E-mail de recuperação enviado! Verifique sua caixa de entrada.' });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    console.error('Erro na autenticação:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

