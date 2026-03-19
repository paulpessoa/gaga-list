import { createClient } from '@supabase/supabase-js';

// Configurações extraídas do seu projeto
const SUPABASE_URL = 'https://qcejgeazpduqpnsakqvn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZWpnZWF6cGR1cXBuc2FrcXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MTA1NDgsImV4cCI6MjA4OTM4NjU0OH0.OluJEqrAOs5EURWkDW6AcX1BGyHjXrXYUKDtcWzThG0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTests() {
  console.log('🚀 Iniciando testes de fluxo...');

  // 1. Autenticação
  console.log('\n🔐 Teste 1: Autenticação');
  let authResult = await supabase.auth.signInWithPassword({
    email: 'paulmspessoa@gmail.com',
    password: 'paulmspessoa@gmai.com',
  });

  if (authResult.error) {
    console.log('⚠️ Falha com a primeira senha, tentando com @gmail.com...');
    authResult = await supabase.auth.signInWithPassword({
      email: 'paulmspessoa@gmail.com',
      password: 'paulmspessoa@gmail.com',
    });
  }

  const { data: authData, error: authError } = authResult;

  if (authError) {
    console.error('❌ Erro na autenticação:', authError.message);
    return;
  }
  console.log('✅ Autenticado como:', authData.user?.email);

  // 2. Criar uma Lista
  console.log('\n📝 Teste 2: Criar uma lista');
  const listTitle = `Lista de Teste ${new Date().toLocaleTimeString()}`;
  const { data: listData, error: listError } = await supabase
    .from('lists')
    .insert({
      owner_id: authData.user?.id,
      title: listTitle,
      description: 'Criada via script de teste',
      color_theme: 'emerald',
      icon: '🛒'
    })
    .select()
    .single();

  if (listError) {
    console.error('❌ Erro ao criar lista:', listError.message);
    return;
  }
  const listId = listData.id;
  console.log('✅ Lista criada:', listData.title, `(ID: ${listId})`);

  // 3. Criar um Item na Lista
  console.log('\n🍎 Teste 3: Criar um item na lista');
  const { data: itemData, error: itemError } = await supabase
    .from('items')
    .insert({
      list_id: listId,
      added_by: authData.user?.id,
      name: 'Item de Teste',
      quantity: 1,
      unit: 'un',
      category: 'Teste'
    })
    .select()
    .single();

  if (itemError) {
    console.error('❌ Erro ao criar item:', itemError.message);
    return;
  }
  console.log('✅ Item criado:', itemData.name, `(Quantidade: ${itemData.quantity})`);

  // 4. Convidar Colaborador
  console.log('\n📧 Teste 4: Convidar colaborador (contatoismaela@gmail.com)');
  
  // Primeiro tentamos ver se o perfil existe
  const { data: profileData } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', 'contatoismaela@gmail.com')
    .maybeSingle();

  if (profileData) {
    // Se o usuário existe, adicionamos diretamente como colaborador
    const { error: collabError } = await supabase
      .from('list_collaborators')
      .insert({
        list_id: listId,
        user_id: profileData.id,
        role: 'editor'
      });

    if (collabError) {
      if (collabError.code === '23505') {
        console.log('ℹ️ O usuário já é um colaborador desta lista.');
      } else {
        console.error('❌ Erro ao adicionar colaborador:', collabError.message);
      }
    } else {
      console.log('✅ Colaborador adicionado com sucesso!');
    }
  } else {
    // Se o usuário não existe, registramos convite pendente
    console.log('ℹ️ Usuário não encontrado no sistema. Registrando convite pendente...');
    const { error: pendingError } = await supabase
      .from('pending_invitations')
      .insert({
        list_id: listId,
        email: 'contatoismaela@gmail.com',
        invited_by: authData.user?.id
      });

    if (pendingError) {
      if (pendingError.code === '23505') {
        console.log('ℹ️ Convite pendente já existe para este e-mail.');
      } else {
        console.error('❌ Erro ao registrar convite pendente:', pendingError.message);
      }
    } else {
      console.log('✅ Convite pendente registrado para contatoismaela@gmail.com');
    }
  }

  console.log('\n✨ Todos os testes concluídos!');
}

runTests();
