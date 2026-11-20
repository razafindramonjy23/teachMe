'use client'

/**
 * Tuile de statistique — les quatre cartes pastel de la maquette.
 *
 * La teinte est un token (`--tile-*`) décliné en clair et en sombre, et le
 * texte posé dessus est `--tile-ink` : un seul couple de variables à vérifier
 * pour garantir le contraste, au lieu d'une couleur par tuile.
 */

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

export type TileTone = 'peach' | 'sand' | 'sage' | 'sky'

export const TILE_TONES: TileTone[] = ['peach', 'sand', 'sage', 'sky']

export function StatTile({
  label,
  value,
  hint,
  tone,
  icon: Icon,
  index = 0,
  className,
}: {
  label: string
  value: string | number
  /** Troisième ligne : évolution, précision, objectif. */
  hint?: string
  tone: TileTone
  icon?: LucideIcon
  /** Rang dans la rangée, pour décaler l'entrée. */
  index?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={clsx('p-4 flex flex-col gap-1', className)}
      style={{
        background: `var(--tile-${tone})`,
        color: 'var(--tile-ink)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon size={15} aria-hidden="true" style={{ opacity: 0.7 }} />}
        <p className="text-sm font-medium" style={{ opacity: 0.8 }}>
          {label}
        </p>
      </div>
      <p className="font-display text-3xl font-bold leading-none mt-1">{value}</p>
      {hint && (
        <p className="text-xs mt-0.5" style={{ opacity: 0.7 }}>
          {hint}
        </p>
      )}
    </motion.div>
  )
}
