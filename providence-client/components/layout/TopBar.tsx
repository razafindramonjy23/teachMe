'use client'

/**
 * Bandeau supérieur : fil d'Ariane, recherche, thème, série, compte.
 *
 * Il ne porte aucune navigation propre — tout passe par la barre latérale.
 * Son rôle est de dire où l'on est et de donner les deux actions globales :
 * chercher et changer de thème.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Search, Bookmark } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useAuth } from '@/lib/auth'
import { useParcours } from '@/lib/use-parcours'
import { LEVELS, COURSES } from '@/lib/catalog'

type Crumb = { label: string; href?: string }

const STATIC_LABELS: Record<string, string> = {
  '/dashboard': 'Accueil',
  '/dashboard/levels': 'Catalogue',
  '/dashboard/stats': 'Statistiques',
  '/dashboard/tampons': 'Carnet de tampons',
  '/dashboard/rules': 'Règles',
  '/dashboard/contact': 'Aide et contact',
  '/dashboard/admin': 'Administration',
  '/dashboard/admin/utilisateurs': 'Utilisateurs',
  '/dashboard/admin/import': 'Import en lot',
  '/dashboard/admin/suivi': 'Suivi',
  '/dashboard/admin/organisations': 'Organisations',
  '/dashboard/admin/journal': 'Journal',
}

/** Fil d'Ariane déduit du chemin. */
export function breadcrumbFor(pathname: string): Crumb[] {
  const root: Crumb = { label: 'teachMe', href: '/dashboard' }

  const levelMatch = pathname.match(/^\/dashboard\/levels\/([^/]+)$/)
  if (levelMatch) {
    const slug = levelMatch[1]
    const entry = [...LEVELS, ...COURSES].find(l => l.slug === slug)
    return [
      root,
      { label: 'Catalogue', href: '/dashboard/levels' },
      { label: entry?.name ?? slug },
    ]
  }

  if (pathname.startsWith('/dashboard/admin/')) {
    return [root, { label: 'Administration', href: '/dashboard/admin' }, { label: STATIC_LABELS[pathname] ?? '' }]
  }

  const label = STATIC_LABELS[pathname]
  return label && pathname !== '/dashboard' ? [root, { label }] : [root, { label: 'Accueil' }]
}

export function TopBar({ onOpenMenu, onOpenSearch }: { onOpenMenu: () => void; onOpenSearch: () => void }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { stats } = useParcours()
  const crumbs = breadcrumbFor(pathname)

  return (
    <header
      className="topbar-surface sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 lg:px-8"
      style={{ height: 'var(--topbar-h)' }}
    >
      <button
        type="button"
        onClick={onOpenMenu}
        className="tap-target lg:hidden rounded-lg -ml-2 flex-shrink-0"
        style={{ color: 'var(--text-secondary)' }}
        aria-label="Ouvrir le menu"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      <nav aria-label="Fil d’Ariane" className="hidden sm:block min-w-0">
        <ol className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
          {crumbs.map((crumb, i) => (
            <li key={`${crumb.label}-${i}`} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && (
                <span aria-hidden="true" className="opacity-50">
                  ›
                </span>
              )}
              {crumb.href && i < crumbs.length - 1 ? (
                <Link href={crumb.href} className="hover:text-coral transition-colors truncate">
                  {crumb.label}
                </Link>
              ) : (
                <span className="truncate" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex items-center gap-2 ml-auto">
        {/* Recherche : champ complet sur grand écran, icône sinon */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="search-field hidden md:flex"
          style={{ width: 280 }}
          aria-label="Rechercher un niveau ou une ressource"
        >
          <Search size={15} aria-hidden="true" className="flex-shrink-0" />
          <span className="flex-1 text-left">Rechercher…</span>
          <kbd
            className="text-[0.68rem] px-1.5 py-0.5 rounded font-sans"
            style={{ background: 'var(--bg-sunken)', color: 'var(--text-muted)' }}
          >
            ⌘K
          </kbd>
        </button>
        <button
          type="button"
          onClick={onOpenSearch}
          className="tap-target md:hidden rounded-full"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Rechercher"
        >
          <Search size={18} aria-hidden="true" />
        </button>

        <ThemeToggle />

        {/* Série en cours — l'équivalent du compteur de notifications */}
        <span
          className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-bold tabular-nums"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-soft)', color: 'var(--text-primary)' }}
          title={`Série : ${stats.streak} jour${stats.streak > 1 ? 's' : ''} d’affilée`}
        >
          <Bookmark size={14} aria-hidden="true" style={{ color: 'var(--coral-deep)', fill: 'var(--coral)' }} />
          {stats.streak}
          <span className="sr-only">jours d’affilée</span>
        </span>

        {user && (
          <span
            aria-hidden="true"
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'var(--coral)', color: 'var(--navy)' }}
            title={user.name}
          >
            {user.name
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map(p => p[0]?.toUpperCase() ?? '')
              .join('')}
          </span>
        )}
      </div>
    </header>
  )
}
