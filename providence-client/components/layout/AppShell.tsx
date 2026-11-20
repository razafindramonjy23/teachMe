'use client'

/**
 * Coquille de l'espace apprenant : barre latérale, bandeau supérieur, contenu,
 * barre de leçon épinglée, recherche globale.
 *
 * Deux réglages de gabarit vivent ici, parce qu'ils concernent la mise en page
 * entière et pas un composant :
 *
 *   - `--sidebar-w` : 248 px dépliée, 68 px en rail. La variable est posée sur
 *     la racine de la coquille ; la colonne, le contenu et la barre de leçon
 *     la lisent par héritage, donc un seul endroit à changer.
 *   - la barre de leçon est masquée sous 1024 px et dans l'administration :
 *     on n'y apprend pas, et sur téléphone elle prenait 76 px au contenu.
 *
 * Le repli est propre à l'espace apprenant. L'administration garde ses six
 * sections nommées : les deviner à l'icône n'aurait aucun intérêt.
 */

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { NowBar } from './NowBar'
import { CommandPalette } from './CommandPalette'
import { PageTransition } from '@/components/ui/PageTransition'
import { OrganisationsProvider } from '@/lib/use-organisations'

const RAIL_KEY = 'teachme:sidebar-rail'
const WIDTH_FULL = '248px'
const WIDTH_RAIL = '68px'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [rail, setRail] = useState(false)
  const [ready, setReady] = useState(false)
  const isAdmin = pathname.startsWith('/dashboard/admin')

  // Le choix est relu après le montage : le lire pendant le rendu
  // désynchroniserait le HTML du serveur et celui du client.
  useEffect(() => {
    try {
      setRail(window.localStorage.getItem(RAIL_KEY) === '1')
    } catch {
      // Navigation privée, stockage bloqué : on reste déplié.
    }
    setReady(true)
  }, [])

  const toggleRail = useCallback(() => {
    setRail(value => {
      const next = !value
      try {
        window.localStorage.setItem(RAIL_KEY, next ? '1' : '0')
      } catch {
        // Le repli reste valable pour la session, simplement pas mémorisé.
      }
      return next
    })
  }, [])

  // ⌘K / Ctrl+K ouvre la recherche depuis n'importe où.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(open => !open)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Changer de page ferme le tiroir resté ouvert.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const collapsed = rail && !isAdmin

  // La barre latérale affiche le périmètre d'organisation dans l'espace
  // d'administration : le fournisseur doit donc englober la coquille, pas
  // seulement les pages. Il n'est monté que là où il sert.
  const shell = (
    <div
      className={ready ? 'shell-ready' : undefined}
      style={
        {
          background: 'var(--bg-primary)',
          minHeight: '100vh',
          '--sidebar-w': collapsed ? WIDTH_RAIL : WIDTH_FULL,
        } as CSSProperties
      }
    >
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:px-4 focus:py-2 focus:rounded-lg"
        style={{ background: 'var(--coral)', color: 'var(--navy)' }}
      >
        Aller au contenu
      </a>

      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        collapsed={collapsed}
        canCollapse={!isAdmin}
        onToggleCollapse={toggleRail}
      />

      <div className="app-content" style={isAdmin ? { paddingBottom: 24 } : undefined}>
        <TopBar onOpenMenu={() => setMenuOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
        <main id="contenu">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {!isAdmin && <NowBar />}
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )

  return isAdmin ? <OrganisationsProvider>{shell}</OrganisationsProvider> : shell
}
