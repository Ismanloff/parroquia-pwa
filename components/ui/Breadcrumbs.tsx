/**
 * Breadcrumbs Navigation Component
 * Auto-detects current route and builds hierarchical navigation
 *
 * Features:
 * - Automatic path detection from Next.js router
 * - Dark mode support
 * - Mobile responsive (collapses on small screens)
 * - Analytics tracking on clicks
 * - Customizable labels and icons
 *
 * Usage:
 * <Breadcrumbs />
 * <Breadcrumbs customLabels={{ analytics: 'Análisis' }} />
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, ChevronRight } from 'lucide-react';
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics';

interface BreadcrumbsProps {
  /**
   * Custom labels for specific paths
   * Example: { analytics: 'Análisis', settings: 'Configuración' }
   */
  customLabels?: Record<string, string>;

  /**
   * Maximum number of breadcrumbs to show on mobile
   * Default: 2 (home + current)
   */
  mobileMaxItems?: number;

  /**
   * Show home icon instead of text
   * Default: true
   */
  showHomeIcon?: boolean;
}

/**
 * Default Spanish labels for common dashboard paths
 */
const DEFAULT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  conversations: 'Conversaciones',
  documents: 'Documentos',
  analytics: 'Analíticas',
  settings: 'Configuración',
  workspaces: 'Espacios de Trabajo',
  'api-keys': 'Claves API',
  security: 'Seguridad',
  notifications: 'Notificaciones',
  billing: 'Facturación',
  team: 'Equipo',
  integrations: 'Integraciones',
};

/**
 * Converts path segment to readable label
 * Example: 'api-keys' → 'Claves API'
 */
function pathToLabel(segment: string, customLabels?: Record<string, string>): string {
  // Check custom labels first
  if (customLabels?.[segment]) {
    return customLabels[segment];
  }

  // Check default labels
  if (DEFAULT_LABELS[segment]) {
    return DEFAULT_LABELS[segment];
  }

  // Fallback: capitalize and replace hyphens with spaces
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function Breadcrumbs({
  customLabels,
  mobileMaxItems = 2,
  showHomeIcon = true,
}: BreadcrumbsProps = {}) {
  const pathname = usePathname();

  // Parse pathname into segments
  // Example: /dashboard/analytics → ['dashboard', 'analytics']
  const segments = pathname
    .split('/')
    .filter((segment) => segment !== '' && segment !== 'dashboard');

  // Build breadcrumb items
  const breadcrumbs = [
    {
      label: 'Home',
      href: '/dashboard',
      isHome: true,
    },
    ...segments.map((segment, index) => {
      const href = `/dashboard/${segments.slice(0, index + 1).join('/')}`;
      return {
        label: pathToLabel(segment, customLabels),
        href,
        isHome: false,
      };
    }),
  ];

  // If we're at /dashboard root, don't show breadcrumbs
  if (breadcrumbs.length === 1) {
    return null;
  }

  // For mobile: show only home + current (or custom count)
  const mobileBreadcrumbs =
    breadcrumbs.length > mobileMaxItems
      ? [breadcrumbs[0]!, breadcrumbs[breadcrumbs.length - 1]!]
      : breadcrumbs;

  const handleBreadcrumbClick = (label: string, href: string) => {
    trackEvent(ANALYTICS_EVENTS.NAVIGATION_USED, {
      type: 'breadcrumb',
      from: pathname,
      to: href,
      label,
    });
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-6 px-1"
    >
      {/* Desktop: Show all breadcrumbs */}
      <ol className="hidden sm:flex items-center space-x-2 text-sm">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={crumb.href} className="flex items-center">
              {/* Separator */}
              {index > 0 && (
                <ChevronRight
                  className="w-4 h-4 mx-2 text-slate-400 dark:text-slate-500"
                  aria-hidden="true"
                />
              )}

              {/* Breadcrumb Link */}
              {isLast ? (
                // Current page: not a link
                <span
                  className="font-medium text-slate-900 dark:text-white"
                  aria-current="page"
                >
                  {crumb.isHome && showHomeIcon ? (
                    <Home className="w-4 h-4" aria-label="Home" />
                  ) : (
                    crumb.label
                  )}
                </span>
              ) : (
                // Previous pages: clickable links
                <Link
                  href={crumb.href}
                  onClick={() => handleBreadcrumbClick(crumb.label, crumb.href)}
                  className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {crumb.isHome && showHomeIcon ? (
                    <Home className="w-4 h-4" aria-label="Home" />
                  ) : (
                    crumb.label
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile: Show condensed version */}
      <ol className="flex sm:hidden items-center space-x-2 text-sm">
        {mobileBreadcrumbs.map((crumb, index) => {
          const isLast = index === mobileBreadcrumbs.length - 1;

          return (
            <li key={crumb.href} className="flex items-center">
              {/* Separator */}
              {index > 0 && (
                <>
                  {mobileBreadcrumbs.length < breadcrumbs.length && index === 1 ? (
                    // Show ellipsis when items are hidden
                    <span className="mx-2 text-slate-400 dark:text-slate-500">...</span>
                  ) : (
                    <ChevronRight
                      className="w-4 h-4 mx-2 text-slate-400 dark:text-slate-500"
                      aria-hidden="true"
                    />
                  )}
                </>
              )}

              {/* Breadcrumb Link */}
              {isLast ? (
                <span
                  className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]"
                  aria-current="page"
                >
                  {crumb.isHome && showHomeIcon ? (
                    <Home className="w-4 h-4" aria-label="Home" />
                  ) : (
                    crumb.label
                  )}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  onClick={() => handleBreadcrumbClick(crumb.label, crumb.href)}
                  className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {crumb.isHome && showHomeIcon ? (
                    <Home className="w-4 h-4" aria-label="Home" />
                  ) : (
                    <span className="truncate max-w-[100px]">{crumb.label}</span>
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Helper: Custom Breadcrumbs with override
 * Use when you want to manually specify breadcrumb items
 */
interface CustomBreadcrumbItem {
  label: string;
  href: string;
}

interface CustomBreadcrumbsProps {
  items: CustomBreadcrumbItem[];
  showHomeIcon?: boolean;
}

export function CustomBreadcrumbs({ items, showHomeIcon = true }: CustomBreadcrumbsProps) {
  const pathname = usePathname();

  const breadcrumbs = [
    {
      label: 'Home',
      href: '/dashboard',
      isHome: true,
    },
    ...items.map((item) => ({
      ...item,
      isHome: false,
    })),
  ];

  const handleBreadcrumbClick = (label: string, href: string) => {
    trackEvent(ANALYTICS_EVENTS.NAVIGATION_USED, {
      type: 'breadcrumb',
      from: pathname,
      to: href,
      label,
    });
  };

  return (
    <nav aria-label="Breadcrumb" className="mb-6 px-1">
      <ol className="flex items-center space-x-2 text-sm flex-wrap">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={crumb.href} className="flex items-center">
              {index > 0 && (
                <ChevronRight
                  className="w-4 h-4 mx-2 text-slate-400 dark:text-slate-500"
                  aria-hidden="true"
                />
              )}

              {isLast ? (
                <span
                  className="font-medium text-slate-900 dark:text-white"
                  aria-current="page"
                >
                  {crumb.isHome && showHomeIcon ? (
                    <Home className="w-4 h-4" aria-label="Home" />
                  ) : (
                    crumb.label
                  )}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  onClick={() => handleBreadcrumbClick(crumb.label, crumb.href)}
                  className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {crumb.isHome && showHomeIcon ? (
                    <Home className="w-4 h-4" aria-label="Home" />
                  ) : (
                    crumb.label
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
