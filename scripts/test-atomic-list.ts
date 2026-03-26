import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testAtomicList() {
  console.log('🧪 [STAFF AUDIT] Testando Criação Atômica: Lista + Itens')

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // 1. Login
  const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'paulmspessoa@gmail.com',
    password: 'paulmspessoa@gmail.com'
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
    // 2. Payload Atômico
    const payload = {
      title: "Lista Atômica de Teste",
      initial_items: [
        { name: "Item 1", quantity: "2", unit: "un" },
        { name: "Item 2", quantity: "1", category: "Limpeza" },
        { name: "Item 3", price: 15.5, notes: "Teste de persistência" }
      ]
    }

    console.log('🚀 Enviando requisição atômica para /api/lists...')
    const start = Date.now()
    const res = await fetch(`${baseUrl}/api/lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
      body: JSON.stringify(payload)
    })

    const data = await res.json() as any
    const end = Date.now()

    if (!res.ok) throw new Error(data.error || 'Erro na API')

    console.log(`✅ Sucesso! Lista criada em ${end - start}ms`)
    console.log(`🆔 ID da Lista: ${data.data.id}`)

    // 3. Validar se itens existem
    console.log('🔍 Verificando se os itens foram criados no banco...')
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .eq('list_id', data.data.id)

    if (itemsError) throw itemsError

    if (items && items.length === payload.initial_items.length) {
      console.log(`🏆 [SUCCESS] Todos os ${items.length} itens foram persistidos atomicamente!`)
    } else {
      console.error(`❌ [FAILURE] Esperava ${payload.initial_items.length} itens, mas encontrou ${items?.length || 0}`)
    }

  } catch (err: any) {
    console.error('❌ [CRITICAL ERROR]:', err.message)
  }
}

testAtomicList().catch(console.error)
