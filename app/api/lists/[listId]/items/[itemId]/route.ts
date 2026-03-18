import { NextResponse } from 'next/server';
import { ItemsService } from '@/services/items.service';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ listId: string; itemId: string }> }
) {
  try {
    const { listId, itemId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    
    const updatedItem = await ItemsService.updateItem(supabase, itemId, {
      ...body,
      purchased_by: body.is_purchased ? user.id : null,
    });

    return NextResponse.json({ data: updatedItem });
  } catch (error: any) {
    console.error(`Erro na rota PATCH /api/lists/[listId]/items/[itemId]:`, error);
    return NextResponse.json(
      { error: 'Erro interno ao atualizar item', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ listId: string; itemId: string }> }
) {
  try {
    const { listId, itemId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await ItemsService.deleteItem(supabase, itemId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Erro na rota DELETE /api/lists/[listId]/items/[itemId]:`, error);
    return NextResponse.json(
      { error: 'Erro interno ao deletar item', details: error.message },
      { status: 500 }
    );
  }
}
