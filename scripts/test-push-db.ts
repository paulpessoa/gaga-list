
import { createClient } from '@supabase/supabase-js'

// Variáveis injetadas via comando ou assumidas do ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('ERRO: Variáveis de ambiente Supabase não encontradas. Tente rodar com as variáveis definidas.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testPushUpdate() {
  console.log('--- Iniciando Teste de Banco de Dados: Push Subscription ---')
  
  // 1. Pegar um usuário de teste
  const { data: profiles, error: fetchError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .limit(1)

  if (fetchError || !profiles || profiles.length === 0) {
    console.error('ERRO: Nenhum perfil encontrado para testar.', fetchError)
    return
  }

  const testProfile = profiles[0]
  console.log(`Testando com perfil: ${testProfile.full_name} (${testProfile.id})`)

  // 2. Simular um objeto de assinatura push
  const mockSubscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-123',
    keys: {
      p256dh: 'test-p256dh-key',
      auth: 'test-auth-key'
    }
  }

  // 3. Tentar atualizar
  console.log('Atualizando coluna push_subscription...')
  const { data, error: updateError } = await (supabase.from('profiles') as any)
    .update({ push_subscription: mockSubscription })
    .eq('id', testProfile.id)
    .select()

  if (updateError) {
    console.error('FALHA: Erro ao atualizar push_subscription:', updateError)
  } else {
    console.log('SUCESSO: Coluna push_subscription atualizada com sucesso!')
    console.log('Valor gravado:', JSON.stringify(data[0].push_subscription, null, 2))
    
    // 4. Limpar o teste (opcional)
    await (supabase.from('profiles') as any)
      .update({ push_subscription: null })
      .eq('id', testProfile.id)
    console.log('Teste concluído e limpo.')
  }
}

testPushUpdate().catch(console.error)
