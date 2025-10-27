import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const workflowId = process.env.CHATKIT_WORKFLOW_ID;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!workflowId) {
      return NextResponse.json(
        { error: 'CHATKIT_WORKFLOW_ID no está configurado' },
        { status: 500 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY no está configurada' },
        { status: 500 }
      );
    }

    // DEBUG: Verificar el workflowId y el cuerpo de la petición
    console.log('--- Iniciando sesión de ChatKit ---');
    console.log('Workflow ID a utilizar:', workflowId);

    const requestBody = {
      workflow: workflowId,
    };

    console.log('Cuerpo de la petición a OpenAI:', JSON.stringify(requestBody, null, 2));

    // Crear sesión de ChatKit usando la API REST directamente
    const response = await fetch('https://api.openai.com/v1/chatkit/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error de OpenAI:', errorData);
      return NextResponse.json(
        {
          error: errorData.error?.message || 'Error al crear sesión de ChatKit',
          details: errorData
        },
        { status: response.status }
      );
    }

    const session = await response.json();

    return NextResponse.json({
      client_secret: session.client_secret,
    });
  } catch (error: any) {
    console.error('Error al crear sesión de ChatKit:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear sesión' },
      { status: 500 }
    );
  }
}

// Manejar OPTIONS para CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
