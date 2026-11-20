'use client'

/**
 * Calendrier d'activité — une case par jour, en colonnes de semaines.
 *
 * Les week-ends sont grisés : la règle de série du projet les rend neutres
 * (lib/gamification.ts), et la carte doit dire la même chose que la règle,
 * sans quoi un apprenant croira avoir cassé sa série un samedi.
 *
 * L'intensité est rendue par l'opacité d'une seule teinte : quatre paliers,
 * lisibles même sans distinguer les nuances, et doublés d'un `title`.
 */

import { motion } from 'framer-motion'
import { isWeekend } from '@/lib/gamification'
import { shortDayLabel, startOfWeek, weekdayOf, type DayPoint } from '@/lib/activity'

const ROWS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

/** Palier d'intensité : 0 (rien) à 4 (beaucoup). */
function levelOf(count: number, max: number): number {
  if (count === 0) return 0
  if (max <= 1) return 4
  return Math.min(4, Math.ceil((count / max) * 4))
}

const OPACITY = [0, 0.3, 0.5, 0.75, 1]

export function ActivityHeatmap({ points }: { points: DayPoint[] }) {
  if (points.length === 0) return null

  const max = Math.max(...points.map(p => p.count), 0)

  // Les cases sont rangées par colonne de semaine ; la première semaine peut
  // commencer un autre jour que lundi, d'où les cases vides en tête.
  const firstWeek = startOfWeek(points[0].day)
  const weeks = new Map<string, (DayPoint | null)[]>()
  for (const point of points) {
    const week = startOfWeek(point.day)
    if (!weeks.has(week)) weeks.set(week, new Array(7).fill(null))
    weeks.get(week)![weekdayOf(point.day) - 1] = point
  }

  const columns = Array.from(weeks.entries())
  const total = points.reduce((n, p) => n + p.count, 0)

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {/* Initiales des jours */}
        <div className="flex flex-col gap-1 flex-shrink-0 pr-1" aria-hidden="true">
          {ROWS.map((row, i) => (
            <span
              key={`${row}-${i}`}
              className="h-3.5 flex items-center text-[0.6rem] leading-none"
              style={{ color: 'var(--text-muted)' }}
            >
              {i % 2 === 0 ? row : ''}
            </span>
          ))}
        </div>

        {columns.map(([week, days], column) => (
          <div key={week} className="flex flex-col gap-1 flex-shrink-0">
            {days.map((day, row) => {
              if (!day) return <span key={`${week}-${row}`} className="w-3.5 h-3.5" aria-hidden="true" />
              const weekend = isWeekend(day.day)
              const intensity = levelOf(day.count, max)
              return (
                <motion.span
                  key={day.day}
                  className="w-3.5 h-3.5 rounded-[4px]"
                  title={`${shortDayLabel(day.day)} · ${day.count} ressource${day.count > 1 ? 's' : ''}${
                    weekend ? ' (week-end : la série ne casse pas)' : ''
                  }`}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, delay: Math.min(column * 0.02, 0.4) }}
                  style={{
                    background:
                      intensity === 0
                        ? weekend
                          ? 'var(--border-soft)'
                          : 'var(--bg-sunken)'
                        : 'var(--coral)',
                    opacity: intensity === 0 ? 1 : OPACITY[intensity],
                    border: weekend && intensity === 0 ? '1px dashed var(--border)' : undefined,
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-3 text-[0.7rem]" style={{ color: 'var(--text-muted)' }}>
        <span>Depuis le {shortDayLabel(firstWeek)}</span>
        <span className="ml-auto flex items-center gap-1">
          Moins
          {[0, 1, 2, 3, 4].map(i => (
            <span
              key={i}
              aria-hidden="true"
              className="w-3 h-3 rounded-[4px]"
              style={{
                background: i === 0 ? 'var(--bg-sunken)' : 'var(--coral)',
                opacity: i === 0 ? 1 : OPACITY[i],
              }}
            />
          ))}
          Plus
        </span>
      </div>

      <p className="sr-only">
        {total} ressource{total > 1 ? 's' : ''} terminée{total > 1 ? 's' : ''} sur la période affichée. Les week-ends
        sont neutres : ne rien faire un samedi ou un dimanche ne casse pas la série.
      </p>
    </div>
  )
}
