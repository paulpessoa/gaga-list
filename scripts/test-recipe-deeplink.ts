import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function testRecipeDeepLink() {
  console.log('🧪 [STAFF AUDIT] Testando Resiliência da Página de Receitas...')

  const baseUrl = 'http://localhost:3000'
  const testItems = 'Ovos,Queijo,Pão'
  const targetUrl = `${baseUrl}/app/recipes?items=${encodeURIComponent(testItems)}`

  console.log(`🔗 Simulando acesso ao Deep Link: ${targetUrl}`)

  try {
    // Como é uma página de frontend (RSC/Client), o fetch direto apenas valida se a rota não dá 404
    const response = await fetch(targetUrl)
    
    if (response.ok) {
      console.log('\n🏆 [SUCCESS] A rota /app/recipes está respondendo corretamente.')
      console.log('O parsing de URL agora deve ser validado visualmente no navegador.')
    } else {
      console.error(`\n❌ [FAILURE] A rota retornou status: ${response.status}`)
    }
  } catch (err: any) {
    console.error('❌ [CRITICAL ERROR]:', err.message)
  }
}

testRecipeDeepLink().catch(console.error)
