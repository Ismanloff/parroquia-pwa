import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { supabaseAdmin } from '@/app/lib/supabase';
import { resend, FROM_EMAIL } from '@/app/lib/resend';
import { documentProcessedEmailTemplate } from '@/app/lib/email-templates';
import mammoth from 'mammoth';
import { extractText as extractPdfTextUnpdf, getDocumentProxy } from 'unpdf';
import { captureError, addBreadcrumb, startTransaction } from '@/lib/monitoring/sentry';
import { alertSystemError } from '@/lib/alerts/slack';
import { withRateLimit, withTiming, withErrorHandler, RATE_LIMITS } from '@/lib/performance/middleware';

export const runtime = 'nodejs'; // Need Node runtime for file processing
export const maxDuration = 300; // 5 minutes max

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
});

// Initialize Voyage AI
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY || '';

// Text chunking function
function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();

    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    start += chunkSize - overlap;
  }

  return chunks;
}

// Extract text from PDF using unpdf (optimized for serverless)
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // unpdf is designed for serverless and works with Vercel/edge runtimes
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractPdfTextUnpdf(pdf, { mergePages: true });

    if (!text || text.trim().length === 0) {
      throw new Error('No text extracted from PDF');
    }

    return text;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Extract text from buffer based on mime type
async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    if (mimeType === 'application/pdf') {
      // PDF processing with pdf.js
      return await extractPdfText(buffer);
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // DOCX extraction
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } else if (mimeType === 'application/msword') {
      // DOC - try to extract as text
      return buffer.toString('utf-8');
    } else if (mimeType === 'text/plain') {
      // TXT extraction
      return buffer.toString('utf-8');
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw error;
  }
}

// Generate embeddings using Voyage AI
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        input: texts,
        model: 'voyage-3-large',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Voyage AI error: ${error}`);
    }

    const data = await response.json();
    return data.data.map((item: any) => item.embedding);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

async function handlePOST(req: NextRequest) {
  // Parse request body once at the top
  const { documentId, workspaceId } = await req.json();

  // Start transaction for performance monitoring
  const transaction = startTransaction('document-processing', 'task');
  transaction.setAttribute('documentId', documentId);
  transaction.setAttribute('workspaceId', workspaceId);

  try {
    // Validate Supabase admin is configured
    if (!supabaseAdmin) {
      transaction.setStatus({ code: 2, message: 'failed_precondition' }); // UNKNOWN status code
      transaction.end();
      return NextResponse.json(
        { error: 'Supabase admin not configured' },
        { status: 500 }
      );
    }

    console.log(`Processing document ${documentId} for workspace ${workspaceId}`);
    addBreadcrumb('document', 'Started document processing', 'info', {
      documentId,
      workspaceId
    });

    // 1. Get document from Supabase
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('Error fetching document:', docError);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Update status to processing
    await supabaseAdmin
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    // 2. Download file from URL
    console.log('Downloading file from:', document.file_url);
    const fileResponse = await fetch(document.file_url);
    if (!fileResponse.ok) {
      throw new Error('Failed to download file');
    }
    const arrayBuffer = await fileResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Extract text based on file type
    const mimeType = document.mime_type || 'application/octet-stream';
    console.log('Extracting text from file type:', mimeType);
    addBreadcrumb('document', 'Extracting text from document', 'info', { mimeType });

    const text = await extractText(buffer, mimeType);

    if (!text || text.trim().length === 0) {
      throw new Error('No text extracted from document');
    }

    console.log(`Extracted ${text.length} characters of text`);
    addBreadcrumb('document', 'Text extracted successfully', 'info', {
      textLength: text.length
    });

    // 4. Split text into chunks
    const chunks = chunkText(text, 800, 100);
    console.log(`Created ${chunks.length} chunks`);
    addBreadcrumb('document', 'Text chunked', 'info', { chunkCount: chunks.length });

    if (chunks.length === 0) {
      throw new Error('No chunks created from text');
    }

    // 5. Generate embeddings with Voyage AI
    console.log('Generating embeddings...');
    addBreadcrumb('document', 'Generating embeddings', 'info', { chunkCount: chunks.length });
    const embeddings = await generateEmbeddings(chunks);

    // 6. Upsert to Pinecone with workspace namespace
    console.log('Upserting to Pinecone...');
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'saas');

    const vectors = chunks.map((chunk, i) => ({
      id: `${documentId}_chunk_${i}`,
      values: embeddings[i],
      metadata: {
        documentId,
        workspaceId: workspaceId || document.workspace_id,
        chunkIndex: i,
        text: chunk,
        filename: document.filename,
      },
    }));

    await index.namespace(workspaceId || document.workspace_id).upsert(vectors);

    // 7. Save chunks to Supabase
    console.log('Saving chunks to Supabase...');
    const chunkRecords = chunks.map((chunk, i) => ({
      document_id: documentId,
      workspace_id: workspaceId || document.workspace_id,
      pinecone_id: `${documentId}_chunk_${i}`,
      content: chunk,
      chunk_index: i,
      token_count: Math.ceil(chunk.split(/\s+/).length * 1.3), // Rough estimate
    }));

    const { error: chunksError } = await supabaseAdmin
      .from('document_chunks')
      .insert(chunkRecords);

    if (chunksError) {
      console.error('Error saving chunks:', chunksError);
      throw chunksError;
    }

    // 8. Update document status to completed
    await supabaseAdmin
      .from('documents')
      .update({
        status: 'completed',
        chunk_count: chunks.length,
        processed_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    console.log(`Document ${documentId} processed successfully`);
    addBreadcrumb('document', 'Document processing completed', 'info', {
      documentId,
      chunkCount: chunks.length
    });

    // Mark transaction as successful
    transaction.setStatus({ code: 1, message: 'ok' }); // OK status code
    transaction.end();

    // 9. Send notification email to uploader (async, don't block response)
    try {
      if (document.uploaded_by) {
        // Get uploader information from auth.users
        const { data: { user: uploader }, error: uploaderError } = await supabaseAdmin.auth.admin.getUserById(
          document.uploaded_by
        );

        if (uploader && !uploaderError) {
          // Get workspace name
          const { data: workspace } = await supabaseAdmin
            .from('workspaces')
            .select('name')
            .eq('id', workspaceId || document.workspace_id)
            .single();

          const documentsUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/documents?workspace=${workspaceId || document.workspace_id}`;

          const email = uploader.email || '';
          const fullName = uploader.user_metadata?.full_name as string | undefined;
          const userName = fullName || email.split('@')[0] || 'Usuario';

          const emailTemplate = documentProcessedEmailTemplate({
            userName,
            workspaceName: workspace?.name || 'tu workspace',
            filename: document.filename,
            documentsUrl,
          });

          await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
          });

          console.log(`✅ Document processed notification sent to ${email}`);
        }
      }
    } catch (emailError) {
      console.error('Error sending document processed notification:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      chunks: chunks.length,
      message: 'Document processed successfully',
    });
  } catch (error: any) {
    console.error('Error processing document:', error);

    // Mark transaction as failed
    transaction.setStatus({ code: 2, message: 'internal_error' }); // UNKNOWN status code for errors
    transaction.end();

    // Capture error to Sentry
    captureError(error, {
      endpoint: '/api/documents/process',
      method: 'POST',
      workspaceId,
      additionalData: {
        documentId,
        errorMessage: error.message,
        errorStack: error.stack,
      },
    });

    // Send Slack alert for critical errors (production only)
    if (process.env.NODE_ENV === 'production') {
      alertSystemError(error, {
        endpoint: '/api/documents/process',
        documentId,
        workspaceId,
        timestamp: new Date().toISOString(),
      }).catch((alertError) => {
        console.error('Failed to send Slack alert:', alertError);
        // Don't fail the request if alert fails
      });
    }

    // Update document status to error
    if (documentId && supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('documents')
          .update({
            status: 'error',
            error_message: error.message || 'Processing failed',
          })
          .eq('id', documentId);
      } catch (updateError) {
        console.error('Could not update document status:', updateError);
        captureError(updateError, {
          endpoint: '/api/documents/process',
          method: 'POST',
          workspaceId,
          additionalData: {
            documentId,
            context: 'Failed to update document error status',
          },
        });
      }
    }

    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting and timing middleware
export async function POST(req: NextRequest) {
  return withRateLimit(
    req,
    RATE_LIMITS.DOCUMENTS,
    withTiming(() => withErrorHandler(() => handlePOST(req), {
      endpoint: '/api/documents/process',
      method: 'POST',
    }))
  );
}
