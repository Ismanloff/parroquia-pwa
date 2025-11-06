/**
 * Cleanup script for orphaned files in Supabase Storage
 *
 * This script removes files from storage that don't have corresponding
 * document records in the database.
 *
 * Run with: npx tsx scripts/cleanup-orphaned-storage.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function cleanupOrphanedFiles() {
  console.log('🔍 Finding orphaned files in storage...\n');

  // 1. Get all files from storage
  const { data: files, error: storageError } = await supabase.storage
    .from('documents')
    .list('', {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (storageError) {
    console.error('Error listing storage files:', storageError);
    process.exit(1);
  }

  console.log(`Found ${files.length} files in storage\n`);

  // 2. Get all documents from database
  const { data: documents, error: dbError } = await supabase
    .from('documents')
    .select('id, filename, file_url');

  if (dbError) {
    console.error('Error fetching documents:', dbError);
    process.exit(1);
  }

  console.log(`Found ${documents.length} documents in database\n`);

  // 3. Find orphaned files (files without matching documents)
  const orphanedFiles: string[] = [];

  for (const file of files) {
    // Check if any document references this file
    const hasDocument = documents.some((doc) =>
      doc.file_url?.includes(file.name)
    );

    if (!hasDocument) {
      orphanedFiles.push(file.name);
    }
  }

  console.log(`Found ${orphanedFiles.length} orphaned files:\n`);
  orphanedFiles.forEach((file) => console.log(`  - ${file}`));

  if (orphanedFiles.length === 0) {
    console.log('\n✅ No orphaned files found!');
    process.exit(0);
  }

  // 4. Ask for confirmation before deleting
  console.log(
    '\n⚠️  WARNING: This will permanently delete these files from storage!'
  );
  console.log(
    'Press Ctrl+C to cancel, or wait 5 seconds to proceed with deletion...\n'
  );

  await new Promise((resolve) => setTimeout(resolve, 5000));

  // 5. Delete orphaned files
  console.log('🗑️  Deleting orphaned files...\n');

  for (const file of orphanedFiles) {
    console.log(`Deleting: ${file}`);
    const { error } = await supabase.storage.from('documents').remove([file]);

    if (error) {
      console.error(`  ❌ Error deleting ${file}:`, error.message);
    } else {
      console.log(`  ✅ Deleted successfully`);
    }
  }

  console.log('\n✅ Cleanup complete!');
}

cleanupOrphanedFiles().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
