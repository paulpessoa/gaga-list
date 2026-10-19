// lib/agent/run-agent.ts
import { GoogleGenerativeAI, type Content, type FunctionDeclaration, type Part } from "@google/generative-ai"
import OpenAI from "openai"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"
import { getGeminiApiKey, GEMINI_AGENT_MODEL, OPENAI_AGENT_MODEL } from "@/lib/ai-utils"
import { AGENT_TOOLS, executeTool, type ToolContext } from "./tools"

/**
 * Loop do agente conversacional com Gemini como provedor principal e OpenAI como fallback.
 *
 * PORQUÊ: O histórico da execução fica num formato neutro (Step). Se o Gemini falhar
 * no meio de uma conversa com tools, a OpenAI continua a partir do mesmo histórico,
 * sem reexecutar as alterações que já foram gravadas no banco.
 */

export type ChatTurn = { role: "user" | "assistant"; content: string }

type ToolCall = { id: string; name: string; args: Record<string, unknown> }

type Step =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string; toolCalls: ToolCall[]; geminiContent?: Content }
  | { role: "tool"; results: { call: ToolCall; result: unknown }[] }

type ProviderOutput = { text: string; toolCalls: ToolCall[]; geminiContent?: Content }

type Provider = {
  name: "gemini" | "openai"
  model: string
  call: (system: string, steps: Step[]) => Promise<ProviderOutput>
}

const MAX_STEPS = 8
const REQUEST_TIMEOUT_MS = 20_000

function geminiProvider(apiKey: string): Provider {
  const genAI = new GoogleGenerativeAI(apiKey)

  const toContent = (step: Step): Content => {
    if (step.role === "user") return { role: "user", parts: [{ text: step.text }] }
    if (step.role === "tool") {
      return {
        role: "user",
        parts: step.results.map(({ call, result }) => ({
          functionResponse: { name: call.name, response: { result } }
        }))
      }
    }
    // Reutiliza o conteúdo original do Gemini para preservar as thought signatures
    if (step.geminiContent) return step.geminiContent
    const parts: Part[] = []
    if (step.text) parts.push({ text: step.text })
    step.toolCalls.forEach((c) => parts.push({ functionCall: { name: c.name, args: c.args } }))
    return { role: "model", parts }
  }

  return {
    name: "gemini",
    model: GEMINI_AGENT_MODEL,
    async call(system, steps) {
      const model = genAI.getGenerativeModel(
        {
          model: GEMINI_AGENT_MODEL,
          systemInstruction: system,
          tools: [{ functionDeclarations: AGENT_TOOLS as unknown as FunctionDeclaration[] }]
        },
        { timeout: REQUEST_TIMEOUT_MS }
      )
      const result = await model.generateContent({ contents: steps.map(toContent) })
      const content = result.response.candidates?.[0]?.content
      if (!content?.parts?.length) throw new Error("Gemini retornou resposta vazia")

      const text = content.parts.map((p) => p.text || "").join("").trim()
      const toolCalls = content.parts
        .filter((p) => p.functionCall)
        .map((p, i) => ({
          id: `gemini_${Date.now()}_${i}`,
          name: p.functionCall!.name,
          args: (p.functionCall!.args as Record<string, unknown>) || {}
        }))
      return { text, toolCalls, geminiContent: { role: "model", parts: content.parts } }
    }
  }
}

function openaiProvider(apiKey: string): Provider {
  const openai = new OpenAI({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 1 })

  const toMessages = (step: Step): ChatCompletionMessageParam[] => {
    if (step.role === "user") return [{ role: "user", content: step.text }]
    if (step.role === "tool") {
      return step.results.map(({ call, result }) => ({
        role: "tool" as const,
        tool_call_id: call.id,
        content: JSON.stringify(result)
      }))
    }
    return [
      {
        role: "assistant",
        content: step.text || null,
        ...(step.toolCalls.length && {
          tool_calls: step.toolCalls.map((c) => ({
            id: c.id,
            type: "function" as const,
            function: { name: c.name, arguments: JSON.stringify(c.args) }
          }))
        })
      }
    ]
  }

  return {
    name: "openai",
    model: OPENAI_AGENT_MODEL,
    async call(system, steps) {
      const completion = await openai.chat.completions.create({
        model: OPENAI_AGENT_MODEL,
        temperature: 0.4,
        messages: [{ role: "system", content: system }, ...steps.flatMap(toMessages)],
        tools: AGENT_TOOLS.map((t) => ({ type: "function" as const, function: t }))
      })
      const message = completion.choices[0]?.message
      if (!message) throw new Error("OpenAI retornou resposta vazia")

      const toolCalls = (message.tool_calls || []).flatMap((tc) => {
        if (tc.type !== "function") return []
        let args: Record<string, unknown> = {}
        try {
          args = JSON.parse(tc.function.arguments || "{}")
        } catch {
          // Argumentos malformados: a tool devolve erro de validação ao modelo
        }
        return [{ id: tc.id, name: tc.function.name, args }]
      })
      return { text: (message.content || "").trim(), toolCalls }
    }
  }
}

export function getAvailableProviders(): Provider[] {
  const providers: Provider[] = []
  const geminiKey = getGeminiApiKey()
  if (geminiKey) providers.push(geminiProvider(geminiKey))
  if (process.env.OPENAI_API_KEY) providers.push(openaiProvider(process.env.OPENAI_API_KEY))
  return providers
}

export async function runAgent(params: {
  system: string
  history: ChatTurn[]
  ctx: ToolContext
  providers: Provider[]
}): Promise<{ reply: string; provider: Provider["name"]; model: string }> {
  const { system, ctx, providers } = params
  // Gemini exige que a conversa comece pelo usuário
  const history = params.history.slice(params.history.findIndex((t) => t.role === "user"))
  const steps: Step[] = history.map((t) =>
    t.role === "user" ? { role: "user", text: t.content } : { role: "assistant", text: t.content, toolCalls: [] }
  )

  let current = 0
  for (let i = 0; i < MAX_STEPS; i++) {
    let output: ProviderOutput
    for (;;) {
      const provider = providers[current]
      try {
        output = await provider.call(system, steps)
        if (!output.text && !output.toolCalls.length) throw new Error("Resposta sem texto nem tools")
        break
      } catch (err: any) {
        console.warn(`AGENT: ${provider.name} falhou (${err?.message}).`)
        if (++current >= providers.length) throw err
        console.warn(`AGENT: usando fallback ${providers[current].name}.`)
      }
    }

    steps.push({ role: "assistant", ...output })
    const { name, model } = providers[current]
    if (!output.toolCalls.length) return { reply: output.text, provider: name, model }

    // Leituras rodam depois das escritas da mesma etapa, para get_* já enxergar as alterações
    const isRead = (c: ToolCall) => c.name.startsWith("get_")
    const ordered = [...output.toolCalls.filter((c) => !isRead(c)), ...output.toolCalls.filter(isRead)]
    const resultById = new Map<string, unknown>()
    for (const call of ordered) {
      resultById.set(call.id, await executeTool(call.name, call.args, ctx))
    }
    steps.push({ role: "tool", results: output.toolCalls.map((call) => ({ call, result: resultById.get(call.id) })) })
  }

  return {
    reply: "Fiz várias etapas e preciso parar por aqui. Confere na lista se ficou como você queria?",
    provider: providers[current].name,
    model: providers[current].model
  }
}
