// services/settings.service.ts
import { createClient } from '@/lib/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_AI_COSTS = {
  cost_recipe: 1,
  cost_ocr: 2,
  cost_vision: 1,
  cost_voice: 1,
  cost_suggestion: 1,
  referral_bonus: 50
};

export const SettingsService = {
  /**
   * Busca todas as configurações de custo do banco.
   * Se falhar, retorna os valores padrão (fallback).
   */
  async getAICosts(supabase: SupabaseClient): Promise<typeof DEFAULT_AI_COSTS> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value');

      if (error || !data) return DEFAULT_AI_COSTS;

      // Transformar array de {key, value} em um objeto
      const costs = data.reduce((acc: any, curr) => {
        acc[curr.key] = Number(curr.value);
        return acc;
      }, {});

      return {
        ...DEFAULT_AI_COSTS,
        ...costs
      };
    } catch (err) {
      console.error('Erro ao buscar custos de IA:', err);
      return DEFAULT_AI_COSTS;
    }
  },

  /**
   * Atualiza uma configuração específica no banco.
   */
  async updateSetting(supabase: SupabaseClient, key: string, value: any) {
    const { error } = await supabase
      .from('system_settings')
      .upsert({ 
        key, 
        value: String(value), // Salvando como string para compatibilidade com o JSONB
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    if (error) throw error;
    return true;
  },

  /**
   * Atualiza múltiplas configurações de uma vez (Bulk Update).
   * PORQUÊ: Mais eficiente e reduz o número de requisições à rede.
   */
  async updateAllSettings(supabase: SupabaseClient, settings: Record<string, any>) {
    const payload = Object.entries(settings).map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('system_settings')
      .upsert(payload, { onConflict: 'key' });

    if (error) throw error;
    return true;
  }
};
