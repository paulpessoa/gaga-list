import { NextResponse } from 'next/server';
import { ItemsService } from '@/services/items.service';
import { createClient } from '@/lib/supabase/server';
import { sanitizeString } from '@/lib/utils';

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

    const items = await ItemsService.getListItems(supabase, listId);
    return NextResponse.json({ data: items });
  } catch (error: any) {
    console.error(`Erro na rota GET /api/lists/[listId]/items:`, error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar itens', details: error.message },
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
    
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'Nome do item é obrigatório' }, { status: 400 });
    }

    // Criar item com Sanitização
    const newItem = await ItemsService.createItem(supabase, {
      list_id: listId,
      added_by: user.id,
      name: sanitizeString(body.name, 100),
      quantity: body.quantity || 1,
      unit: body.unit ? sanitizeString(body.unit, 20) : null,
      category: body.category ? sanitizeString(body.category, 50) : null,
    });

    return NextResponse.json({ data: newItem }, { status: 201 });
  } catch (error: any) {
    console.error(`Erro na rota POST /api/lists/[listId]/items:`, error);
    return NextResponse.json(
      { error: 'Erro interno ao criar item', details: error.message },
      { status: 500 }
    );
  }
}
