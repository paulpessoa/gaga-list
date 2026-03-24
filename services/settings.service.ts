// services/settings.service.ts
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Custos de IA padronizados para o sistema.
 * PORQUÊ: Centralizar aqui permite que o app seja rápido (sem bater no DB toda hora)
 * mas ainda permite sobrescrever via Variáveis de Ambiente se necessário.
 */
export const DEFAULT_AI_COSTS = {
  cost_recipe: Number(process.env.NEXT_PUBLIC_COST_RECIPE) || 1,
  cost_ocr: Number(process.env.NEXT_PUBLIC_COST_OCR) || 2,
  cost_vision: Number(process.env.NEXT_PUBLIC_COST_VISION) || 1,
  cost_voice: Number(process.env.NEXT_PUBLIC_COST_VOICE) || 1,
  cost_suggestion: Number(process.env.NEXT_PUBLIC_COST_SUGGESTION) || 1,
  referral_bonus: Number(process.env.NEXT_PUBLIC_REFERRAL_BONUS) || 50
};

export const SettingsService = {
  /**
   * Retorna os custos de IA. 
   * Agora é síncrono por padrão para evitar latência de rede.
   * O parâmetro supabase é mantido para compatibilidade, mas não é usado para o 'get'.
   */
  getAICosts(_supabase?: SupabaseClient): typeof DEFAULT_AI_COSTS {
    return DEFAULT_AI_COSTS;
  },

  /**
   * Busca custos do banco de dados (OPCIONAL/LEGACY).
   * Mantemos apenas se realmente precisarmos de uma mudança "ao vivo" sem deploy.
   */
  async getAICostsFromDB(supabase: SupabaseClient): Promise<typeof DEFAULT_AI_COSTS> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value');

      if (error || !data) return DEFAULT_AI_COSTS;

      const costs = data.reduce((acc: any, curr) => {
        let val = curr.value;
        if (typeof val === 'object' && val !== null) {
          val = val.value || val.val || Object.values(val)[0];
        }
        const numValue = Number(val);
        acc[curr.key] = isNaN(numValue) ? DEFAULT_AI_COSTS[curr.key as keyof typeof DEFAULT_AI_COSTS] : numValue;
        return acc;
      }, {});

      return { ...DEFAULT_AI_COSTS, ...costs };
    } catch (err) {
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
        value: String(value),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    if (error) throw error;
    return true;
  },

  /**
   * Atualiza múltiplas configurações de uma vez (Bulk Update).
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
