'use client'

/**
 * Bascule clair / sombre, avec révélation circulaire partie du bouton.
 *
 * Chemin principal : View Transitions API. Le thème est appliqué au <html>
 * **dans** le callback de `startViewTransition`, de façon synchrone — un
 * `setTheme` React arriverait après la capture de l'image et la transition
 * n'animerait rien. `setTheme` est appelé juste après pour que next-themes
 * garde son état et son localStorage à jour ; il réapplique la même classe,
 * donc rien ne bouge à l'écran.
 *
 * Repli (Safari, Firefox) : un calque de la couleur cible s'ouvre en cercle
 * depuis le bouton, le thème bascule derrière, puis le calque s'efface.
 *
 * Mouvement réduit : bascule immédiate, sans cercle (WCAG 2.3.3).
 */

import { useTheme } from 'next-themes'
import { useCallback, useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

/** Fonds de page des deux thèmes — doivent suivre --bg-primary dans globals.css. */
const PAGE_BACKGROUND: Record<Theme, string> = { light: '#f7f5f0', dark: '#121d33' }

const SWEEP_MS = 820

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> }
}

function wantsReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Applique le thème au document comme le ferait next-themes, mais tout de suite. */
function applyTheme(next: Theme) {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(next)
  root.style.colorScheme = next
}

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = (theme ?? resolvedTheme) !== 'light'

  const toggle = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const next: Theme = isDark ? 'light' : 'dark'

      if (wantsReducedMotion()) {
        setTheme(next)
        return
      }

      // Centre du bouton, et rayon qui couvre le coin le plus éloigné.
      const rect = event.currentTarget.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      )

      const root = document.documentElement
      root.style.setProperty('--sweep-x', `${x}px`)
      root.style.setProperty('--sweep-y', `${y}px`)
      root.style.setProperty('--sweep-r', `${radius}px`)

      const start = (document as ViewTransitionDocument).startViewTransition
      if (typeof start === 'function') {
        root.classList.add('theme-sweep')
        const transition = start.call(document, () => applyTheme(next))
        // next-themes réapplique la même classe : rien ne bouge à l'écran,
        // mais l'état React (et donc l'icône du bouton) suit immédiatement.
        setTheme(next)
        void transition.finished.catch(() => undefined).finally(() => {
          root.classList.remove('theme-sweep')
        })
        return
      }

      // Repli sans View Transitions
      const overlay = document.createElement('div')
      overlay.className = 'theme-sweep-overlay'
      overlay.style.background = PAGE_BACKGROUND[next]
      document.body.appendChild(overlay)

      window.setTimeout(() => {
        applyTheme(next)
        setTheme(next)
      }, SWEEP_MS / 2)

      window.setTimeout(() => {
        overlay.classList.add('is-leaving')
        window.setTimeout(() => overlay.remove(), 240)
      }, SWEEP_MS)
    },
    [isDark, setTheme],
  )

  // Avant l'hydratation, on ne connaît pas le thème : on réserve la place
  // plutôt que d'afficher une icône qui changerait aussitôt.
  if (!mounted) return <span className="tap-target" aria-hidden="true" />

  return (
    <button
      type="button"
      onClick={toggle}
      className="tap-target rounded-full transition-colors"
      style={{ color: 'var(--text-secondary)' }}
      aria-label={isDark ? 'Passer au thème clair' : 'Passer au thème sombre'}
      aria-pressed={isDark}
      title={isDark ? 'Thème clair' : 'Thème sombre'}
    >
      {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  )
}
