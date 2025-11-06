/**
 * File Signature Validator - Magic Number Validation
 *
 * Security: Prevents malicious file uploads by validating actual file content
 * OWASP: A03:2021 - Injection (File Upload Attacks)
 *
 * Validates file signatures (magic numbers) to ensure the file is actually
 * the type it claims to be, preventing attacks like:
 * - Executable files disguised as PDFs
 * - PHP shells disguised as images
 * - Malicious scripts renamed to allowed extensions
 */

/**
 * File signature definitions (magic numbers)
 * Format: [signature bytes, offset from start]
 *
 * References:
 * - https://en.wikipedia.org/wiki/List_of_file_signatures
 * - https://www.garykessler.net/library/file_sigs.html
 */
const FILE_SIGNATURES: Record<string, Array<{ bytes: number[]; offset: number; description?: string }>> = {
  // PDF Files
  'application/pdf': [
    { bytes: [0x25, 0x50, 0x44, 0x46, 0x2d], offset: 0, description: '%PDF-' },
  ],

  // Microsoft Word (.doc)
  'application/msword': [
    { bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], offset: 0, description: 'OLE2 Compound Document' },
  ],

  // Microsoft Word (.docx) - ZIP-based
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    { bytes: [0x50, 0x4b, 0x03, 0x04], offset: 0, description: 'PK (ZIP)' }, // Must also check for word/ in ZIP
  ],

  // Microsoft Excel (.xls)
  'application/vnd.ms-excel': [
    { bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], offset: 0, description: 'OLE2 Compound Document' },
  ],

  // Microsoft Excel (.xlsx) - ZIP-based
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    { bytes: [0x50, 0x4b, 0x03, 0x04], offset: 0, description: 'PK (ZIP)' }, // Must also check for xl/ in ZIP
  ],

  // Plain Text (no magic number, validate content)
  'text/plain': [],

  // Markdown (no magic number, validate content)
  'text/markdown': [],

  // CSV (no magic number, validate content)
  'text/csv': [],

  // JSON (no magic number, validate content)
  'application/json': [],
};

/**
 * Dangerous file signatures to explicitly block
 */
const BLOCKED_SIGNATURES: Array<{ bytes: number[]; offset: number; description: string }> = [
  // Windows Executables
  { bytes: [0x4d, 0x5a], offset: 0, description: 'Windows PE Executable (.exe, .dll)' },

  // Linux/Unix Executables
  { bytes: [0x7f, 0x45, 0x4c, 0x46], offset: 0, description: 'ELF Executable' },

  // Scripts
  { bytes: [0x23, 0x21], offset: 0, description: 'Shell script (#!/)' },

  // PHP
  { bytes: [0x3c, 0x3f, 0x70, 0x68, 0x70], offset: 0, description: '<?php' },

  // Python compiled
  { bytes: [0x03, 0xf3, 0x0d, 0x0a], offset: 0, description: 'Python bytecode (.pyc)' },

  // Java Class
  { bytes: [0xca, 0xfe, 0xba, 0xbe], offset: 0, description: 'Java Class file' },

  // Android APK (is actually a ZIP, but we block)
  { bytes: [0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x08, 0x00, 0x08, 0x00], offset: 0, description: 'Android APK' },
];

/**
 * Check if buffer starts with specific bytes at given offset
 */
function matchesSignature(buffer: Buffer, signature: { bytes: number[]; offset: number }): boolean {
  const { bytes, offset } = signature;

  if (buffer.length < offset + bytes.length) {
    return false;
  }

  for (let i = 0; i < bytes.length; i++) {
    if (buffer[offset + i] !== bytes[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Validate file signature against expected type
 *
 * @param buffer - File content as Buffer
 * @param mimeType - Expected MIME type (from HTTP header)
 * @param filename - Original filename (for additional validation)
 * @returns Validation result with details
 */
export function validateFileSignature(
  buffer: Buffer,
  mimeType: string,
  filename: string
): {
  valid: boolean;
  error?: string;
  detectedType?: string;
  details?: string;
} {
  // 1. Check for blocked signatures first (security)
  for (const blockedSig of BLOCKED_SIGNATURES) {
    if (matchesSignature(buffer, blockedSig)) {
      console.warn('[File Validator] Blocked dangerous file:', {
        filename,
        claimedType: mimeType,
        detectedType: blockedSig.description,
      });

      return {
        valid: false,
        error: `Tipo de archivo bloqueado: ${blockedSig.description}`,
        detectedType: blockedSig.description,
        details: 'Este tipo de archivo representa un riesgo de seguridad y no está permitido.',
      };
    }
  }

  // 2. Get expected signatures for the claimed MIME type
  const expectedSignatures = FILE_SIGNATURES[mimeType];

  if (!expectedSignatures) {
    return {
      valid: false,
      error: `Tipo MIME no soportado: ${mimeType}`,
    };
  }

  // 3. Text-based files (no fixed signature)
  if (expectedSignatures.length === 0) {
    // For text files, validate that content is valid text
    return validateTextFile(buffer, mimeType, filename);
  }

  // 4. Validate against expected signatures
  for (const expectedSig of expectedSignatures) {
    if (matchesSignature(buffer, expectedSig)) {
      // Special handling for Office Open XML formats (.docx, .xlsx)
      if (mimeType.includes('openxmlformats')) {
        // These are ZIP files, need additional validation
        return validateOfficeOpenXML(buffer, mimeType, filename);
      }

      return {
        valid: true,
        detectedType: expectedSig.description,
      };
    }
  }

  // 5. Signature mismatch
  console.warn('[File Validator] Signature mismatch:', {
    filename,
    claimedType: mimeType,
    fileHeader: Array.from(buffer.slice(0, 16))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' '),
  });

  return {
    valid: false,
    error: `El archivo no coincide con el tipo declarado (${mimeType})`,
    details: 'La firma del archivo no corresponde a un archivo válido del tipo indicado.',
  };
}

/**
 * Validate text-based files (no magic number)
 */
function validateTextFile(
  buffer: Buffer,
  mimeType: string,
  filename: string
): {
  valid: boolean;
  error?: string;
  details?: string;
} {
  // Check if buffer looks like text (no null bytes, valid UTF-8)
  const text = buffer.toString('utf8', 0, Math.min(buffer.length, 1024));

  // Check for null bytes (indicator of binary content)
  if (text.includes('\0')) {
    return {
      valid: false,
      error: `El archivo no es un archivo de texto válido`,
      details: 'El archivo contiene caracteres binarios no permitidos.',
    };
  }

  // Validate based on file type
  if (mimeType === 'application/json') {
    try {
      JSON.parse(buffer.toString('utf8'));
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'El archivo no es un JSON válido',
      };
    }
  }

  if (mimeType === 'text/csv') {
    // Basic CSV validation (has commas or tabs, no binary)
    const hasDelimiters = text.includes(',') || text.includes('\t') || text.includes(';');
    if (!hasDelimiters && buffer.length > 100) {
      return {
        valid: false,
        error: 'El archivo no parece ser un CSV válido',
      };
    }
  }

  // For text/plain and text/markdown, any valid UTF-8 text is acceptable
  return { valid: true };
}

/**
 * Validate Office Open XML files (.docx, .xlsx)
 * These are ZIP files containing specific directory structures
 */
function validateOfficeOpenXML(
  buffer: Buffer,
  mimeType: string,
  filename: string
): {
  valid: boolean;
  error?: string;
  details?: string;
} {
  // Check ZIP signature
  if (!matchesSignature(buffer, { bytes: [0x50, 0x4b, 0x03, 0x04], offset: 0 })) {
    return {
      valid: false,
      error: 'El archivo no es un documento Office válido',
      details: 'Archivo ZIP corrupto o inválido.',
    };
  }

  // For more robust validation, we'd need to unzip and check internal structure
  // (e.g., docx must have word/ directory, xlsx must have xl/ directory)
  // This would require a ZIP library. For now, we trust the ZIP signature.

  // Check filename extension as additional validation
  const extension = filename.toLowerCase().split('.').pop();

  if (mimeType.includes('wordprocessingml') && extension !== 'docx') {
    return {
      valid: false,
      error: 'La extensión del archivo no coincide con el tipo (esperado: .docx)',
    };
  }

  if (mimeType.includes('spreadsheetml') && extension !== 'xlsx') {
    return {
      valid: false,
      error: 'La extensión del archivo no coincide con el tipo (esperado: .xlsx)',
    };
  }

  return { valid: true };
}

/**
 * Get file type from signature (for debugging/logging)
 */
export function detectFileType(buffer: Buffer): string | null {
  // Check all known signatures
  for (const [mimeType, signatures] of Object.entries(FILE_SIGNATURES)) {
    for (const sig of signatures) {
      if (matchesSignature(buffer, sig)) {
        return mimeType;
      }
    }
  }

  // Check if it's a blocked type
  for (const blockedSig of BLOCKED_SIGNATURES) {
    if (matchesSignature(buffer, blockedSig)) {
      return `BLOCKED: ${blockedSig.description}`;
    }
  }

  return null;
}

/**
 * Comprehensive file validation (combines MIME type and signature validation)
 */
export function validateUploadedFile(
  buffer: Buffer,
  file: { name: string; type: string; size: number },
  allowedTypes: string[],
  maxSize: number
): {
  valid: boolean;
  error?: string;
  warnings?: string[];
} {
  const warnings: string[] = [];

  // 1. Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Archivo demasiado grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). Máximo: ${(maxSize / (1024 * 1024)).toFixed(1)}MB`,
    };
  }

  // 2. Check MIME type is allowed
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido: ${file.type}`,
    };
  }

  // 3. Validate file signature
  const signatureValidation = validateFileSignature(buffer, file.type, file.name);

  if (!signatureValidation.valid) {
    return {
      valid: false,
      error: signatureValidation.error,
    };
  }

  // 4. Check filename for suspicious patterns
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.dll$/i,
    /\.sh$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.php$/i,
    /\.jsp$/i,
    /\.asp$/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(file.name)) {
      warnings.push(`Nombre de archivo sospechoso: ${file.name}`);
    }
  }

  // 5. Check for double extensions
  const parts = file.name.split('.');
  if (parts.length > 2) {
    warnings.push(`Archivo con múltiples extensiones: ${file.name}`);
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
