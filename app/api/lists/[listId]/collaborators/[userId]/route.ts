import { NextResponse } from 'next/server';
import { ListsService } from '@/services/lists.service';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ listId: string; userId: string }> }
) {
  try {
    const { listId, userId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await ListsService.removeCollaborator(supabase, listId, userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Erro na rota DELETE /api/lists/[listId]/collaborators/[userId]:`, error);
    return NextResponse.json(
      { error: 'Erro interno ao remover colaborador', details: error.message },
      { status: 500 }
    );
  }
}
