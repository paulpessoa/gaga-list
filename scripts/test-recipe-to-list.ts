import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import fetch from 'node-fetch'

// Carregar .env
dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config({ path: path.join(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'paulmspessoa@gmail.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'paulmspessoa@gmail.com'

async function testRecipeToListFlow() {
  console.log('🧪 [STAFF AUDIT] Testando Fluxo: Receita -> Lista')

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
    // 2. Simular dados de uma receita
    const mockRecipe = {
      title: "Macarrão Carbonara",
      ingredients: [
        { name: "Macarrão Espaguete", quantity: "500", unit: "g" },
        { name: "Ovos", quantity: "4", unit: "un" },
        { name: "Bacon", quantity: "200", unit: "g" }
      ]
    }

    console.log('📝 Criando lista a partir da receita...')
    const listRes = await fetch(`${baseUrl}/api/lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
      body: JSON.stringify({ title: `Ingredientes: ${mockRecipe.title}` })
    })
    
    const listData = await listRes.json() as any
    const newList = listData.data

    if (!newList?.id) {
      console.error('❌ Falha ao criar lista:', listData)
      return
    }
    console.log('✅ Lista criada ID:', newList.id)

    // 3. Adicionar Itens sequencialmente (como no frontend)
    console.log('🍎 Adicionando itens...')
    for (const ingredient of mockRecipe.ingredients) {
      const itemRes = await fetch(`${baseUrl}/api/lists/${newList.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
        body: JSON.stringify({
          name: ingredient.name,
          quantity: ingredient.quantity || "1",
          unit: ingredient.unit || null
        })
      })
      
      if (itemRes.ok) {
        console.log(`✅ Item adicionado: ${ingredient.name}`)
      } else {
        const err = await itemRes.json()
        console.error(`❌ Falha ao adicionar ${ingredient.name}:`, err)
      }
    }

    // 4. Verificação Final
    const finalRes = await fetch(`${baseUrl}/api/lists/${newList.id}/items`, {
      headers: { 'Cookie': cookieHeader }
    })
    const finalData = await finalRes.json() as any
    console.log(`\n📊 Resultado Final: ${finalData.data?.length || 0}/${mockRecipe.ingredients.length} itens encontrados na lista.`)

  } catch (err: any) {
    console.error('❌ [CRITICAL ERROR]:', err.message)
  }
}

testRecipeToListFlow().catch(console.error)
