import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pc.index('parroquias');

async function main() {
  // Ver metadata de PDF (n8n)
  const pdfResults = await index.query({
    vector: Array(3072).fill(0),
    topK: 2,
    includeMetadata: true,
    filter: { file_name: 'SOLICITUD DE BAUTISMO.pdf' }
  });

  console.log('\n📄 METADATA DE PDFs (n8n - FUNCIONA):');
  console.log('=====================================\n');
  if (pdfResults.matches[0]) {
    console.log(JSON.stringify(pdfResults.matches[0].metadata, null, 2));
  }

  // Ver metadata de MD (nuestro)
  const mdResults = await index.query({
    vector: Array(3072).fill(0),
    topK: 2,
    includeMetadata: true,
    filter: { file_name: 'actividades_parroquiales.md' }
  });

  console.log('\n\n📄 METADATA DE actividades_parroquiales.md (nuestro - NO FUNCIONA):');
  console.log('====================================================================\n');
  if (mdResults.matches[0]) {
    console.log(JSON.stringify(mdResults.matches[0].metadata, null, 2));
  }
}

main();
