import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);

export const vectorService = {
  // Upsert vectors con namespace de workspace
  async upsertVectors(workspaceId: string, vectors: Array<{
    id: string;
    values: number[];
    metadata?: Record<string, any>;
  }>) {
    const namespace = `ws_${workspaceId}`;
    await index.namespace(namespace).upsert(vectors);
  },

  // Query vectors con namespace de workspace
  async queryVectors(workspaceId: string, queryVector: number[], topK: number = 5) {
    const namespace = `ws_${workspaceId}`;
    const results = await index.namespace(namespace).query({
      vector: queryVector,
      topK,
      includeMetadata: true,
    });
    return results.matches || [];
  },

  // Eliminar namespace completo (cuando se elimina workspace)
  async deleteNamespace(workspaceId: string) {
    const namespace = `ws_${workspaceId}`;
    await index.namespace(namespace).deleteAll();
  },
};
