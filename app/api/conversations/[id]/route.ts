import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

export const runtime = 'nodejs';

// GET conversation with messages
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { id } = await params;

    console.log('Getting conversation:', id);

    // Get conversation with messages
    const { data: conversation, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        messages:messages(*)
      `)
      .eq('id', id)
      .single();

    if (error || !conversation) {
      console.error('Conversation not found:', error);
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Sort messages by created_at
    if (conversation.messages) {
      conversation.messages.sort((a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }

    return NextResponse.json({
      success: true,
      conversation: conversation,
    });
  } catch (error: any) {
    console.error('Error getting conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH update conversation (status, metadata)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { status, metadata } = body;

    console.log('Updating conversation:', id, { status, metadata });

    const updates: any = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (metadata) updates.metadata = metadata;

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating conversation:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation: data,
    });
  } catch (error: any) {
    console.error('Error in update conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
