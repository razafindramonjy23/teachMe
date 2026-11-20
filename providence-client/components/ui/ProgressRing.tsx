'use client'

/**
 * Anneau de progression — objectif du jour, avancement d'un niveau.
 * L'arc s'anime depuis zéro à l'affichage puis à chaque changement de valeur.
 */

import { motion } from 'framer-motion'

export function ProgressRing({
  value,
  max,
  size = 64,
  thickness = 7,
  color = 'var(--coral)',
  track = 'var(--bg-sunken)',
  label,
  children,
}: {
  value: number
  max: number
  size?: number
  thickness?: number
  color?: string
  track?: string
  /** Description pour les lecteurs d'écran : l'anneau est décoratif sans elle. */
  label: string
  /** Contenu au centre — le ratio, un pourcentage, une icône. */
  children?: React.ReactNode
}) {
  const safeMax = max > 0 ? max : 1
  const ratio = Math.max(0, Math.min(value / safeMax, 1))
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const percent = Math.round(ratio * 100)

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={thickness} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - ratio) }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      {children && <span className="absolute inset-0 flex items-center justify-center">{children}</span>}
    </div>
  )
}
