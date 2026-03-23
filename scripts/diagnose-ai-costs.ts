
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { SettingsService } from '../services/settings.service';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variáveis do Supabase não encontradas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnose() {
  console.log('--- DIAGNÓSTICO DE CUSTOS DE IA ---');
  
  try {
    const { data: rawData, error: rawError } = await supabase
      .from('system_settings')
      .select('*');
    
    if (rawError) {
      console.error('❌ Erro ao ler system_settings:', rawError.message);
    } else {
      console.log('✅ Dados brutos da system_settings:', rawData);
    }

    const costs = await SettingsService.getAICosts(supabase);
    console.log('📊 Custos processados pelo SettingsService:', costs);

    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('credits')
      .limit(1)
      .single();

    if (profError) {
      console.error('❌ Erro ao ler perfil de teste:', profError.message);
    } else {
      console.log('👤 Saldo de créditos do usuário de teste:', profile.credits);
    }

  } catch (err: any) {
    console.error('💥 Erro fatal no diagnóstico:', err.message);
  }
}

diagnose();
