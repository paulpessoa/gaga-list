import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
import FormData from 'form-data'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testVoiceFlow() {
  console.log('--- Iniciando Teste de Fluxo de Voz (Staff Level) ---')

  // 1. Login
  const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'paulmspessoa@gmail.com',
    password: 'paulmspessoa@gmail.com'
  })

  if (loginError || !session) {
    console.error('Erro no login:', loginError?.message)
    return
  }

  const cookieName = `sb-qcejgeazpduqpnsakqvn-auth-token`
  const cookieValue = encodeURIComponent(JSON.stringify(session))
  const cookieHeader = `${cookieName}=${cookieValue}`
  const baseUrl = 'http://localhost:3000'

  // --- TESTE 1: ÁUDIO COMUM (EXTRAÇÃO E HINT) ---
  console.log('\n--- Teste 1: Processamento de Áudio com Whisper + Gemini ---')
  const audioPath = path.join(process.cwd(), 'public/testes-com-ia/teste-lista-de-compras.m4a')
  const audioBuffer = fs.readFileSync(audioPath)
  
  const form = new FormData()
  form.append('file', audioBuffer, { filename: 'audio.m4a', contentType: 'audio/m4a' })

  const voiceRes = await fetch(`${baseUrl}/api/ai/voice`, {
    method: 'POST',
    headers: { ...form.getHeaders(), 'Cookie': cookieHeader },
    body: form
  })
  
  const voiceData = await voiceRes.json() as any
  console.log('Status Voice:', voiceRes.status)
  console.log('Transcrição:', voiceData.transcription)
  console.log('Itens Identificados:', voiceData.items?.length || 0)
  if (voiceData.hint) console.log('💡 Dica da IA:', voiceData.hint)

  // --- TESTE 2: REPROCESSAMENTO DE TEXTO (SUGGESTIONS) ---
  console.log('\n--- Teste 2: Reprocessamento de Texto (Simulando Edição do Usuário) ---')
  const editedText = "Quero comprar 2kg de carne, um pacote de arroz e 3 latas de refrigerante"
  
  const suggestRes = await fetch(`${baseUrl}/api/ai/suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
    body: JSON.stringify({ text: editedText })
  })
  
  const suggestData = await suggestRes.json() as any
  console.log('Status Suggestions:', suggestRes.status)
  console.log('Itens Extraídos do Texto Editado:', suggestData.items?.map((i: any) => `${i.name} (${i.quantity || '1'})`).join(', '))

  // --- TESTE 3: PERSISTÊNCIA ATÔMICA (CRIAÇÃO DE LISTA + ITENS) ---
  console.log('\n--- Teste 3: Simulação de Persistência Atômica ---')
  const listTitle = "Teste Fluxo Voz " + new Date().toLocaleTimeString()
  
  // Criar Lista
  const createListRes = await fetch(`${baseUrl}/api/lists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
    body: JSON.stringify({ title: listTitle })
  })
  const newList = (await createListRes.json() as any).data
  console.log('Lista criada:', newList.id)

  // Criar Itens em Massa (Simulando o Promise.all do frontend)
  const itemsToCreate = suggestData.items || []
  const itemPromises = itemsToCreate.map((item: any) => 
    fetch(`${baseUrl}/api/lists/${newList.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
      body: JSON.stringify({
        name: item.name,
        quantity: item.quantity || "1",
        category: item.category
      })
    })
  )

  const results = await Promise.all(itemPromises)
  const successCount = results.filter(r => r.ok).length
  console.log(`✅ ${successCount}/${itemsToCreate.length} itens persistidos com sucesso na nova lista.`)

  console.log('\n--- Teste de Fluxo de Voz Finalizado ---')
}

testVoiceFlow().catch(console.error)
