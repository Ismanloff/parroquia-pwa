/**
 * API Authentication Helpers
 *
 * Provides authentication and authorization utilities for API routes.
 * All protected endpoints should use these helpers to ensure consistent
 * security across the application.
 *
 * @see /app/api/documents/upload/route.ts for example usage
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthenticatedRequest {
  user: User;
  token: string;
}

export interface AuthenticatedRequestWithWorkspace extends AuthenticatedRequest {
  workspaceId: string;
  membership: {
    role: string;
    workspace_id: string;
    user_id: string;
  };
}

/**
 * Extract and validate JWT token from Authorization header
 *
 * @param req - Next.js request object
 * @returns Authenticated user or null if invalid
 */
export async function authenticateRequest(
  req: NextRequest
): Promise<{ user: User; token: string } | null> {
  if (!supabaseAdmin) {
    console.error('[auth] Supabase admin not configured');
    return null;
  }

  // Get authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  // Extract token
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return null;
  }

  try {
    // Validate token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.warn('[auth] Invalid token:', error?.message);
      return null;
    }

    return { user, token };
  } catch (error) {
    console.error('[auth] Authentication error:', error);
    return null;
  }
}

/**
 * Verify user has access to a specific workspace
 *
 * @param userId - User ID to check
 * @param workspaceId - Workspace ID to verify access
 * @returns Workspace membership or null if no access
 */
export async function verifyWorkspaceAccess(
  userId: string,
  workspaceId: string
): Promise<{ role: string; workspace_id: string; user_id: string } | null> {
  if (!supabaseAdmin) {
    console.error('[auth] Supabase admin not configured');
    return null;
  }

  try {
    const { data: membership, error } = await supabaseAdmin
      .from('workspace_members')
      .select('role, workspace_id, user_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (error || !membership) {
      console.warn('[auth] No workspace access:', { userId, workspaceId, error: error?.message });
      return null;
    }

    return membership;
  } catch (error) {
    console.error('[auth] Workspace verification error:', error);
    return null;
  }
}

/**
 * Middleware wrapper that requires authentication
 *
 * Usage:
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   return withAuth(req, async ({ user, token }) => {
 *     // Your authenticated logic here
 *     return NextResponse.json({ user_id: user.id });
 *   });
 * }
 * ```
 */
export async function withAuth(
  req: NextRequest,
  handler: (auth: AuthenticatedRequest) => Promise<Response | NextResponse>
): Promise<Response | NextResponse> {
  const auth = await authenticateRequest(req);

  if (!auth) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Valid authentication token required',
      },
      { status: 401 }
    );
  }

  return handler(auth);
}

/**
 * Middleware wrapper that requires authentication AND workspace access
 *
 * Usage:
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   return withWorkspaceAuth(req, async ({ user, token, workspaceId, membership }) => {
 *     // Your authenticated + workspace-verified logic here
 *     return NextResponse.json({ workspace_id: workspaceId, role: membership.role });
 *   });
 * }
 * ```
 */
export async function withWorkspaceAuth(
  req: NextRequest,
  handler: (auth: AuthenticatedRequestWithWorkspace) => Promise<Response | NextResponse>,
  options?: {
    /**
     * Extract workspace ID from request body (default)
     * or from query params
     */
    workspaceIdSource?: 'body' | 'query' | 'params';
    /**
     * Custom workspace ID extractor
     */
    getWorkspaceId?: (req: NextRequest) => Promise<string | null>;
  }
): Promise<Response | NextResponse> {
  // 1. Authenticate user
  const auth = await authenticateRequest(req);

  if (!auth) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Valid authentication token required',
      },
      { status: 401 }
    );
  }

  // 2. Extract workspace ID
  let workspaceId: string | null = null;

  if (options?.getWorkspaceId) {
    workspaceId = await options.getWorkspaceId(req);
  } else {
    const source = options?.workspaceIdSource || 'body';

    if (source === 'body') {
      try {
        const body = await req.json();
        workspaceId = body.workspaceId || body.workspace_id;
      } catch {
        // If JSON parsing fails, try formData
        try {
          const formData = await req.formData();
          workspaceId = formData.get('workspaceId') as string || formData.get('workspace_id') as string;
        } catch {
          workspaceId = null;
        }
      }
    } else if (source === 'query') {
      const url = new URL(req.url);
      workspaceId = url.searchParams.get('workspaceId') || url.searchParams.get('workspace_id');
    }
  }

  if (!workspaceId) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: 'workspace_id is required',
      },
      { status: 400 }
    );
  }

  // 3. Verify workspace access
  const membership = await verifyWorkspaceAccess(auth.user.id, workspaceId);

  if (!membership) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'You do not have access to this workspace',
      },
      { status: 403 }
    );
  }

  // 4. Execute handler with authenticated + workspace context
  return handler({
    ...auth,
    workspaceId,
    membership,
  });
}

/**
 * Check if user has admin/owner role in workspace
 */
export function isWorkspaceAdmin(role: string): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Require admin access for a workspace operation
 */
export function requireAdmin(
  role: string,
  errorMessage = 'Admin access required'
): Response | null {
  if (!isWorkspaceAdmin(role)) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: errorMessage,
      },
      { status: 403 }
    );
  }
  return null;
}
