import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configurações do projeto
const SUPABASE_URL = 'https://qcejgeazpduqpnsakqvn.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZWpnZWF6cGR1cXBuc2FrcXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MTA1NDgsImV4cCI6MjA4OTM4NjU0OH0.OluJEqrAOs5EURWkDW6AcX1BGyHjXrXYUKDtcWzThG0';

const TEST_EMAIL = 'paulmspessoa@gmail.com';
const TEST_PASSWORD = 'paulmspessoa@gmail.com';

async function testProfileUpload() {
  console.log('🚀 Iniciando teste de upload de perfil...');

  const supabase = createClient(SUPABASE_URL, ANON_KEY);

  // 1. Login
  console.log('🔐 Autenticando...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (authError || !authData.user) {
    console.error('❌ Falha na autenticação:', authError?.message);
    return;
  }
  console.log('✅ Autenticado como:', authData.user.email);

  const userId = authData.user.id;

  // 2. Preparar Imagem
  const imagePath = path.join(process.cwd(), 'public', 'paul_pessoa_profile.png');
  if (!fs.existsSync(imagePath)) {
    console.error('❌ Imagem não encontrada em:', imagePath);
    return;
  }

  const fileBuffer = fs.readFileSync(imagePath);
  const filePath = `${userId}/avatar.png`;

  // 3. Upload para o Bucket 'avatars'
  console.log('📤 Fazendo upload da imagem para storage...');
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, fileBuffer, { 
      upsert: true,
      contentType: 'image/png'
    });

  if (uploadError) {
    console.error('❌ Erro no upload:', uploadError.message);
    return;
  }
  console.log('✅ Upload concluído com sucesso!');

  // 4. Obter URL Pública
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  const publicUrlWithTimestamp = `${publicUrl}?t=${Date.now()}`;
  console.log('🔗 URL Gerada:', publicUrlWithTimestamp);

  // 5. UPSERT na tabela profiles (Cria se não existir, atualiza se existir)
  console.log('📝 Fazendo UPSERT na tabela profiles...');
  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert({ 
      id: userId,
      email: TEST_EMAIL,
      avatar_url: publicUrlWithTimestamp,
      full_name: 'Paul Pessoa'
    });

  if (upsertError) {
    console.error('❌ Erro no upsert do perfil:', upsertError.message);
    return;
  }
  console.log('✅ Perfil persistido com sucesso!');

  // 6. Verificação Final
  console.log('🔍 Verificando persistência...');
  const { data: finalProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .single();

  if (fetchError || !finalProfile) {
    console.error('❌ Erro ao verificar perfil:', fetchError?.message);
    return;
  }

  if (finalProfile.avatar_url?.includes(publicUrl)) {
    console.log('\n🏆 TESTE BEM SUCEDIDO!');
    console.log('📸 A imagem foi carregada e o perfil foi criado/atualizado.');
    console.log('📸 URL Final:', finalProfile.avatar_url);
  } else {
    console.error('❌ Falha na verificação: URL no banco não corresponde.');
  }
}

testProfileUpload();
