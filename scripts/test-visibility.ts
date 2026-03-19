import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Precisa ser a key de serviço para bypassar RLS e ver a verdade

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testVisibility() {
  console.log("--- DIAGNÓSTICO DE VISIBILIDADE ---")

  // 1. Buscar Paul
  const { data: paul } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", "paulmspessoa@gmail.com")
    .single()

  if (!paul) {
    console.error("ERRO: Usuário Paul não encontrado no banco!")
    return
  }
  console.log(`Paul ID: ${paul.id}`)

  // 2. Buscar listas onde Paul é colaborador
  const { data: collabLists } = await supabase
    .from("list_collaborators")
    .select("list_id, role")
    .eq("user_id", paul.id)

  console.log(
    `Paul está em ${collabLists?.length || 0} listas como colaborador.`
  )

  if (collabLists && collabLists.length > 0) {
    for (const item of collabLists) {
      console.log(`\nAnalisando Lista ID: ${item.list_id}`)

      // 3. Ver quem mais está nessa lista
      const { data: members } = await supabase
        .from("list_collaborators")
        .select("user_id, role, profiles(email, full_name)")
        .eq("list_id", item.list_id)

      console.log(`Total de membros reais nesta lista: ${members?.length || 0}`)
      members?.forEach((m) => {
        console.log(`- Member: ${m.profiles} (${m.role})`)
      })

      // 4. Buscar o dono da lista (tabela lists)
      const { data: listData } = await supabase
        .from("lists")
        .select("owner_id, title")
        .eq("id", item.list_id)
        .single()

      console.log(`Dono da Lista ID: ${listData?.owner_id}`)
    }
  }
}

testVisibility()
