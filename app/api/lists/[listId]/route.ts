import { NextResponse } from 'next/server';
import { ListsService } from '@/services/lists.service';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
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
    
    const updatedList = await ListsService.updateList(supabase, listId, body);

    return NextResponse.json({ data: updatedList });
  } catch (error: any) {
    console.error(`Erro na rota PATCH /api/lists/[listId]:`, error);
    return NextResponse.json(
      { error: 'Erro interno ao atualizar lista', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await ListsService.deleteList(supabase, listId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Erro na rota DELETE /api/lists/[listId]:`, error);
    return NextResponse.json(
      { error: 'Erro interno ao deletar lista', details: error.message },
      { status: 500 }
    );
  }
}
