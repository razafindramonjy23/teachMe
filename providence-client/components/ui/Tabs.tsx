'use client'

/**
 * Onglets avec indicateur qui glisse d'un onglet à l'autre (`layoutId`).
 *
 * Deux usages :
 *   - `Tabs`        : onglets soulignés, pour changer de vue dans une page ;
 *   - `SegmentedTabs`: bascule compacte sur fond plein, pour changer la série
 *     affichée dans un graphique (« Minutes / Songs » dans la maquette).
 *
 * Les deux suivent le motif ARIA tablist : flèches gauche/droite pour naviguer,
 * un seul onglet dans l'ordre de tabulation.
 */

import { useRef } from 'react'
import { motion } from 'framer-motion'

export type TabItem<T extends string> = { id: T; label: string }

function useRovingKeys<T extends string>(items: TabItem<T>[], value: T, onChange: (id: T) => void) {
  const refs = useRef(new Map<T, HTMLButtonElement>())

  const onKeyDown = (event: React.KeyboardEvent) => {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (delta === 0) return
    event.preventDefault()
    const index = items.findIndex(i => i.id === value)
    const next = items[(index + delta + items.length) % items.length]
    onChange(next.id)
    refs.current.get(next.id)?.focus()
  }

  const register = (id: T) => (node: HTMLButtonElement | null) => {
    if (node) refs.current.set(id, node)
    else refs.current.delete(id)
  }

  return { onKeyDown, register }
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  idPrefix,
}: {
  items: TabItem<T>[]
  value: T
  onChange: (id: T) => void
  /** Libellé du groupe d'onglets pour les lecteurs d'écran. */
  label: string
  /** Préfixe des `id` ARIA — unique par groupe d'onglets dans la page. */
  idPrefix: string
}) {
  const { onKeyDown, register } = useRovingKeys(items, value, onChange)

  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex gap-1 -mb-px">
      {items.map(item => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            ref={register(item.id)}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${item.id}`}
            aria-selected={active}
            // Seul le panneau de l'onglet actif est monté : pointer vers un
            // panneau absent depuis les autres onglets casserait la relation.
            aria-controls={active ? `${idPrefix}-panel-${item.id}` : undefined}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.id)}
            className="relative px-3 min-h-[44px] text-sm font-medium transition-colors"
            style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            {item.label}
            {active && (
              <motion.span
                layoutId={`${idPrefix}-indicator`}
                className="absolute left-2 right-2 -bottom-px rounded-full"
                style={{ height: 3, background: 'var(--coral)' }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Bascule compacte : choisir la série affichée, l'ordre de tri…
 *
 * Elle ne change pas de panneau, seulement une option — c'est un groupe de
 * boutons radio, pas des onglets. Le clavier suit le même motif (flèches entre
 * les options, une seule dans l'ordre de tabulation).
 */
export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  label,
  idPrefix,
}: {
  items: TabItem<T>[]
  value: T
  onChange: (id: T) => void
  label: string
  idPrefix: string
}) {
  const { onKeyDown, register } = useRovingKeys(items, value, onChange)

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="inline-flex p-1 gap-1"
      style={{ background: 'var(--bg-sunken)', borderRadius: 999 }}
    >
      {items.map(item => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            ref={register(item.id)}
            type="button"
            role="radio"
            id={`${idPrefix}-option-${item.id}`}
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.id)}
            className="relative px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            {active && (
              <motion.span
                layoutId={`${idPrefix}-pill`}
                className="absolute inset-0"
                style={{ background: 'var(--bg-elevated)', borderRadius: 999, boxShadow: 'var(--shadow-soft)' }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
