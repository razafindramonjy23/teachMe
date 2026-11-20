'use client'

/**
 * Pastille de filtre : point de couleur, libellé, décompte.
 * L'état est porté par `aria-pressed`, que globals.css (.chip) met en forme —
 * aucune classe conditionnelle à maintenir dans les pages.
 */

import type { Accent } from '@/lib/catalog'

export function Chip({
  label,
  count,
  accent,
  pressed,
  onClick,
}: {
  label: string
  count?: number
  /** Point de couleur à gauche ; absent pour un filtre « Tous ». */
  accent?: Accent
  pressed: boolean
  onClick: () => void
}) {
  return (
    <button type="button" className="chip" aria-pressed={pressed} onClick={onClick}>
      {accent && (
        <span
          aria-hidden="true"
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: `var(--acc-${accent})` }}
        />
      )}
      {label}
      {count !== undefined && (
        <span style={{ opacity: 0.6 }} className="tabular-nums">
          {count}
        </span>
      )}
    </button>
  )
}
