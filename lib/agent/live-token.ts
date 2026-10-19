// lib/agent/live-token.ts
import { Behavior, GoogleGenAI, Modality, type FunctionDeclaration } from "@google/genai"
import { GEMINI_LIVE_MODEL, GEMINI_LIVE_VOICE, LIVE_MAX_MINUTES } from "@/lib/ai-utils"
import { AGENT_TOOLS } from "./tools"

/**
 * Cria um token efêmero de uso único para o navegador abrir uma sessão Gemini Live.
 *
 * PORQUÊ: O navegador conecta direto no Gemini via WebSocket, então ele nunca recebe a
 * GEMINI_API_KEY. O token trava modelo, prompt, tools e demais configs da sessão, então
 * o cliente não consegue trocar as instruções nem usar a cota para outra coisa.
 */
export async function createLiveToken(apiKey: string, systemInstruction: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey })
  const now = Date.now()
  const token = await ai.authTokens.create({
    config: {
      uses: 1,
      expireTime: new Date(now + (LIVE_MAX_MINUTES + 1) * 60_000).toISOString(),
      newSessionExpireTime: new Date(now + 60_000).toISOString(),
      liveConnectConstraints: {
        model: GEMINI_LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction,
          // BLOCKING: o modelo espera o resultado antes de confirmar a ação em voz alta
          tools: [
            {
              functionDeclarations: AGENT_TOOLS.map(
                (t) => ({ ...t, behavior: Behavior.BLOCKING }) as unknown as FunctionDeclaration
              )
            }
          ],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: GEMINI_LIVE_VOICE } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      }
      // Sem lockAdditionalFields, todos os campos da LiveConnectConfig ficam travados
    }
  })
  if (!token.name) throw new Error("Gemini não devolveu o token efêmero")
  return token.name
}
