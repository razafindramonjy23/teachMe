'use client'

/**
 * Courbe d'activité — l'aire lissée de la maquette.
 *
 * Le tracé s'anime à l'apparition (`pathLength`), l'aire se remplit ensuite.
 * Le survol affiche un repère vertical et la valeur du point le plus proche.
 *
 * Les libellés d'axes sont en HTML autour du SVG, pas dedans : le SVG est
 * étiré en largeur (`preserveAspectRatio="none"`) pour épouser son conteneur,
 * ce qui déformerait tout texte placé à l'intérieur. Les traits gardent leur
 * épaisseur grâce à `vector-effect="non-scaling-stroke"`.
 *
 * Accessibilité : le graphique est une image décrite par `ariaLabel`, doublée
 * d'une liste de valeurs réservée aux lecteurs d'écran.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'

export type AreaPoint = { label: string; value: number }

const VIEW_W = 640
const PAD_TOP = 12

/** Plafond d'axe lisible : 7 devient 8, 45 reste 45, 0 devient 2. */
function niceMax(value: number): number {
  if (value <= 0) return 2
  if (value <= 10) return Math.ceil(value / 2) * 2
  const exp = Math.pow(10, Math.floor(Math.log10(value)))
  const step = exp / 2
  return Math.ceil(value / step) * step
}

/** Courbe de Catmull-Rom convertie en Bézier, bornée au cadre. */
function smoothPath(points: { x: number; y: number }[], minY: number, maxY: number): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M${points[0].x} ${points[0].y}`

  const clamp = (v: number) => Math.max(minY, Math.min(maxY, v))
  const tension = 0.2
  let d = `M${points[0].x} ${points[0].y}`

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) * tension
    const c1y = clamp(p1.y + (p2.y - p0.y) * tension)
    const c2x = p2.x - (p3.x - p1.x) * tension
    const c2y = clamp(p2.y - (p3.y - p1.y) * tension)
    d += ` C${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`
  }
  return d
}

export function AreaChart({
  points,
  height = 200,
  color = 'var(--chart-bar)',
  ariaLabel,
  format = (n: number) => String(n),
  unit,
}: {
  points: AreaPoint[]
  height?: number
  color?: string
  ariaLabel: string
  /** Mise en forme des valeurs d'axe et d'infobulle. */
  format?: (value: number) => string
  /** Unité lue dans la liste accessible : « ressources », « minutes »… */
  unit?: string
}) {
  const [active, setActive] = useState<number | null>(null)

  const max = niceMax(Math.max(...points.map(p => p.value), 0))
  const plotH = height - PAD_TOP
  const n = points.length

  const toX = (i: number) => (n <= 1 ? VIEW_W / 2 : (i / (n - 1)) * VIEW_W)
  const toY = (value: number) => PAD_TOP + plotH * (1 - value / max)

  const coords = points.map((p, i) => ({ x: toX(i), y: toY(p.value) }))
  const line = smoothPath(coords, PAD_TOP, height)
  const area = line && n > 1 ? `${line} L${VIEW_W} ${height} L0 ${height} Z` : ''

  const gridValues = [max, max / 2, 0]
  const current = active !== null ? points[active] : null

  return (
    <div>
      <div className="flex gap-3">
        {/* Axe des ordonnées : chaque étiquette centrée sur sa ligne de grille */}
        <div
          className="relative text-right flex-shrink-0 tabular-nums"
          style={{ height, width: 44, fontSize: 11, color: 'var(--text-muted)' }}
          aria-hidden="true"
        >
          {gridValues.map(v => (
            <span
              key={v}
              className="absolute right-0 whitespace-nowrap"
              style={{ top: toY(v), transform: 'translateY(-50%)' }}
            >
              {format(v)}
            </span>
          ))}
        </div>

        {/* Zone de tracé */}
        <div className="relative flex-1 min-w-0" style={{ height }}>
          <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${VIEW_W} ${height}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={ariaLabel}
            className="block overflow-visible"
          >
            <defs>
              <linearGradient id="area-fade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={color} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {gridValues.map(v => (
              <line
                key={v}
                x1="0"
                x2={VIEW_W}
                y1={toY(v)}
                y2={toY(v)}
                stroke="var(--border)"
                strokeDasharray="3 6"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {area && (
              <motion.path
                d={area}
                fill="url(#area-fade)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              />
            )}

            {line && (
              <motion.path
                d={line}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              />
            )}

            {active !== null && (
              <line
                x1={toX(active)}
                x2={toX(active)}
                y1={PAD_TOP}
                y2={height}
                stroke={color}
                strokeOpacity={0.4}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {/* Point survolé — hors SVG pour ne pas être étiré */}
          {active !== null && (
            <span
              aria-hidden="true"
              className="absolute w-2.5 h-2.5 rounded-full pointer-events-none"
              style={{
                left: `${n <= 1 ? 50 : (active / (n - 1)) * 100}%`,
                top: toY(points[active].value),
                transform: 'translate(-50%, -50%)',
                background: color,
                boxShadow: '0 0 0 3px var(--bg-elevated)',
              }}
            />
          )}

          {current && active !== null && (
            <span
              className="absolute px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap pointer-events-none"
              style={{
                left: `${n <= 1 ? 50 : (active / (n - 1)) * 100}%`,
                top: 0,
                transform: 'translate(-50%, -115%)',
                background: 'var(--text-primary)',
                color: 'var(--bg-primary)',
              }}
            >
              {current.label} · {format(current.value)}
            </span>
          )}

          {/* Zones de survol : une par point, sur toute la hauteur */}
          <div className="absolute inset-0 flex" onMouseLeave={() => setActive(null)}>
            {points.map((p, i) => (
              <span
                key={`${p.label}-${i}`}
                className="flex-1"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Axe des abscisses : premier, milieu, dernier — au-delà, ça se chevauche */}
      <div
        className="flex justify-between mt-2"
        style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 56 }}
        aria-hidden="true"
      >
        <span>{points[0]?.label}</span>
        {n > 2 && <span>{points[Math.floor((n - 1) / 2)]?.label}</span>}
        {n > 1 && <span>{points[n - 1]?.label}</span>}
      </div>

      <ul className="sr-only">
        {points.map((p, i) => (
          <li key={`${p.label}-sr-${i}`}>
            {p.label} : {format(p.value)}
            {unit ? ` ${unit}` : ''}
          </li>
        ))}
      </ul>
    </div>
  )
}
