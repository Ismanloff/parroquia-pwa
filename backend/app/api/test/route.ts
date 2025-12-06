import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  const workflowId = process.env.CHATKIT_WORKFLOW_ID;

  return NextResponse.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: {
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET',
      hasWorkflowId: !!workflowId,
      workflowIdPrefix: workflowId ? workflowId.substring(0, 15) + '...' : 'NOT SET',
    },
    nodeVersion: process.version,
  });
}
