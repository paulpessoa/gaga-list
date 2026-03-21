// app/api/lists/route.ts
import { NextResponse } from 'next/server';
import { ListsService } from '@/services/lists.service';
import { createClient } from '@/lib/supabase/server';
import { sanitizeString } from '@/lib/utils';

/**
 * GET /api/lists
 * Retorna todas as listas do usuário autenticado.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isTrash = searchParams.get('trash') === 'true';
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Chamar o Service passando o client autenticado e o filtro de lixeira
    const lists = isTrash 
      ? await ListsService.getTrashLists(supabase)
      : await ListsService.getUserLists(supabase);

    // 3. Retornar os dados
    return NextResponse.json({ data: lists });
  } catch (error: any) {
    console.error('Erro na rota GET /api/lists:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar listas', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lists
 * Cria uma nova lista para o usuário autenticado.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Validar o Body da Requisição
    const body = await request.json();
    
    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json({ error: 'Título da lista é obrigatório' }, { status: 400 });
    }

    // 3. Chamar o Service com Sanitização
    const newList = await ListsService.createList(supabase, {
      owner_id: user.id,
      title: sanitizeString(body.title, 100),
      description: body.description ? sanitizeString(body.description, 255) : null,
      color_theme: body.color_theme || 'blue',
      icon: body.icon || '🛒',
    });

    // 4. Retornar a lista criada
    return NextResponse.json({ data: newList }, { status: 201 });
  } catch (error: any) {
    console.error('Erro na rota POST /api/lists:', error);
    return NextResponse.json(
      { error: 'Erro interno ao criar lista', details: error.message },
      { status: 500 }
    );
  }
}
