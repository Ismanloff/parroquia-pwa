import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for long documents

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Split text into chunks
function splitIntoChunks(text: string, maxChunkSize = 1000): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split('\n\n');
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(chunk => chunk.length > 50); // Filter out very small chunks
}

// Extract text from file
async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    // Dynamic import for pdf-parse (serverless compatible)
    const pdf = (await import('pdf-parse')).default;
    const data = await pdf(buffer);
    return data.text;
  } else if (mimeType === 'text/plain') {
    return buffer.toString('utf-8');
  } else if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    // For now, return placeholder for DOC/DOCX
    // You can add mammoth.js for full DOC support
    return 'Procesamiento de documentos Word pendiente. Por favor usa PDF o TXT.';
  }

  throw new Error('Tipo de archivo no soportado');
}

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin no está configurado' },
        { status: 500 }
      );
    }

    const { documentId } = await req.json();

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId es requerido' },
        { status: 400 }
      );
    }

    // Get document from database
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .select('*, workspaces!inner(pinecone_namespace)')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    // Update status to processing
    await supabaseAdmin
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    try {
      // Download file from storage
      const fileUrl = document.file_url;
      const response = await fetch(fileUrl);

      if (!response.ok) {
        throw new Error('Error al descargar documento');
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Extract text
      const text = await extractText(buffer, document.mime_type);

      if (!text || text.length < 50) {
        throw new Error('No se pudo extraer texto del documento');
      }

      // Split into chunks
      const chunks = splitIntoChunks(text);

      if (chunks.length === 0) {
        throw new Error('No se pudieron crear chunks del documento');
      }

      // Generate embeddings and upload to Pinecone
      const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
      // @ts-ignore - workspaces is properly joined
      const namespace = document.workspaces.pinecone_namespace;

      const vectors = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        // Generate embedding
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: chunk,
        });

        const embedding = embeddingResponse.data[0].embedding;

        // Create vector for Pinecone
        const vectorId = `${documentId}_chunk_${i}`;
        vectors.push({
          id: vectorId,
          values: embedding,
          metadata: {
            document_id: documentId,
            workspace_id: document.workspace_id,
            filename: document.filename,
            chunk_index: i,
            text: chunk.substring(0, 1000), // Store first 1000 chars as metadata
          },
        });

        // Create chunk record in Supabase
        await supabaseAdmin.from('document_chunks').insert({
          document_id: documentId,
          workspace_id: document.workspace_id,
          pinecone_id: vectorId,
          content: chunk,
          chunk_index: i,
          token_count: Math.ceil(chunk.length / 4), // Rough estimate
        });
      }

      // Upload to Pinecone in batches of 100
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await index.namespace(namespace).upsert(batch);
      }

      // Update document status
      await supabaseAdmin
        .from('documents')
        .update({
          status: 'completed',
          chunk_count: chunks.length,
          processed_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      return NextResponse.json(
        {
          success: true,
          message: 'Documento procesado exitosamente',
          chunks: chunks.length,
        },
        { status: 200 }
      );
    } catch (processingError: any) {
      console.error('Error processing document:', processingError);

      // Update document status to error
      await supabaseAdmin
        .from('documents')
        .update({
          status: 'error',
          error_message: processingError.message || 'Error al procesar documento',
        })
        .eq('id', documentId);

      return NextResponse.json(
        { error: processingError.message || 'Error al procesar documento' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in process document endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
