'use client'

/**
 * Statistiques de l'apprenant — trois vues : vue d'ensemble, historique,
 * série et objectif.
 *
 * Tout est calculé à partir des `done_at` de `resource_progress` (lib/activity,
 * lib/gamification). Aucune donnée n'est inventée : quand il n'y a rien, on le
 * dit, on n'affiche pas une courbe plate qui ressemblerait à une mesure.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, CheckCircle2, Clock, ExternalLink, Flame, Layers, Target } from 'lucide-react'
import { useParcours } from '@/lib/use-parcours'
import { useProgress } from '@/lib/progress'
import { resourceIndex } from '@/lib/resources'
import {
  countSince,
  dailyActivity,
  hourlyActivity,
  peakHour,
  perActiveDay,
  shares,
  shortDayLabel,
  weeklyActivity,
} from '@/lib/activity'
import { localDay } from '@/lib/gamification'
import { SectionCard, Surface } from '@/components/ui/Card'
import { StatTile } from '@/components/ui/StatTile'
import { Tabs } from '@/components/ui/Tabs'
import { AreaChart } from '@/components/ui/AreaChart'
import { HourDial, periodOf } from '@/components/ui/HourDial'
import { ActivityHeatmap } from '@/components/ui/ActivityHeatmap'
import { ProgressRing } from '@/components/ui/ProgressRing'

type View = 'ensemble' | 'historique' | 'serie'

const VIEWS = [
  { id: 'ensemble' as const, label: 'Vue d’ensemble' },
  { id: 'historique' as const, label: 'Historique' },
  { id: 'serie' as const, label: 'Série et objectif' },
]

/** « mercredi 18 novembre », pour les en-têtes de l'historique. */
function longDayLabel(day: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${day}T12:00:00Z`))
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-10 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
      {children}
    </p>
  )
}

export default function StatsPage() {
  const { stats, path, courses, doneAt } = useParcours()
  const { entries } = useProgress()
  const [view, setView] = useState<View>('ensemble')

  const allSteps = useMemo(() => [...path, ...courses], [path, courses])

  const weekly = useMemo(
    () => weeklyActivity(doneAt, 9).map(p => ({ label: p.label, value: p.count })),
    [doneAt],
  )
  const hours = useMemo(() => hourlyActivity(doneAt, 30), [doneAt])
  const peak = useMemo(() => peakHour(hours), [hours])
  const last30 = useMemo(() => dailyActivity(doneAt, 30), [doneAt])
  const last84 = useMemo(() => dailyActivity(doneAt, 84), [doneAt])

  const mix = useMemo(
    () => shares(allSteps.map(s => ({ name: s.name, accent: s.accent, count: s.done }))),
    [allSteps],
  )

  /** Ressources terminées, de la plus récente à la plus ancienne, par jour. */
  const history = useMemo(() => {
    const index = resourceIndex()
    const rows = Object.values(entries)
      .filter(e => e.doneAt && index.has(e.resourceId))
      .map(e => ({ at: e.doneAt as string, resource: index.get(e.resourceId)! }))
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 60)

    const byDay = new Map<string, typeof rows>()
    for (const row of rows) {
      const day = localDay(row.at)
      if (!byDay.has(day)) byDay.set(day, [])
      byDay.get(day)!.push(row)
    }
    return Array.from(byDay.entries())
  }, [entries])

  const activeView = VIEWS.find(v => v.id === view)!

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-10">
      <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
        Statistiques
      </h1>
      <p className="text-sm mt-1 mb-5" style={{ color: 'var(--text-muted)' }}>
        {stats.doneCount === 0
          ? 'Vos premières ressources terminées rempliront cette page.'
          : `${stats.doneCount} ressource${stats.doneCount > 1 ? 's' : ''} terminée${
              stats.doneCount > 1 ? 's' : ''
            } · ${countSince(doneAt, 30)} sur 30 jours`}
      </p>

      <div className="mb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <Tabs idPrefix="stats" label="Vues des statistiques" items={VIEWS} value={view} onChange={setView} />
      </div>

      <div
        role="tabpanel"
        id={`stats-panel-${view}`}
        aria-labelledby={`stats-tab-${view}`}
        tabIndex={-1}
        aria-label={activeView.label}
      >
        {view === 'ensemble' && (
          <motion.div
            key="ensemble"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <StatTile
                index={0}
                tone="sage"
                icon={CheckCircle2}
                label="Terminées · 30 jours"
                value={countSince(doneAt, 30)}
                hint={`${stats.doneCount} au total`}
              />
              <StatTile
                index={1}
                tone="peach"
                icon={BookOpen}
                label="Pages tournées"
                value={stats.pages}
                hint="10 par ressource"
              />
              <StatTile
                index={2}
                tone="sand"
                icon={Layers}
                label="Niveaux bouclés"
                value={allSteps.filter(s => s.complete).length}
                hint={`sur ${allSteps.length}`}
              />
              <StatTile
                index={3}
                tone="sky"
                icon={Clock}
                label="Par jour actif"
                value={perActiveDay(last30)}
                hint="moyenne sur 30 jours"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4">
              <SectionCard title="Neuf semaines" subtitle="Ressources terminées chaque semaine">
                {stats.doneCount === 0 ? (
                  <EmptyState>Rien à tracer pour l’instant.</EmptyState>
                ) : (
                  <AreaChart
                    points={weekly}
                    height={200}
                    ariaLabel="Ressources terminées chaque semaine sur les neuf dernières semaines"
                    unit="ressources"
                  />
                )}
              </SectionCard>

              <SectionCard title="Quand vous travaillez" subtitle="Par heure, 30 derniers jours">
                <div className="flex flex-col items-center">
                  <HourDial points={hours} peak={peak} />
                  {peak !== null && (
                    <p className="text-xs mt-3 text-center" style={{ color: 'var(--text-muted)' }}>
                      Vous terminez surtout vos ressources le {periodOf(peak).label}.
                    </p>
                  )}
                </div>
              </SectionCard>
            </div>

            <SectionCard className="mt-4" title="Répartition par niveau" subtitle="Ressources terminées, tous parcours confondus">
              {mix.length === 0 ? (
                <EmptyState>Aucune ressource terminée pour l’instant.</EmptyState>
              ) : (
                <ul className="flex flex-col gap-3">
                  {mix.map(m => (
                    <li key={m.name} className="flex items-center gap-3 text-sm">
                      <span className="w-40 truncate flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                        {m.name}
                      </span>
                      <span className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-sunken)' }}>
                        <motion.span
                          className="block h-full rounded-full"
                          style={{ background: `var(--acc-${m.accent})` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${m.share}%` }}
                          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </span>
                      <span
                        className="w-20 text-right tabular-nums font-semibold flex-shrink-0"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {m.count} · {m.share}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </motion.div>
        )}

        {view === 'historique' && (
          <motion.div
            key="historique"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-4"
          >
            {history.length === 0 ? (
              <Surface className="p-5">
                <EmptyState>
                  Aucune ressource terminée pour l’instant.{' '}
                  <Link href="/dashboard/levels" style={{ color: 'var(--coral-text)' }}>
                    Parcourir le catalogue
                  </Link>
                </EmptyState>
              </Surface>
            ) : (
              history.map(([day, rows]) => (
                <Surface key={day} className="p-5">
                  <div className="flex items-baseline justify-between gap-3 mb-3">
                    <h2
                      className="font-semibold text-sm first-letter:uppercase"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {longDayLabel(day)}
                    </h2>
                    <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      {rows.length} ressource{rows.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-1">
                    {rows.map(({ at, resource }) => (
                      <li key={resource.id}>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-3 py-2 px-2 -mx-2 rounded-[var(--radius-md)] transition-colors hover:bg-[var(--border-soft)]"
                        >
                          <span
                            aria-hidden="true"
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: `var(--acc-${resource.accent})` }}
                          />
                          <span className="min-w-0 flex-1">
                            <span
                              className="block text-sm font-medium truncate group-hover:text-coral transition-colors"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {resource.title}
                            </span>
                            <span className="block text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                              {resource.levelName} · {resource.category}
                            </span>
                          </span>
                          <span
                            className="text-xs tabular-nums flex-shrink-0"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {new Intl.DateTimeFormat('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'Indian/Antananarivo',
                            }).format(new Date(at))}
                          </span>
                          <ExternalLink
                            size={13}
                            aria-hidden="true"
                            className="flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
                            style={{ color: 'var(--text-muted)' }}
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                </Surface>
              ))
            )}
          </motion.div>
        )}

        {view === 'serie' && (
          <motion.div
            key="serie"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatTile index={0} tone="peach" icon={Flame} label="Série en cours" value={`${stats.streak} j`} hint={stats.streakAtRisk ? 'en jeu aujourd’hui' : 'tenue'} />
              <StatTile index={1} tone="sand" icon={Flame} label="Meilleure série" value={`${stats.bestStreak} j`} hint="record personnel" />
              <StatTile
                index={2}
                tone="sage"
                icon={Target}
                label="Objectif du jour"
                value={`${Math.min(stats.todayCount, stats.goal)}/${stats.goal}`}
                hint={stats.goalReached ? 'atteint' : 'en cours'}
              />
            </div>

            <SectionCard title="Objectif du jour" subtitle={`${stats.goal} ressources par jour`}>
              <div className="flex items-center gap-5">
                <ProgressRing
                  value={stats.todayCount}
                  max={stats.goal}
                  size={88}
                  thickness={9}
                  label={`Objectif du jour : ${Math.min(stats.todayCount, stats.goal)} sur ${stats.goal}`}
                >
                  <span className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {Math.min(stats.todayCount, stats.goal)}/{stats.goal}
                  </span>
                </ProgressRing>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {stats.goalReached
                    ? 'Objectif atteint pour aujourd’hui. Revenez demain pour prolonger votre série.'
                    : stats.streakAtRisk
                      ? `Votre série de ${stats.streak} jour${stats.streak > 1 ? 's' : ''} est en jeu : terminez une ressource aujourd’hui pour la garder.`
                      : `Encore ${stats.goal - stats.todayCount} ressource${
                          stats.goal - stats.todayCount > 1 ? 's' : ''
                        } et l’objectif du jour est atteint.`}
                </p>
              </div>
            </SectionCard>

            <SectionCard title="Douze dernières semaines" subtitle="Une case par jour ; les week-ends sont neutres">
              <ActivityHeatmap points={last84} />
            </SectionCard>

            <SectionCard title="Comment la série fonctionne" subtitle="Les mêmes règles que celles appliquées au calcul">
              <ul className="flex flex-col gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li>• Terminer au moins une ressource dans la journée prolonge la série.</li>
                <li>
                  • Les week-ends sont neutres : travailler un samedi compte, ne rien faire le week-end ne casse rien.
                </li>
                <li>• La série se rompt après un jour de semaine entier sans aucune ressource terminée.</li>
                <li>
                  • Les journées sont celles de Madagascar : une ressource terminée à 1 h du matin compte pour ce
                  jour-là.
                </li>
              </ul>
            </SectionCard>
          </motion.div>
        )}
      </div>

      {stats.doneCount > 0 && (
        <p className="text-xs mt-6 text-center" style={{ color: 'var(--text-muted)' }}>
          Première ressource terminée le {shortDayLabel(localDay(doneAt.slice().sort()[0]))}.
        </p>
      )}
    </div>
  )
}
