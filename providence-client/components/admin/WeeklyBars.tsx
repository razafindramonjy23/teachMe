'use client'

import { useState } from 'react'

export type BarPoint = {
  /** Libellé court de l'axe (« 16 nov. »). */
  label: string
  /** Libellé complet pour l'infobulle et la table (« semaine du 16 novembre »). */
  fullLabel: string
  value: number
  /** Semaine en cours, donc incomplète. */
  partial?: boolean
}

// Géométrie (unités du viewBox, mise à l'échelle par le SVG)
const W = 360
const H = 170
const PAD = { top: 22, right: 6, bottom: 26, left: 30 }
const BAR_MAX = 24 // épaisseur maximale d'une barre (spéc. dataviz)
const RADIUS = 4 // bout arrondi, base carrée

/** Plafond « propre » de l'axe : 1, 2, 5 × 10ⁿ, et au moins 4. */
function niceMax(max: number): number {
  if (max <= 4) return 4
  const pow = 10 ** Math.floor(Math.log10(max))
  for (const m of [1, 2, 2.5, 5, 10]) if (m * pow >= max) return m * pow
  return 10 * pow
}

/** Colonne à bout arrondi (4 px), carrée sur la ligne de base. */
function columnPath(x: number, y: number, w: number, base: number): string {
  const h = base - y
  if (h <= 0) return ''
  const r = Math.min(RADIUS, h, w / 2)
  return `M${x} ${base}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${base}Z`
}

/**
 * Graphique en colonnes d'une seule série (la tendance hebdomadaire). Une
 * seule série : pas de légende, le titre la nomme. Infobulle au survol ET au
 * clavier sur toute la colonne ; valeurs aussi lisibles dans la table.
 */
export function WeeklyBars({ title, unit, points }: { title: string; unit: [string, string]; points: BarPoint[] }) {
  const [active, setActive] = useState<number | null>(null)
  const max = niceMax(Math.max(0, ...points.map(p => p.value)))
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const base = PAD.top + plotH
  const slot = plotW / Math.max(points.length, 1)
  const barW = Math.min(BAR_MAX, slot * 0.6)
  const y = (v: number) => base - (v / max) * plotH
  const word = (n: number) => (n > 1 ? unit[1] : unit[0])
  const last = points.length - 1

  return (
    <figure className="rounded-2xl p-5 m-0" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <figcaption className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{title}</figcaption>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label={`${title}, ${points.length} dernières semaines`}>
          {/* Grille : traits fins et pleins, discrets */}
          {[0, max / 2, max].map(t => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
              <text x={PAD.left - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="var(--text-muted)">
                {Number.isInteger(t) ? t : t.toFixed(1)}
              </text>
            </g>
          ))}

          {points.map((p, i) => {
            const cx = PAD.left + slot * i + slot / 2
            const isActive = active === i
            return (
              <g key={p.fullLabel}>
                <path d={columnPath(cx - barW / 2, y(p.value), barW, base)} fill="var(--chart-bar)" />
                {/* Valeur sur le haut : seulement pour la semaine en cours (étiquetage sélectif) */}
                {i === last && (
                  <text x={cx} y={y(p.value) - 6} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text-primary)">
                    {p.value}
                  </text>
                )}
                <text x={cx} y={H - 8} textAnchor="middle" fontSize={10} fill={isActive ? 'var(--text-primary)' : 'var(--text-muted)'}>
                  {p.label}
                </text>
                {/* Zone de survol/focus : toute la colonne, plus grande que la barre */}
                <rect
                  x={PAD.left + slot * i}
                  y={PAD.top}
                  width={slot}
                  height={plotH}
                  fill={isActive ? 'var(--bg-secondary)' : 'transparent'}
                  fillOpacity={isActive ? 0.5 : 0}
                  tabIndex={0}
                  role="button"
                  aria-label={`${p.fullLabel}${p.partial ? ' (en cours)' : ''} : ${p.value} ${word(p.value)}`}
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  style={{ cursor: 'default' }}
                />
              </g>
            )
          })}
          {/* Ligne de base */}
          <line x1={PAD.left} x2={W - PAD.right} y1={base} y2={base} stroke="var(--text-muted)" strokeOpacity={0.5} strokeWidth={1} />
        </svg>

        {active !== null && points[active] && (
          <div
            role="status"
            className="pointer-events-none absolute -translate-x-1/2 rounded-lg px-3 py-2 text-xs shadow-lg whitespace-nowrap"
            style={{
              left: `${((PAD.left + slot * active + slot / 2) / W) * 100}%`,
              top: 0,
              background: 'var(--text-primary)',
              color: 'var(--bg-primary)',
            }}
          >
            <strong className="text-sm">{points[active].value}</strong> {word(points[active].value)}
            <span className="block opacity-80">
              {points[active].fullLabel}
              {points[active].partial ? ' · en cours' : ''}
            </span>
          </div>
        )}
      </div>

      <details className="mt-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <summary className="cursor-pointer select-none">Voir les données</summary>
        <table className="mt-2 w-full">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr>
              <th scope="col" className="text-left font-semibold py-1">Semaine</th>
              <th scope="col" className="text-right font-semibold py-1">{unit[1]}</th>
            </tr>
          </thead>
          <tbody>
            {points.map(p => (
              <tr key={p.fullLabel} style={{ borderTop: '1px solid var(--border)' }}>
                <th scope="row" className="text-left font-normal py-1">
                  {p.fullLabel}
                  {p.partial ? ' (en cours)' : ''}
                </th>
                <td className="text-right py-1 tabular-nums">{p.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
