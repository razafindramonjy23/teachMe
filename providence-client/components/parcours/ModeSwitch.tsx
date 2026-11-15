'use client'

import { Map as MapIcon, LayoutGrid } from 'lucide-react'
import { useAuth, type HomeMode } from '@/lib/auth'

/** Contour de la bulle du logo teachMe (viewBox 0 0 120 120), réutilisé pour les étapes du parcours. */
export const BUBBLE_PATH =
  'M15 6h90a11 11 0 0 1 11 11v64a11 11 0 0 1-11 11H52L26 114V92h-11A11 11 0 0 1 4 81V17A11 11 0 0 1 15 6Z'

const OPTIONS: { mode: HomeMode; label: string; Icon: typeof MapIcon }[] = [
  { mode: 'parcours', label: 'Parcours', Icon: MapIcon },
  { mode: 'libre', label: 'Accès libre', Icon: LayoutGrid },
]

/**
 * Bascule entre le parcours guidé et l'accès libre, visible depuis l'accueil.
 * Changer de mode ne fait rien perdre : la progression est la même, seul
 * l'affichage change.
 */
export function ModeSwitch() {
  const { user, setHomeMode } = useAuth()
  const current = user?.homeMode ?? 'libre'

  return (
    <div
      role="group"
      aria-label="Mode d’accueil"
      className="inline-flex p-1 rounded-xl gap-1"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
    >
      {OPTIONS.map(({ mode, label, Icon }) => {
        const active = current === mode
        return (
          <button
            key={mode}
            type="button"
            aria-pressed={active}
            onClick={() => !active && setHomeMode(mode)}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg text-sm font-semibold transition-colors"
            style={
              active
                ? { background: 'var(--coral)', color: 'var(--navy)' }
                : { background: 'transparent', color: 'var(--text-secondary)' }
            }
          >
            <Icon size={15} aria-hidden="true" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
