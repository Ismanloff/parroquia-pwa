import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// CORS headers para permitir peticiones desde cualquier origen
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Handle OPTIONS request (CORS preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * GET /api/widget/settings?workspaceId=xxx
 * Obtiene la configuración del widget para un workspace
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get widget settings
    const { data: settings, error } = await supabaseAdmin
      .from('widget_settings')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      // If settings don't exist, create default ones
      if (error.code === 'PGRST116') {
        const { data: newSettings, error: insertError } = await supabaseAdmin
          .from('widget_settings')
          .insert({
            workspace_id: workspaceId,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating widget settings:', insertError);
          return NextResponse.json(
            { error: 'Failed to create widget settings' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          settings: newSettings,
        }, { headers: corsHeaders });
      }

      console.error('Error fetching widget settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch widget settings' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      settings,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in GET /api/widget/settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/widget/settings
 * Actualiza la configuración del widget
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, ...settings } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate color format (hex color)
    if (settings.primary_color && !/^#[0-9A-F]{6}$/i.test(settings.primary_color)) {
      return NextResponse.json(
        { error: 'Invalid primary_color format. Must be hex color (e.g., #667eea)' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (settings.secondary_color && !/^#[0-9A-F]{6}$/i.test(settings.secondary_color)) {
      return NextResponse.json(
        { error: 'Invalid secondary_color format. Must be hex color (e.g., #764ba2)' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate position
    if (settings.position && !['bottom-right', 'bottom-left'].includes(settings.position)) {
      return NextResponse.json(
        { error: 'Invalid position. Must be "bottom-right" or "bottom-left"' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate auto_open_delay
    if (settings.auto_open_delay !== undefined && (settings.auto_open_delay < 0 || settings.auto_open_delay > 60)) {
      return NextResponse.json(
        { error: 'Invalid auto_open_delay. Must be between 0 and 60 seconds' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update settings
    const { data, error } = await supabaseAdmin
      .from('widget_settings')
      .update(settings)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      console.error('Error updating widget settings:', error);
      return NextResponse.json(
        { error: 'Failed to update widget settings' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      settings: data,
      message: 'Widget settings updated successfully',
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in PATCH /api/widget/settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
