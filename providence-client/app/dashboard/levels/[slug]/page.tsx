'use client'

import { useCallback, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Check, Bookmark, BookOpen } from 'lucide-react'
import { levelData, ICON_MAP, resourceId, levelResourceCount, levelResourceIds } from '@/lib/resources'
import { useProgress } from '@/lib/progress'
import { useAuth } from '@/lib/auth'
import { useParcours } from '@/lib/use-parcours'
import { Celebration, type CelebrationEvent } from '@/components/parcours/Celebration'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

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
        <Link href="/dashboard" className="text-sm" style={{ color: 'var(--coral-text)' }}>
          ← Retour au tableau de bord
        </Link>
      </div>
    )
  }

  const total = levelResourceCount(slug)
  const done = countDone(levelResourceIds(slug))
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back */}
      <Link
        href="/dashboard/levels"
        className="inline-flex items-center gap-1.5 text-sm mb-8 hover:text-coral transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Tous les niveaux
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          {parcoursMode && (
            <span className="order-last ml-auto flex gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                <Bookmark size={15} aria-hidden="true" style={{ color: 'var(--coral-deep)', fill: 'var(--coral)' }} />
                {stats.streak}<span className="sr-only"> jours d’affilée</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                <BookOpen size={15} aria-hidden="true" />
                {stats.pages}<span className="sr-only"> pages tournées</span>
              </span>
            </span>
          )}
          <span
            className="px-3 py-1 rounded-lg text-sm font-bold font-mono"
            style={{
              background: `var(--acc-${level.accent}-soft)`,
              color: `var(--acc-${level.accent})`,
              border: `1px solid var(--acc-${level.accent}-line)`,
            }}
          >
            {level.code}
          </span>
        </div>
        <h1 className="font-display text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          {level.name}
        </h1>
        <p className="text-lg max-w-2xl mb-6" style={{ color: 'var(--text-secondary)' }}>
          {level.desc}
        </p>

        {/* Progression du niveau */}
        {total > 0 && (
          <div className="max-w-md">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {done} sur {total} terminées
              </span>
              <span className="text-sm font-semibold" style={{ color: `var(--acc-${level.accent})` }}>
                {pct}%
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: 'var(--bg-secondary)' }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progression du niveau ${level.name}`}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: `var(--acc-${level.accent})` }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Catégories */}
      {level.categories.length === 0 && (
        <div
          className="rounded-xl px-6 py-12 text-center"
          style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}
        >
          <p className="font-semibold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
            Ressources en préparation
          </p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            Les exercices de ce niveau arrivent bientôt.
          </p>
          <Link href="/dashboard/levels" className="text-sm font-medium" style={{ color: 'var(--coral-text)' }}>
            Voir les autres niveaux →
          </Link>
        </div>
      )}

      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-8">
        {level.categories.map(cat => {
          const CatIcon = ICON_MAP[cat.label] || cat.icon
          const catDone = countDone(cat.links.map(l => resourceId(l.url)))

          return (
            <motion.section key={cat.label} variants={item}>
              <div className="flex items-center gap-2 mb-3">
                <CatIcon size={16} aria-hidden="true" style={{ color: `var(--acc-${level.accent})` }} />
                <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {cat.label}
                </h2>
                {cat.links.length > 0 && (
                  <span className="text-xs font-medium ml-auto" style={{ color: 'var(--text-muted)' }}>
                    {catDone}/{cat.links.length}
                  </span>
                )}
              </div>

              {cat.links.length === 0 && (
                <p
                  className="rounded-xl px-4 py-6 text-sm text-center"
                  style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)', color: 'var(--text-muted)' }}
                >
                  Aucune ressource pour cette catégorie pour le moment.
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {cat.links.map(link => {
                  const id = resourceId(link.url)
                  const checked = isDone(id)

                  return (
                    <div
                      key={link.url}
                      className="group flex items-center rounded-xl transition-all hover:scale-[1.01]"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggle(id)}
                        aria-pressed={checked}
                        aria-label={
                          checked
                            ? `Marquer « ${link.title} » comme non terminée`
                            : `Marquer « ${link.title} » comme terminée`
                        }
                        className={parcoursMode ? 'check-chunky m-1.5' : 'tap-target flex-shrink-0 rounded-l-xl'}
                      >
                        {parcoursMode ? (
                          checked && <Check size={20} strokeWidth={3} aria-hidden="true" style={{ color: 'var(--navy)' }} />
                        ) : (
                          <span
                            className="w-5 h-5 rounded-md flex items-center justify-center transition-colors"
                            style={
                              checked
                                ? { background: `var(--acc-${level.accent})` }
                                : { border: '1.5px solid var(--border)' }
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
                          style={{ color: `var(--acc-${level.accent})` }}
                        />
                      </a>
                    </div>
                  )
                })}
              </div>
            </motion.section>
          )
        })}
      </motion.div>

      {/* Footer note */}
      <div className="mt-12 pt-8 text-center" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Ressources sélectionnées par teachMe Madagascar
        </p>
      </div>

      <Celebration event={event} onDone={clearEvent} />
    </div>
  )
}
