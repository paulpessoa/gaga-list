import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
import FormData from 'form-data'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function testSystem() {
  console.log('--- Iniciando Teste de Sistema IA Comprehensive ---')

  // 1. Login
  const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'baba@baba.com',
    password: '123'
  })

  if (loginError || !session) {
    console.error('Erro no login:', loginError?.message)
    return
  }

  console.log('Login realizado com sucesso. User:', session.user.id)

  const cookieName = `sb-qcejgeazpduqpnsakqvn-auth-token`
  const cookieValue = encodeURIComponent(JSON.stringify(session))
  const cookieHeader = `${cookieName}=${cookieValue}`

  const baseUrl = 'http://localhost:3000'

  async function checkCredits() {
    const { data: profile } = await supabaseAdmin.from('profiles').select('credits').eq('id', session!.user.id).single()
    return profile?.credits || 0
  }

  const initialCredits = await checkCredits()
  console.log('Créditos iniciais:', initialCredits)

  // --- TESTE VISION ---
  console.log('\n--- Testando /api/ai/vision (Redbull) ---')
  const visionImagePath = path.join(process.cwd(), 'public/testes-com-ia/Lata Redbull Maçã.jpg')
  const visionImageBuffer = fs.readFileSync(visionImagePath)
  const visionBase64 = `data:image/jpeg;base64,${visionImageBuffer.toString('base64')}`

  const visionRes = await fetch(`${baseUrl}/api/ai/vision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
    body: JSON.stringify({ image: visionBase64 })
  })
  console.log('Status Vision:', visionRes.status)
  const visionData = await visionRes.json()
  console.log('Resultado Vision:', (visionData as any).data?.name)

  // --- TESTE OCR ---
  console.log('\n--- Testando /api/ai/ocr (Lista Escrita) ---')
  const ocrImagePath = path.join(process.cwd(), 'public/testes-com-ia/lista-comras-escrita.png')
  const ocrImageBuffer = fs.readFileSync(ocrImagePath)
  const ocrBase64 = `data:image/jpeg;base64,${ocrImageBuffer.toString('base64')}`

  const ocrRes = await fetch(`${baseUrl}/api/ai/ocr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
    body: JSON.stringify({ image: ocrBase64 })
  })
  console.log('Status OCR:', ocrRes.status)
  const ocrData = await ocrRes.json()
  console.log('Resultado OCR (primeiros 3 itens):', (ocrData as any).items?.slice(0, 3))

  // --- TESTE VOICE ---
  console.log('\n--- Testando /api/ai/voice (Audio m4a) ---')
  const audioPath = path.join(process.cwd(), 'public/testes-com-ia/teste-lista-de-compras.m4a')
  const audioBuffer = fs.readFileSync(audioPath)
  
  const form = new FormData()
  form.append('file', audioBuffer, { filename: 'audio.m4a', contentType: 'audio/m4a' })

  const voiceRes = await fetch(`${baseUrl}/api/ai/voice`, {
    method: 'POST',
    headers: { 
      ...form.getHeaders(),
      'Cookie': cookieHeader 
    },
    body: form
  })
  console.log('Status Voice:', voiceRes.status)
  const voiceData = await voiceRes.json()
  console.log('Transcrição Voice:', (voiceData as any).transcription)
  console.log('Itens Extraídos Voice:', (voiceData as any).items?.slice(0, 3))

  // --- TESTE RECIPES ---
  console.log('\n--- Testando /api/ai/recipes ---')
  const recipeRes = await fetch(`${baseUrl}/api/ai/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
    body: JSON.stringify({ items: ['Ovos', 'Pão', 'Queijo'], type: 'from_list' })
  })
  console.log('Status Recipe:', recipeRes.status)
  const recipeData = await recipeRes.json()
  if (recipeRes.status === 200) {
    console.log('Primeira Receita:', (recipeData as any).recipes?.[0]?.title)
  } else {
    console.error('Erro Recipe:', recipeData)
  }

  const finalCredits = await checkCredits()
  console.log('\n--- Resumo de Créditos ---')
  console.log('Créditos Iniciais:', initialCredits)
  console.log('Créditos Finais:', finalCredits)
  console.log('Total Consumido:', initialCredits - finalCredits)
}

testSystem().catch(console.error)
