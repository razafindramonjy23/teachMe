'use client'

/**
 * Barre de leçon en cours — épinglée en bas, comme la barre de lecture de la
 * maquette, mais branchée sur la progression réelle.
 *
 *   pochette + titre   │  au hasard · précédent · OUVRIR · suivant · terminé
 *                      │  avancement dans le niveau
 *                                                     objectif du jour
 *
 * Elle ne recouvre jamais le contenu : `.app-content` réserve sa hauteur
 * (--nowbar-h) en bas de chaque page, à partir de 1024 px seulement.
 *
 * En dessous de 1024 px elle n'est pas rendue du tout. Avec le bandeau
 * supérieur et le tiroir, trois chromes fixes sur un écran de téléphone ne
 * laissaient plus assez de place au contenu ; les mêmes actions restent
 * accessibles depuis la carte « À reprendre » de l'accueil et depuis la page
 * du niveau.
 */

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, ExternalLink, Shuffle } from 'lucide-react'
import { LevelCover } from '@/components/ui/LevelCover'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { useNowPlaying, useOpenResource } from '@/lib/use-now'
import { useProgress } from '@/lib/progress'
import { useParcours } from '@/lib/use-parcours'
import { LEVELS, COURSES, type Accent } from '@/lib/catalog'
import type { ResourceLocation } from '@/lib/resources'

function codeOf(slug: string): string {
  return [...LEVELS, ...COURSES].find(l => l.slug === slug)?.code ?? '—'
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="tap-target rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ color: 'var(--text-secondary)' }}
    >
      {children}
    </button>
  )
}

export function NowBar() {
  const router = useRouter()
  const { current, position, total, done, isCurrentDone, previous, next, pickRandom } = useNowPlaying()
  const { toggleDone, markOpened } = useProgress()
  const { stats } = useParcours()
  const openResource = useOpenResource()

  if (!current) return null

  // Se déplacer dans la file : on enregistre l'ouverture et on va sur la page
  // du niveau, d'où l'apprenant voit la ressource dans son contexte.
  const goTo = (resource: ResourceLocation | null) => {
    if (!resource) return
    markOpened(resource.id, resource.levelSlug)
    router.push(`/dashboard/levels/${resource.levelSlug}`)
  }

  const surprise = () => goTo(pickRandom())
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <div
      className="app-nowbar hidden lg:block fixed bottom-0 left-0 right-0 z-30"
      style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-soft)' }}
      aria-label="Ressource en cours"
      role="region"
    >
      <div
        className="ml-[var(--sidebar-w)] flex items-center gap-3 px-5"
        style={{ height: 'var(--nowbar-h)' }}
      >
        {/* Ressource en cours */}
        <div className="flex items-center gap-3 min-w-0 w-[clamp(200px,24vw,300px)] flex-shrink-0">
          <span
            className="w-11 h-11 rounded-[12px] overflow-hidden flex-shrink-0"
            style={{ border: '1px solid var(--border-soft)' }}
          >
            <LevelCover slug={current.levelSlug} accent={current.accent as Accent} code={codeOf(current.levelSlug)} />
          </span>
          <span className="min-w-0">
            <span
              className="block text-sm font-semibold truncate"
              style={{
                color: 'var(--text-primary)',
                textDecoration: isCurrentDone ? 'line-through' : undefined,
              }}
            >
              {current.title}
            </span>
            <span className="block text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {current.levelName} · {current.category}
            </span>
          </span>
        </div>

        {/* Commandes */}
        <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <IconButton label="Une ressource au hasard" onClick={surprise}>
              <Shuffle size={16} aria-hidden="true" />
            </IconButton>
            <IconButton label="Ressource précédente" onClick={() => goTo(previous)} disabled={!previous}>
              <ChevronLeft size={20} aria-hidden="true" />
            </IconButton>

            <motion.button
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => openResource(current)}
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--coral)', color: 'var(--navy)' }}
              aria-label={`Ouvrir « ${current.title} » dans un nouvel onglet`}
              title="Ouvrir la ressource"
            >
              <ExternalLink size={18} aria-hidden="true" />
            </motion.button>

            <IconButton label="Ressource suivante" onClick={() => goTo(next)} disabled={!next}>
              <ChevronRight size={20} aria-hidden="true" />
            </IconButton>

            <button
              type="button"
              onClick={() => toggleDone(current.id, current.levelSlug)}
              aria-pressed={isCurrentDone}
              aria-label={
                isCurrentDone
                  ? `Marquer « ${current.title} » comme non terminée`
                  : `Marquer « ${current.title} » comme terminée`
              }
              title={isCurrentDone ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
              className="tap-target rounded-full transition-colors"
              style={{ color: isCurrentDone ? 'var(--acc-green)' : 'var(--text-secondary)' }}
            >
              <Check size={18} strokeWidth={isCurrentDone ? 3 : 2} aria-hidden="true" />
            </button>
          </div>

          {/* Avancement dans le niveau */}
          <div className="flex items-center gap-2 w-full max-w-md">
            <span className="text-[0.7rem] tabular-nums flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
              {position}/{total}
            </span>
            <span
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progression du niveau ${current.levelName}`}
              style={{ background: 'var(--bg-sunken)' }}
            >
              <motion.span
                className="block h-full rounded-full"
                style={{ background: `var(--acc-${current.accent})` }}
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </span>
            <span className="text-[0.7rem] tabular-nums flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
              {percent}%
            </span>
          </div>
        </div>

        {/* Objectif du jour */}
        <div className="flex items-center gap-2.5 w-[clamp(140px,16vw,200px)] justify-end">
          <ProgressRing
            value={stats.todayCount}
            max={stats.goal}
            size={34}
            thickness={4}
            label={`Objectif du jour : ${Math.min(stats.todayCount, stats.goal)} sur ${stats.goal}`}
          />
          <span className="text-xs leading-tight" style={{ color: 'var(--text-secondary)' }}>
            <span className="block font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {Math.min(stats.todayCount, stats.goal)}/{stats.goal}
            </span>
            aujourd’hui
          </span>
        </div>
      </div>
    </div>
  )
}
