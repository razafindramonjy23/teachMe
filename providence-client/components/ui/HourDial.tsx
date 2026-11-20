'use client'

/**
 * Cadran des heures — « quand vous travaillez ».
 *
 * Vingt-quatre rayons, minuit en haut, qui s'allongent avec le nombre de
 * ressources terminées à cette heure-là. La couleur n'est pas décorative :
 * elle dit le moment de la journée (nuit, matin, après-midi, soir), ce qui
 * reste lisible même pour un œil qui distingue mal deux pastels voisins.
 */

import { motion } from 'framer-motion'
import type { HourPoint } from '@/lib/activity'

const SIZE = 232
const CENTER = SIZE / 2
const INNER_R = 46
const MAX_LEN = 52
const MIN_LEN = 4

type Period = { label: string; accent: string }

/** Moment de la journée d'une heure donnée. */
export function periodOf(hour: number): Period {
  if (hour < 6) return { label: 'nuit', accent: 'violet' }
  if (hour < 12) return { label: 'matin', accent: 'amber' }
  if (hour < 18) return { label: 'après-midi', accent: 'coral' }
  return { label: 'soir', accent: 'blue' }
}

const TICKS = [
  { hour: 0, label: '00' },
  { hour: 6, label: '06' },
  { hour: 12, label: '12' },
  { hour: 18, label: '18' },
]

function pointOn(hour: number, radius: number) {
  const angle = ((hour / 24) * 360 - 90) * (Math.PI / 180)
  return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) }
}

export function HourDial({ points, peak }: { points: HourPoint[]; peak: number | null }) {
  const max = Math.max(...points.map(p => p.count), 0)
  const total = points.reduce((n, p) => n + p.count, 0)

  const described =
    total === 0
      ? 'Aucune ressource terminée sur la période.'
      : `Répartition par heure de ${total} ressource${total > 1 ? 's' : ''} terminée${total > 1 ? 's' : ''}.`

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={described}>
          {points.map(({ hour, count }) => {
            const { accent } = periodOf(hour)
            const length = max === 0 ? MIN_LEN : MIN_LEN + (count / max) * (MAX_LEN - MIN_LEN)
            const from = pointOn(hour, INNER_R + 6)
            const to = pointOn(hour, INNER_R + 6 + length)
            return (
              <motion.line
                key={hour}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={`var(--acc-${accent})`}
                strokeOpacity={count === 0 ? 0.25 : 1}
                strokeWidth={6}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 + hour * 0.02, ease: [0.22, 1, 0.36, 1] }}
              />
            )
          })}

          <circle
            cx={CENTER}
            cy={CENTER}
            r={INNER_R}
            fill="var(--bg-elevated)"
            stroke="var(--border)"
            strokeWidth={1}
          />
        </svg>

        {/* Repères horaires, en HTML pour rester nets à toute taille */}
        {TICKS.map(({ hour, label }) => {
          const at = pointOn(hour, INNER_R + MAX_LEN + 20)
          return (
            <span
              key={hour}
              aria-hidden="true"
              className="absolute tabular-nums"
              style={{
                left: at.x,
                top: at.y,
                transform: 'translate(-50%, -50%)',
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              {label}
            </span>
          )
        })}

        {/* Noyau : l'heure de pointe */}
        <span
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none"
          aria-hidden="true"
        >
          <span className="font-display text-xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
            {peak === null ? '—' : `${String(peak).padStart(2, '0')}:00`}
          </span>
          <span className="text-[11px] leading-tight mt-1" style={{ color: 'var(--text-muted)' }}>
            {peak === null ? 'pas encore de rythme' : 'votre heure de pointe'}
          </span>
        </span>
      </div>

      <ul className="sr-only">
        {points
          .filter(p => p.count > 0)
          .map(p => (
            <li key={p.hour}>
              {String(p.hour).padStart(2, '0')} h ({periodOf(p.hour).label}) : {p.count} ressource
              {p.count > 1 ? 's' : ''}
            </li>
          ))}
      </ul>
    </div>
  )
}
