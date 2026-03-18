import { type EmailOtpType } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/dashboard';

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    
    if (!error) {
      // Redireciona o usuário para o dashboard após confirmar o OTP
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Retorna o usuário para uma página de erro (ou para a home com erro)
  return NextResponse.redirect(new URL('/?error=auth-code-error', request.url));
}
