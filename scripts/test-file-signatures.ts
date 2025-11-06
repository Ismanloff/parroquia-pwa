/**
 * Test script for file signature validation
 *
 * Usage:
 *   npx tsx scripts/test-file-signatures.ts
 */

import { validateFileSignature, detectFileType } from '../lib/security/file-validator';
import { Buffer } from 'buffer';

console.log('🔒 Testing File Signature Validation\n');

// Test 1: Valid PDF
console.log('1. Testing valid PDF signature...');
const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
const pdfResult = validateFileSignature(pdfBuffer, 'application/pdf', 'document.pdf');
console.log(`   Result: ${pdfResult.valid ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Detected: ${pdfResult.detectedType || 'None'}`);
if (pdfResult.error) console.log(`   Error: ${pdfResult.error}\n`);
else console.log('');

// Test 2: Fake PDF (actually an EXE)
console.log('2. Testing fake PDF (Windows EXE)...');
const fakePdfBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00]); // MZ (Windows EXE header)
const fakePdfResult = validateFileSignature(fakePdfBuffer, 'application/pdf', 'malicious.pdf');
console.log(`   Result: ${fakePdfResult.valid ? '✅ PASS (SHOULD FAIL!)' : '❌ BLOCKED (CORRECT)'}`);
console.log(`   Error: ${fakePdfResult.error || 'None'}`);
console.log(`   Detected: ${fakePdfResult.detectedType || 'None'}\n`);

// Test 3: Windows EXE disguised as PDF
console.log('3. Testing Windows EXE disguised as PDF...');
const exeBuffer = Buffer.from([0x4d, 0x5a]); // MZ
const exeResult = validateFileSignature(exeBuffer, 'application/pdf', 'virus.pdf');
console.log(`   Result: ${exeResult.valid ? '❌ PASS (SHOULD FAIL!)' : '✅ BLOCKED (CORRECT)'}`);
console.log(`   Error: ${exeResult.error || 'None'}`);
console.log(`   Detected: ${exeResult.detectedType || 'None'}\n`);

// Test 4: Valid plain text file
console.log('4. Testing valid plain text file...');
const textBuffer = Buffer.from('Hello, this is a test document.\nLine 2\nLine 3');
const textResult = validateFileSignature(textBuffer, 'text/plain', 'readme.txt');
console.log(`   Result: ${textResult.valid ? '✅ PASS' : '❌ FAIL'}`);
if (textResult.error) console.log(`   Error: ${textResult.error}\n`);
else console.log('');

// Test 5: Text file with null bytes (binary disguised as text)
console.log('5. Testing binary file disguised as text...');
const binaryTextBuffer = Buffer.from('Hello\x00World\x00Binary\x00Data');
const binaryTextResult = validateFileSignature(binaryTextBuffer, 'text/plain', 'malicious.txt');
console.log(`   Result: ${binaryTextResult.valid ? '❌ PASS (SHOULD FAIL!)' : '✅ BLOCKED (CORRECT)'}`);
console.log(`   Error: ${binaryTextResult.error || 'None'}\n`);

// Test 6: Valid JSON file
console.log('6. Testing valid JSON file...');
const jsonBuffer = Buffer.from('{"name": "test", "value": 123}');
const jsonResult = validateFileSignature(jsonBuffer, 'application/json', 'data.json');
console.log(`   Result: ${jsonResult.valid ? '✅ PASS' : '❌ FAIL'}`);
if (jsonResult.error) console.log(`   Error: ${jsonResult.error}\n`);
else console.log('');

// Test 7: Invalid JSON file
console.log('7. Testing invalid JSON file...');
const invalidJsonBuffer = Buffer.from('{"name": "test", invalid json');
const invalidJsonResult = validateFileSignature(invalidJsonBuffer, 'application/json', 'data.json');
console.log(`   Result: ${invalidJsonResult.valid ? '❌ PASS (SHOULD FAIL!)' : '✅ BLOCKED (CORRECT)'}`);
console.log(`   Error: ${invalidJsonResult.error || 'None'}\n`);

// Test 8: PHP shell disguised as text
console.log('8. Testing PHP shell disguised as text...');
const phpBuffer = Buffer.from('<?php system($_GET["cmd"]); ?>');
const phpResult = validateFileSignature(phpBuffer, 'text/plain', 'shell.txt');
console.log(`   Result: ${phpResult.valid ? '❌ PASS (SHOULD FAIL!)' : '✅ BLOCKED (CORRECT)'}`);
console.log(`   Error: ${phpResult.error || 'None'}`);
console.log(`   Detected: ${phpResult.detectedType || 'None'}\n`);

// Test 9: Detect file type helper
console.log('9. Testing detectFileType helper...');
console.log(`   PDF: ${detectFileType(pdfBuffer)}`);
console.log(`   EXE: ${detectFileType(exeBuffer)}`);
console.log(`   PHP: ${detectFileType(phpBuffer)}`);
console.log(`   Unknown: ${detectFileType(Buffer.from([0xff, 0xff, 0xff]))}\n`);

// Test 10: Office document (.docx - ZIP based)
console.log('10. Testing Office Open XML (.docx)...');
const docxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]); // PK (ZIP)
const docxResult = validateFileSignature(
  docxBuffer,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'document.docx'
);
console.log(`   Result: ${docxResult.valid ? '✅ PASS' : '❌ FAIL'}`);
if (docxResult.error) console.log(`   Error: ${docxResult.error}\n`);
else console.log('');

// Summary
console.log('═══════════════════════════════════════');
console.log('📊 Test Summary');
console.log('═══════════════════════════════════════');
console.log('✅ Valid files should PASS');
console.log('❌ Malicious files should be BLOCKED');
console.log('');
console.log('Expected results:');
console.log('  1. Valid PDF → ✅ PASS');
console.log('  2. Fake PDF (EXE) → ❌ BLOCKED');
console.log('  3. EXE as PDF → ❌ BLOCKED');
console.log('  4. Valid text → ✅ PASS');
console.log('  5. Binary as text → ❌ BLOCKED');
console.log('  6. Valid JSON → ✅ PASS');
console.log('  7. Invalid JSON → ❌ BLOCKED');
console.log('  8. PHP shell as text → ❌ BLOCKED');
console.log('  9. Detect types → Shows correct types');
console.log(' 10. Valid .docx → ✅ PASS');
