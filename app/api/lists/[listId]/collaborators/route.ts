import { NextResponse } from 'next/server';
import { ListsService } from '@/services/lists.service';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const { listId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const collaborators = await ListsService.getCollaborators(supabase, listId);
    return NextResponse.json({ data: collaborators });
  } catch (error: any) {
    console.error(`Erro na rota GET /api/lists/[listId]/collaborators:`, error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar colaboradores', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const { listId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    
    if (!body.email || typeof body.email !== 'string') {
      return NextResponse.json({ error: 'E-mail do colaborador é obrigatório' }, { status: 400 });
    }

    const newCollaborator = await ListsService.addCollaborator(supabase, listId, body.email);

    return NextResponse.json({ data: newCollaborator }, { status: 201 });
  } catch (error: any) {
    console.error(`Erro na rota POST /api/lists/[listId]/collaborators:`, error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao adicionar colaborador' },
      { status: error.message.includes('não encontrado') ? 404 : 500 }
    );
  }
}
