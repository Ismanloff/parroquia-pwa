/**
 * CORS Validator - Secure origin validation for widget API
 *
 * Security: Prevents unauthorized domains from using the widget endpoint
 * OWASP: A01:2021 - Broken Access Control
 */

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Default allowed origins (fallback)
 */
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://resply.vercel.app',
  'https://resply-dnlpb3tk1-chatbot-parros-projects.vercel.app',
];

/**
 * Validate if origin is allowed for a specific workspace
 */
export async function validateOrigin(
  origin: string | null,
  workspaceId: string
): Promise<{ allowed: boolean; allowedOrigin: string | null }> {
  if (!origin) {
    return { allowed: false, allowedOrigin: null };
  }

  try {
    // Normalize origin (remove trailing slash)
    const normalizedOrigin = origin.replace(/\/$/, '');

    // 1. Check default allowed origins (dev/staging)
    if (DEFAULT_ALLOWED_ORIGINS.includes(normalizedOrigin)) {
      return { allowed: true, allowedOrigin: normalizedOrigin };
    }

    // 2. Check workspace-specific allowed domains from database
    const { data: workspace, error } = await supabaseAdmin
      .from('workspaces')
      .select('allowed_domains')
      .eq('id', workspaceId)
      .single();

    if (error || !workspace) {
      console.error('[CORS] Workspace not found:', workspaceId);
      return { allowed: false, allowedOrigin: null };
    }

    // allowed_domains is JSONB array: ["https://example.com", "https://app.example.com"]
    const allowedDomains = (workspace.allowed_domains as string[]) || [];

    // Check if origin matches any allowed domain
    const isAllowed = allowedDomains.some((domain) => {
      const normalizedDomain = domain.replace(/\/$/, '');
      return normalizedOrigin === normalizedDomain;
    });

    if (isAllowed) {
      return { allowed: true, allowedOrigin: normalizedOrigin };
    }

    // 3. Check wildcard subdomains (e.g., *.example.com)
    const wildcardMatch = allowedDomains.some((domain) => {
      if (domain.startsWith('*.')) {
        const baseDomain = domain.substring(2); // Remove "*."
        const originDomain = new URL(normalizedOrigin).hostname;
        return originDomain.endsWith(baseDomain);
      }
      return false;
    });

    if (wildcardMatch) {
      return { allowed: true, allowedOrigin: normalizedOrigin };
    }

    // Origin not allowed
    console.warn('[CORS] Origin not allowed:', {
      origin: normalizedOrigin,
      workspaceId,
      allowedDomains,
    });

    return { allowed: false, allowedOrigin: null };
  } catch (error) {
    console.error('[CORS] Error validating origin:', error);
    return { allowed: false, allowedOrigin: null };
  }
}

/**
 * Get secure CORS headers for a validated origin
 */
export function getCorsHeaders(allowedOrigin: string | null): Record<string, string> {
  if (!allowedOrigin) {
    // If no origin allowed, return restrictive headers
    return {
      'Access-Control-Allow-Origin': 'null',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Workspace-ID',
      'Access-Control-Max-Age': '86400',
    };
  }

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Workspace-ID',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Validate origin and return CORS headers
 * Use this function at the start of widget endpoint handlers
 */
export async function validateAndGetCorsHeaders(
  request: Request,
  workspaceId: string
): Promise<{ headers: Record<string, string>; allowed: boolean }> {
  const origin = request.headers.get('origin');
  const { allowed, allowedOrigin } = await validateOrigin(origin, workspaceId);

  return {
    headers: getCorsHeaders(allowedOrigin),
    allowed,
  };
}
