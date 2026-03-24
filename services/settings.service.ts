// services/settings.service.ts
import { SupabaseClient } from "@supabase/supabase-js"

/**
 * AI Costs and Plan Prices standardized for the system.
 * WHY: Centralizing here makes the app fast (no DB hits every click)
 * but still allows overriding via Environment Variables.
 */
export const DEFAULT_AI_COSTS = {
  cost_recipe: Number(process.env.NEXT_PUBLIC_COST_RECIPE) || 2,
  cost_ocr: Number(process.env.NEXT_PUBLIC_COST_OCR) || 3,
  cost_vision: Number(process.env.NEXT_PUBLIC_COST_VISION) || 4,
  cost_voice: Number(process.env.NEXT_PUBLIC_COST_VOICE) || 1,
  cost_suggestion: Number(process.env.NEXT_PUBLIC_COST_SUGGESTION) || 1,
  referral_bonus: Number(process.env.NEXT_PUBLIC_REFERRAL_BONUS) || 50
}

/**
 * Plan Prices (in Cents for Stripe and BRL for UI)
 */
export const PLAN_CONFIGS = {
  semente: { name: "Semente", amount: 0, grains: 50, priceLabel: "Grátis" },
  broto: {
    name: "Broto",
    amount: Number(process.env.NEXT_PUBLIC_PLAN_BROTO_CENTS) || 990,
    grains: 500,
    priceLabel: "R$ 9,90"
  },
  colheita: {
    name: "Colheita",
    amount: Number(process.env.NEXT_PUBLIC_PLAN_COLHEITA_CENTS) || 1990,
    grains: 1500,
    priceLabel: "R$ 19,90"
  },
  fazenda: {
    name: "Fazenda",
    amount: Number(process.env.NEXT_PUBLIC_PLAN_FAZENDA_CENTS) || 4990,
    grains: 5000,
    priceLabel: "R$ 49,90"
  }
}

export const SettingsService = {
  getAICosts(_supabase?: SupabaseClient): typeof DEFAULT_AI_COSTS {
    return DEFAULT_AI_COSTS
  },

  getPlanConfigs() {
    return PLAN_CONFIGS
  },

  async getAICostsFromDB(
    supabase: SupabaseClient
  ): Promise<typeof DEFAULT_AI_COSTS> {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("key, value")

      if (error || !data) return DEFAULT_AI_COSTS

      const costs = data.reduce((acc: any, curr) => {
        let val = curr.value
        if (typeof val === "object" && val !== null) {
          val = val.value || val.val || Object.values(val)[0]
        }
        const numValue = Number(val)
        acc[curr.key] = isNaN(numValue)
          ? DEFAULT_AI_COSTS[curr.key as keyof typeof DEFAULT_AI_COSTS]
          : numValue
        return acc
      }, {})

      return { ...DEFAULT_AI_COSTS, ...costs }
    } catch (err) {
      return DEFAULT_AI_COSTS
    }
  },

  async updateSetting(supabase: SupabaseClient, key: string, value: any) {
    const { error } = await supabase.from("system_settings").upsert(
      {
        key,
        value: String(value),
        updated_at: new Date().toISOString()
      },
      { onConflict: "key" }
    )

    if (error) throw error
    return true
  },

  async updateAllSettings(
    supabase: SupabaseClient,
    settings: Record<string, any>
  ) {
    const payload = Object.entries(settings).map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from("system_settings")
      .upsert(payload, { onConflict: "key" })

    if (error) throw error
    return true
  }
}
