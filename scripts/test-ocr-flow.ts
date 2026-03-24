import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'paulmspessoa@gmail.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'paulmspessoa@gmail.com'

async function testOCRFlow() {
  console.log('🧪 [STAFF AUDIT] Testando Fluxo: OCR -> Lista')

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // 1. Login
  const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  })

  if (loginError || !session) {
    console.error('❌ Erro no login:', loginError?.message)
    return
  }

  const cookieName = `sb-qcejgeazpduqpnsakqvn-auth-token`
  const cookieValue = encodeURIComponent(JSON.stringify(session))
  const cookieHeader = `${cookieName}=${cookieValue}`
  const baseUrl = 'http://localhost:3000'

  try {
    // 2. Simular OCR
    console.log('📸 Lendo imagem de teste...')
    const ocrImagePath = path.join(process.cwd(), 'public/testes-com-ia/lista-comras-escrita.png')
    const ocrImageBuffer = fs.readFileSync(ocrImagePath)
    const ocrBase64 = `data:image/png;base64,${ocrImageBuffer.toString('base64')}`

    const ocrRes = await fetch(`${baseUrl}/api/ai/ocr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
      body: JSON.stringify({ image: ocrBase64 })
    })

    const ocrData = await ocrRes.json() as any
    if (!ocrRes.ok) throw new Error(ocrData.error || 'Erro no OCR')

    const items = ocrData.items || []
    console.log(`✅ IA identificou ${items.length} itens.`)

    // 3. Criar Lista
    console.log('📝 Criando lista a partir do OCR...')
    const listRes = await fetch(`${baseUrl}/api/lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
      body: JSON.stringify({ title: `Foto: ${new Date().toLocaleTimeString()}` })
    })
    
    const listData = await listRes.json() as any
    const newList = listData.data

    if (!newList?.id) throw new Error('Falha ao criar lista')

    // 4. Adicionar Itens
    console.log('🍎 Adicionando itens detectados...')
    for (const item of items) {
      const itemRes = await fetch(`${baseUrl}/api/lists/${newList.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
        body: JSON.stringify({
          name: item.name,
          quantity: item.quantity || "1",
          category: item.category || null
        })
      })
      if (itemRes.ok) console.log(`  + ${item.name}`)
    }

    console.log('\n🏆 [SUCCESS] Fluxo OCR -> Lista concluído com sucesso!')

  } catch (err: any) {
    console.error('❌ [CRITICAL ERROR]:', err.message)
  }
}

testOCRFlow().catch(console.error)
