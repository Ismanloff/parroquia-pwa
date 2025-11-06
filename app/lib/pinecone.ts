/**
 * Pinecone Vector Database Client
 *
 * Real implementation using @pinecone-database/pinecone SDK.
 * Provides vector storage and retrieval for document embeddings with namespace-based multi-tenancy.
 *
 * @module app/lib/pinecone
 */

import { Pinecone, Index, RecordMetadata } from '@pinecone-database/pinecone';

/**
 * Pinecone client singleton
 * Initialized lazily on first use
 */
let pineconeClient: Pinecone | null = null;

/**
 * Index cache to avoid repeated initialization
 */
const indexCache = new Map<string, Index<RecordMetadata>>();

/**
 * Initialize Pinecone client (lazy initialization)
 *
 * @throws Error if PINECONE_API_KEY is not configured
 * @returns Pinecone client instance
 */
function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;

    if (!apiKey) {
      throw new Error(
        'PINECONE_API_KEY is not configured. Please set it in your environment variables.'
      );
    }

    pineconeClient = new Pinecone({
      apiKey,
    });

    console.log('✅ Pinecone client initialized');
  }

  return pineconeClient;
}

/**
 * Get or create cached index instance
 *
 * @param indexName - Name of the Pinecone index
 * @returns Index instance
 */
function getCachedIndex(indexName: string): Index<RecordMetadata> {
  if (!indexCache.has(indexName)) {
    const client = getPineconeClient();
    const index = client.index<RecordMetadata>(indexName);
    indexCache.set(indexName, index);
    console.log(`📦 Connected to Pinecone index: ${indexName}`);
  }

  return indexCache.get(indexName)!;
}

/**
 * Pinecone client with namespace-based multi-tenancy support
 *
 * Usage:
 * ```typescript
 * import { pinecone } from '@/app/lib/pinecone';
 *
 * // Get index and namespace
 * const index = pinecone.index('saas');
 * const ns = index.namespace('saas_tenant_workspace123');
 *
 * // Delete all vectors in namespace
 * await ns.deleteAll();
 *
 * // Delete vectors by metadata filter
 * await ns.deleteMany({ created_by: 'user123' });
 * ```
 */
export const pinecone = {
  /**
   * Get a Pinecone index
   *
   * @param indexName - Name of the index (e.g., 'saas')
   * @returns Index object with namespace operations
   */
  index(indexName: string) {
    const indexInstance = getCachedIndex(indexName);

    return {
      /**
       * Get a namespace within the index
       *
       * Namespaces provide logical isolation for multi-tenant architectures.
       * Format: `saas_tenant_${workspaceId}`
       *
       * @param namespace - Namespace name (e.g., 'saas_tenant_workspace123')
       * @returns Namespace object with vector operations
       */
      namespace(namespace: string) {
        const ns = indexInstance.namespace(namespace);

        return {
          /**
           * Delete all vectors in the namespace
           *
           * This is a complete wipe of the namespace. Use with caution.
           * Common use case: GDPR right to deletion (workspace-level)
           *
           * @throws Error if deletion fails
           */
          async deleteAll(): Promise<void> {
            try {
              console.log(`🗑️  Deleting all vectors in namespace: ${namespace}`);

              // Pinecone SDK: deleteAll() clears all vectors in the namespace
              await ns.deleteAll();

              console.log(`✅ Successfully deleted all vectors in namespace: ${namespace}`);
            } catch (error: any) {
              // 404 errors mean namespace doesn't exist or is empty - this is OK
              if (error.name === 'PineconeNotFoundError' || error.status === 404) {
                console.log(`ℹ️  Namespace ${namespace} is already empty or doesn't exist`);
                return;
              }

              console.error(`❌ Failed to delete namespace ${namespace}:`, error);
              throw new Error(
                `Pinecone deleteAll failed for namespace "${namespace}": ${error.message}`
              );
            }
          },

          /**
           * Delete vectors matching metadata filter
           *
           * Uses Pinecone's metadata filtering to selectively delete vectors.
           * Common use case: GDPR right to deletion (user-level)
           *
           * @param filter - Metadata filter (e.g., { created_by: 'user123' })
           * @throws Error if deletion fails
           *
           * @example
           * // Delete all vectors created by a specific user
           * await ns.deleteMany({ created_by: 'user_abc123' });
           *
           * @example
           * // Delete vectors for a specific document
           * await ns.deleteMany({ documentId: 'doc_xyz789' });
           */
          async deleteMany(filter: Record<string, any>): Promise<void> {
            try {
              console.log(
                `🗑️  Deleting vectors in namespace ${namespace} with filter:`,
                JSON.stringify(filter)
              );

              // Pinecone SDK: deleteMany() with metadata filter
              await ns.deleteMany(filter);

              console.log(
                `✅ Successfully deleted vectors in namespace ${namespace} matching filter:`,
                JSON.stringify(filter)
              );
            } catch (error: any) {
              // 404 errors mean namespace doesn't exist or no vectors match - this is OK
              if (error.name === 'PineconeNotFoundError' || error.status === 404) {
                console.log(
                  `ℹ️  No vectors found in namespace ${namespace} matching filter:`,
                  JSON.stringify(filter)
                );
                return;
              }

              console.error(
                `❌ Failed to delete vectors in namespace ${namespace} with filter:`,
                error
              );
              throw new Error(
                `Pinecone deleteMany failed for namespace "${namespace}": ${error.message}`
              );
            }
          },

          /**
           * Get raw namespace instance (for advanced operations)
           *
           * Use this for operations not covered by the wrapper:
           * - Upserting vectors
           * - Querying vectors
           * - Fetching vectors
           *
           * @returns Raw Pinecone namespace instance
           */
          _raw: ns,
        };
      },

      /**
       * Get raw Pinecone index instance (for advanced operations)
       *
       * Use this for operations not covered by the wrapper API:
       * - Getting index statistics
       * - Listing vectors
       *
       * @returns Raw Pinecone Index instance
       */
      _raw: indexInstance,
    };
  },

  /**
   * Delete all vectors in a namespace (legacy method)
   *
   * @deprecated Use `index(name).namespace(ns).deleteAll()` instead
   * @param namespace - Pinecone namespace to delete
   */
  async deleteNamespace(namespace: string): Promise<void> {
    const indexName = process.env.PINECONE_INDEX_NAME || 'saas';
    console.warn(
      `⚠️  Using deprecated deleteNamespace(). Use index('${indexName}').namespace('${namespace}').deleteAll() instead.`
    );
    await this.index(indexName).namespace(namespace).deleteAll();
  },

  /**
   * Delete specific vectors by IDs (legacy method)
   *
   * @deprecated Use `index(name).namespace(ns)._raw.deleteMany()` instead
   * @param namespace - Pinecone namespace
   * @param ids - Vector IDs to delete
   */
  async deleteVectors(namespace: string, ids: string[]): Promise<void> {
    const indexName = process.env.PINECONE_INDEX_NAME || 'saas';
    console.warn(
      `⚠️  Using deprecated deleteVectors(). Use index('${indexName}').namespace('${namespace}')._raw.deleteMany() instead.`
    );

    try {
      console.log(
        `🗑️  Deleting ${ids.length} vectors from namespace: ${namespace}`
      );

      const ns = this.index(indexName).namespace(namespace)._raw;

      // Pinecone SDK: deleteMany() can accept an array of IDs
      await ns.deleteMany(ids);

      console.log(
        `✅ Successfully deleted ${ids.length} vectors from namespace: ${namespace}`
      );
    } catch (error: any) {
      // 404 errors mean namespace doesn't exist or vectors don't exist - this is OK
      if (error.name === 'PineconeNotFoundError' || error.status === 404) {
        console.log(
          `ℹ️  Vectors not found in namespace ${namespace} (may already be deleted)`
        );
        return;
      }

      console.error(
        `❌ Failed to delete vectors from namespace ${namespace}:`,
        error
      );
      throw new Error(
        `Pinecone deleteVectors failed for namespace "${namespace}": ${error.message}`
      );
    }
  },

  /**
   * Get raw Pinecone client instance (for advanced operations)
   *
   * Use this for operations not covered by the wrapper API:
   * - Creating/deleting indexes
   * - Listing indexes
   * - Managing collections
   *
   * @returns Raw Pinecone client instance
   */
  get _client(): Pinecone {
    return getPineconeClient();
  },
};

export default pinecone;
