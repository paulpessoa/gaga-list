import { NextResponse } from 'next/server';
import { ListsService } from '@/services/lists.service';
import { createClient } from '@/lib/supabase/server';

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

    await ListsService.restoreList(supabase, listId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Erro na rota POST /api/lists/[listId]/restore:`, error);
    return NextResponse.json(
      { error: 'Erro interno ao restaurar lista', details: error.message },
      { status: 500 }
    );
  }
}
