'use client'

/**
 * Page d'un niveau : en-tête avec pochette et avancement, puis les ressources
 * par catégorie. La logique de coche et de célébration est inchangée ; seule
 * la mise en forme suit la nouvelle coquille.
 */

import { useCallback, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check, ExternalLink } from 'lucide-react'
import { levelData, ICON_MAP, resourceId, levelResourceCount, levelResourceIds } from '@/lib/resources'
import { useProgress } from '@/lib/progress'
import { useAuth } from '@/lib/auth'
import { useParcours } from '@/lib/use-parcours'
import { LEVELS, COURSES, type Accent } from '@/lib/catalog'
import { Surface } from '@/components/ui/Card'
import { LevelCover } from '@/components/ui/LevelCover'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { stagger, staggerItem } from '@/components/ui/PageTransition'
import { Celebration, type CelebrationEvent } from '@/components/parcours/Celebration'

export default function LevelPage() {
  const { slug } = useParams<{ slug: string }>()
  const level = levelData[slug]
  const { markOpened, toggleDone, isDone, countDone } = useProgress()
  const { user } = useAuth()
  const parcoursMode = user?.homeMode === 'parcours'
  const { stats } = useParcours()
  const [event, setEvent] = useState<CelebrationEvent | null>(null)
  const clearEvent = useCallback(() => setEvent(null), [])

  if (!level) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Niveau introuvable
        </h1>
        <Link href="/dashboard/levels" className="text-sm" style={{ color: 'var(--coral-text)' }}>
          ← Retour au catalogue
        </Link>
      </div>
    )
  }

  const total = levelResourceCount(slug)
  const done = countDone(levelResourceIds(slug))
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  const accent = level.accent as Accent
  const code = [...LEVELS, ...COURSES].find(l => l.slug === slug)?.code ?? level.code

  // Coche + célébration (mode parcours uniquement). Les valeurs de `stats`
  // sont celles d'avant la coche : on en déduit ce que la coche déclenche.
  const handleToggle = (id: string) => {
    const becomingDone = !isDone(id)
    toggleDone(id, slug)
    if (!parcoursMode || !becomingDone) return
    const key = Date.now()
    const todayAfter = stats.todayCount + 1
    if (done + 1 === total) {
      setEvent({ kind: 'level', name: level.name, code: level.code, key })
    } else if (todayAfter === stats.goal) {
      setEvent({ kind: 'goal', streak: stats.todayCount === 0 ? stats.streak + 1 : stats.streak, key })
    } else {
      const left = stats.goal - todayAfter
      setEvent({
        kind: 'page',
        key,
        detail:
          left > 0
            ? `Encore ${left} ressource${left > 1 ? 's' : ''} pour l’objectif du jour.`
            : 'Objectif du jour déjà atteint.',
      })
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-10">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col sm:flex-row items-start sm:items-end gap-5 mb-8"
      >
        <span
          className="w-28 sm:w-36 flex-shrink-0 rounded-[var(--radius-lg)] overflow-hidden"
          style={{ boxShadow: 'var(--shadow-lift)' }}
        >
          <LevelCover slug={slug} accent={accent} code={code} />
        </span>

        <div className="flex-1 min-w-0">
          <span
            className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-mono mb-2"
            style={{
              background: `var(--acc-${accent}-soft)`,
              color: `var(--acc-${accent})`,
              border: `1px solid var(--acc-${accent}-line)`,
            }}
          >
            {code}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {level.name}
          </h1>
          <p className="text-base max-w-2xl mb-4" style={{ color: 'var(--text-secondary)' }}>
            {level.desc}
          </p>

          {total > 0 && (
            <div className="flex items-center gap-4 max-w-md">
              <ProgressRing
                value={done}
                max={total}
                size={48}
                thickness={6}
                color={`var(--acc-${accent})`}
                label={`Progression du niveau ${level.name} : ${done} sur ${total}`}
              />
              <div className="flex-1">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {done} sur {total} terminées
                  </span>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: `var(--acc-${accent})` }}>
                    {pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-sunken)' }} aria-hidden="true">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `var(--acc-${accent})` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Catégories */}
      {level.categories.length === 0 && (
        <div
          className="rounded-[var(--radius-lg)] px-6 py-14 text-center"
          style={{ border: '1px dashed var(--border)' }}
        >
          <p className="font-semibold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
            Ressources en préparation
          </p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            Les exercices de ce niveau arrivent bientôt.
          </p>
          <Link href="/dashboard/levels" className="text-sm font-medium" style={{ color: 'var(--coral-text)' }}>
            Voir les autres parcours →
          </Link>
        </div>
      )}

      <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-6">
        {level.categories.map(cat => {
          const CatIcon = ICON_MAP[cat.label] || cat.icon
          const catDone = countDone(cat.links.map(l => resourceId(l.url)))

          return (
            <motion.section key={cat.label} variants={staggerItem}>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `var(--acc-${accent}-soft)` }}
                >
                  <CatIcon size={15} aria-hidden="true" style={{ color: `var(--acc-${accent})` }} />
                </span>
                <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                  {cat.label}
                </h2>
                {cat.links.length > 0 && (
                  <span className="text-xs font-medium ml-auto tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {catDone}/{cat.links.length}
                  </span>
                )}
              </div>

              {cat.links.length === 0 && (
                <p
                  className="rounded-[var(--radius-lg)] px-4 py-6 text-sm text-center"
                  style={{ border: '1px dashed var(--border)', color: 'var(--text-muted)' }}
                >
                  Aucune ressource pour cette catégorie pour le moment.
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {cat.links.map(link => {
                  const id = resourceId(link.url)
                  const checked = isDone(id)

                  return (
                    <Surface key={link.url} interactive className="group flex items-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(id)}
                        aria-pressed={checked}
                        aria-label={
                          checked
                            ? `Marquer « ${link.title} » comme non terminée`
                            : `Marquer « ${link.title} » comme terminée`
                        }
                        className={parcoursMode ? 'check-chunky m-1.5' : 'tap-target flex-shrink-0'}
                      >
                        {parcoursMode ? (
                          checked && <Check size={20} strokeWidth={3} aria-hidden="true" style={{ color: 'var(--navy)' }} />
                        ) : (
                          <span
                            className="w-5 h-5 rounded-md flex items-center justify-center transition-colors"
                            style={
                              checked ? { background: `var(--acc-${accent})` } : { border: '1.5px solid var(--border)' }
                            }
                          >
                            {checked && <Check size={13} strokeWidth={3} style={{ color: 'var(--bg-card)' }} />}
                          </span>
                        )}
                      </button>

                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => markOpened(id, slug)}
                        className="flex-1 min-w-0 flex items-center justify-between gap-2 py-3 pr-4 text-sm"
                      >
                        <span
                          className={`font-medium truncate transition-colors group-hover:text-coral ${checked ? 'line-through' : ''}`}
                          style={{ color: checked ? 'var(--text-muted)' : 'var(--text-primary)' }}
                        >
                          {link.title}
                        </span>
                        <ExternalLink
                          size={12}
                          aria-hidden="true"
                          className="flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                          style={{ color: `var(--acc-${accent})` }}
                        />
                      </a>
                    </Surface>
                  )
                })}
              </div>
            </motion.section>
          )
        })}
      </motion.div>

      <Celebration event={event} onDone={clearEvent} />
    </div>
  )
}
