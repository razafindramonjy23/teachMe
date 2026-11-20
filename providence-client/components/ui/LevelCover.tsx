'use client'

/**
 * Pochette d'un niveau — l'équivalent des jaquettes d'album de la maquette.
 *
 * Tout est dessiné en SVG, sans image distante : la composition est déduite du
 * slug (toujours la même pour un niveau donné) et teintée avec l'accent du
 * niveau, par-dessus `--bg-sunken`. Elle fonctionne donc en clair comme en
 * sombre, se charge instantanément et ne dépend d'aucun service tiers.
 */

import type { Accent } from '@/lib/catalog'

/** Hachage court et stable d'un slug, pour choisir une composition. */
function seedOf(slug: string): number {
  let hash = 0
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0
  return hash
}

const VARIANTS = 6

function Composition({ variant, fill }: { variant: number; fill: string }) {
  const tone = (opacity: number) => ({ fill, fillOpacity: opacity })

  switch (variant) {
    case 0: // Soleil bas sur deux bandes
      return (
        <>
          <circle cx="60" cy="54" r="26" {...tone(0.85)} />
          <rect x="0" y="74" width="120" height="20" {...tone(0.3)} />
          <rect x="0" y="94" width="120" height="26" {...tone(0.55)} />
        </>
      )
    case 1: // Arcs concentriques
      return (
        <>
          <circle cx="60" cy="120" r="56" {...tone(0.2)} />
          <circle cx="60" cy="120" r="38" {...tone(0.4)} />
          <circle cx="60" cy="120" r="20" {...tone(0.8)} />
        </>
      )
    case 2: // Diagonales
      return (
        <>
          <path d="M0 120 L120 0 L120 44 L44 120 Z" {...tone(0.45)} />
          <path d="M0 120 L80 0 L120 0 L0 120 Z" {...tone(0.18)} />
          <circle cx="88" cy="32" r="14" {...tone(0.85)} />
        </>
      )
    case 3: // Blocs empilés
      return (
        <>
          <rect x="14" y="22" width="92" height="26" rx="13" {...tone(0.75)} />
          <rect x="14" y="56" width="66" height="26" rx="13" {...tone(0.45)} />
          <rect x="14" y="90" width="44" height="26" rx="13" {...tone(0.25)} />
        </>
      )
    case 4: // Trame de points et arc
      return (
        <>
          <path d="M0 96 Q60 36 120 96 L120 120 L0 120 Z" {...tone(0.4)} />
          {[0, 1, 2, 3].map(row =>
            [0, 1, 2, 3, 4].map(col => (
              <circle key={`${row}-${col}`} cx={20 + col * 20} cy={18 + row * 16} r="3.4" {...tone(0.55)} />
            )),
          )}
        </>
      )
    default: // Vague
      return (
        <>
          <path d="M0 62 Q30 30 60 62 T120 62 L120 120 L0 120 Z" {...tone(0.55)} />
          <path d="M0 84 Q30 54 60 84 T120 84 L120 120 L0 120 Z" {...tone(0.3)} />
          <circle cx="92" cy="30" r="16" {...tone(0.8)} />
        </>
      )
  }
}

export function LevelCover({
  slug,
  accent,
  code,
  className,
}: {
  slug: string
  accent: Accent
  /** Code affiché en bas à gauche (A1, B2, IELTS…). */
  code: string
  className?: string
}) {
  const variant = seedOf(slug) % VARIANTS
  const fill = `var(--acc-${accent})`

  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      <rect width="120" height="120" fill="var(--bg-sunken)" />
      <Composition variant={variant} fill={fill} />
      <text
        x="10"
        y="112"
        fontSize="11"
        fontWeight="700"
        fontFamily="var(--font-body)"
        fill="var(--text-primary)"
        opacity="0.75"
      >
        {code}
      </text>
    </svg>
  )
}
