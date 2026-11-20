'use client'

/**
 * Accueil « accès libre » — composition de la maquette : salutation, carte de
 * la ressource en cours, quatre tuiles de statistique, courbe d'activité,
 * répartition par niveau, puis le catalogue.
 *
 * Toutes les valeurs viennent de la progression réelle (`useParcours`) ;
 * aucune donnée de démonstration.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  CheckCircle2,
  ExternalLink,
  Flame,
  Layers,
  Shuffle,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useParcours } from '@/lib/use-parcours'
import { useNowPlaying, useOpenResource } from '@/lib/use-now'
import { LEVELS, COURSES } from '@/lib/catalog'
import { dailyActivity, weeklyActivity, countSince, shares } from '@/lib/activity'
import { Surface, SectionCard } from '@/components/ui/Card'
import { StatTile } from '@/components/ui/StatTile'
import { SegmentedTabs } from '@/components/ui/Tabs'
import { AreaChart } from '@/components/ui/AreaChart'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { LevelCover } from '@/components/ui/LevelCover'
import { stagger, staggerItem } from '@/components/ui/PageTransition'
import { ModeSwitch } from '@/components/parcours/ModeSwitch'

type Range = 'jours' | 'semaines'

/** « Mercredi 20 novembre », sans année : on sait en quelle année on est. */
function todayLabel(): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Indian/Antananarivo',
  }).format(new Date())
}

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Indian/Antananarivo' }).format(
      new Date(),
    ),
  )
  if (hour < 12) return 'Bonjour'
  if (hour < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

export function LibreHome() {
  const { user } = useAuth()
  const { stats, path, courses, doneAt } = useParcours()
  const { current, isCurrentDone, pickRandom } = useNowPlaying()
  const openResource = useOpenResource()
  const router = useRouter()
  const [range, setRange] = useState<Range>('jours')

  const allSteps = useMemo(() => [...path, ...courses], [path, courses])
  const levelsStarted = allSteps.filter(s => s.done > 0).length
  const levelsComplete = allSteps.filter(s => s.complete).length
  const catalogTotal = allSteps.reduce((n, s) => n + s.total, 0)

  const chart = useMemo(
    () =>
      range === 'jours'
        ? dailyActivity(doneAt, 14).map(p => ({ label: p.day.slice(8) + '/' + p.day.slice(5, 7), value: p.count }))
        : weeklyActivity(doneAt, 9).map(p => ({ label: p.label, value: p.count })),
    [doneAt, range],
  )

  const mix = useMemo(
    () => shares(allSteps.map(s => ({ name: s.name, accent: s.accent, count: s.done }))).slice(0, 6),
    [allSteps],
  )

  const lastSeven = countSince(doneAt, 7)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-10">
      {/* Salutation */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
            {greeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm mt-1 first-letter:uppercase" style={{ color: 'var(--text-muted)' }}>
            {todayLabel()} · {stats.doneCount} ressource{stats.doneCount > 1 ? 's' : ''} terminée
            {stats.doneCount > 1 ? 's' : ''}, {levelsStarted} niveau{levelsStarted > 1 ? 'x' : ''} entamé
            {levelsStarted > 1 ? 's' : ''}
          </p>
        </div>
        <ModeSwitch />
      </div>

      {/* Ressource en cours + tuiles */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] gap-4 mb-4">
        {current && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5"
            style={{ background: 'var(--tile-peach)', color: 'var(--tile-ink)', borderRadius: 'var(--radius-xl)' }}
          >
            <div className="flex-1 min-w-0 order-2 sm:order-1">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.7rem] font-bold mb-3"
                style={{ background: 'rgba(27, 42, 74, 0.1)' }}
              >
                <Sparkles size={12} aria-hidden="true" />
                {isCurrentDone ? 'Dernière ressource vue' : 'À reprendre'}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight mb-1 line-clamp-2">
                {current.title}
              </h2>
              <p className="text-sm mb-4" style={{ opacity: 0.75 }}>
                {current.levelName} · {current.category}
              </p>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => openResource(current)}
                  className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full text-sm font-bold transition-transform hover:scale-[1.03] active:scale-95"
                  style={{ background: 'var(--coral-deep)', color: '#f7f5f0' }}
                >
                  <ExternalLink size={15} aria-hidden="true" />
                  Ouvrir
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pick = pickRandom()
                    router.push(pick ? `/dashboard/levels/${pick.levelSlug}` : '/dashboard/levels')
                  }}
                  className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full text-sm font-semibold transition-transform hover:scale-[1.03] active:scale-95"
                  style={{ border: '1px solid rgba(27, 42, 74, 0.2)' }}
                >
                  <Shuffle size={15} aria-hidden="true" />
                  Au hasard
                </button>

                <span className="flex items-center gap-2.5 ml-1">
                  <ProgressRing
                    value={stats.todayCount}
                    max={stats.goal}
                    size={42}
                    thickness={5}
                    color="var(--coral-deep)"
                    track="rgba(27, 42, 74, 0.14)"
                    label={`Objectif du jour : ${Math.min(stats.todayCount, stats.goal)} sur ${stats.goal}`}
                  />
                  <span className="text-xs leading-tight">
                    <span className="block font-bold">
                      {Math.min(stats.todayCount, stats.goal)}/{stats.goal} aujourd’hui
                    </span>
                    <span style={{ opacity: 0.7 }}>
                      {stats.goalReached ? 'Objectif atteint.' : 'Objectif du jour'}
                    </span>
                  </span>
                </span>
              </div>
            </div>

            <span
              className="order-1 sm:order-2 w-24 sm:w-32 flex-shrink-0 rounded-[18px] overflow-hidden"
              style={{ boxShadow: '0 12px 32px rgba(27, 42, 74, 0.18)' }}
            >
              <LevelCover
                slug={current.levelSlug}
                accent={current.accent as (typeof LEVELS)[number]['accent']}
                code={[...LEVELS, ...COURSES].find(l => l.slug === current.levelSlug)?.code ?? ''}
              />
            </span>
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-3 content-start">
          <StatTile
            index={0}
            tone="sage"
            icon={CheckCircle2}
            label="Terminées"
            value={stats.doneCount}
            hint={lastSeven > 0 ? `+${lastSeven} sur 7 jours` : `sur ${catalogTotal} au catalogue`}
          />
          <StatTile
            index={1}
            tone="sand"
            icon={Layers}
            label="Niveaux bouclés"
            value={levelsComplete}
            hint={`sur ${allSteps.length} parcours`}
          />
          <StatTile
            index={2}
            tone="sky"
            icon={BookOpen}
            label="Pages tournées"
            value={stats.pages}
            hint="10 pages par ressource"
          />
          <StatTile
            index={3}
            tone="peach"
            icon={Flame}
            label="Série"
            value={stats.streak}
            hint={`meilleure : ${stats.bestStreak} j`}
          />
        </div>
      </div>

      {/* Activité + répartition */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] gap-4 mb-10">
        <SectionCard
          title="Votre activité"
          subtitle={range === 'jours' ? 'Ressources terminées, 14 derniers jours' : 'Ressources terminées par semaine'}
          action={
            <SegmentedTabs
              idPrefix="activite"
              label="Période du graphique"
              value={range}
              onChange={setRange}
              items={[
                { id: 'jours', label: 'Jours' },
                { id: 'semaines', label: 'Semaines' },
              ]}
            />
          }
        >
          <AreaChart
            key={range}
            points={chart}
            height={190}
            ariaLabel={
              range === 'jours'
                ? 'Ressources terminées chaque jour sur les 14 derniers jours'
                : 'Ressources terminées chaque semaine sur les 9 dernières semaines'
            }
            unit="ressources"
          />
        </SectionCard>

        <SectionCard
          title="Répartition"
          subtitle={`${stats.doneCount} ressource${stats.doneCount > 1 ? 's' : ''} par niveau`}
          action={
            <Link
              href="/dashboard/stats"
              className="inline-flex items-center gap-1 text-xs font-semibold"
              style={{ color: 'var(--coral-text)' }}
            >
              Stats <ArrowRight size={12} aria-hidden="true" />
            </Link>
          }
        >
          {mix.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>
              Terminez une première ressource et la répartition apparaîtra ici.
            </p>
          ) : (
            <>
              {/* Bandeau de parts */}
              <div className="flex gap-1 h-2.5 mb-4 rounded-full overflow-hidden" aria-hidden="true">
                {mix.map(m => (
                  <motion.span
                    key={m.name}
                    initial={{ flexGrow: 0 }}
                    animate={{ flexGrow: m.count }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    style={{ background: `var(--acc-${m.accent})`, flexBasis: 0, minWidth: 4 }}
                    className="rounded-full"
                  />
                ))}
              </div>
              <ul className="flex flex-col gap-2.5">
                {mix.map(m => (
                  <li key={m.name} className="flex items-center gap-2.5 text-sm">
                    <span
                      aria-hidden="true"
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: `var(--acc-${m.accent})` }}
                    />
                    <span className="truncate flex-1" style={{ color: 'var(--text-secondary)' }}>
                      {m.name}
                    </span>
                    <span className="tabular-nums font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {m.share}%
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </SectionCard>
      </div>

      {/* Catalogue */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Niveaux généraux
        </h2>
        <Link
          href="/dashboard/levels"
          className="text-sm flex items-center gap-1 hover:text-coral transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          Tout le catalogue <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10"
      >
        {path.map(step => {
          const pct = step.total === 0 ? 0 : Math.round((step.done / step.total) * 100)
          return (
            <motion.div key={step.slug} variants={staggerItem}>
              <Link href={step.href} className="block group">
                <span
                  className="block rounded-[var(--radius-lg)] overflow-hidden mb-2 transition-transform duration-300 group-hover:-translate-y-1"
                  style={{ boxShadow: 'var(--shadow-soft)' }}
                >
                  <LevelCover slug={step.slug} accent={step.accent} code={step.code} />
                </span>
                <span
                  className="block text-sm font-semibold truncate group-hover:text-coral transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {step.name}
                </span>
                <span className="block text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  {step.complete ? 'Bouclé' : `${step.done}/${step.total} · ${pct}%`}
                </span>
              </Link>
            </motion.div>
          )
        })}
      </motion.div>

      <h2 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
        Parcours spécialisés
      </h2>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {courses.map(step => {
          const pct = step.total === 0 ? 0 : Math.round((step.done / step.total) * 100)
          return (
            <motion.div key={step.slug} variants={staggerItem}>
              <Surface as={Link} href={step.href} interactive className="flex items-center gap-4 p-3">
                <span className="w-14 flex-shrink-0 rounded-[12px] overflow-hidden">
                  <LevelCover slug={step.slug} accent={step.accent} code={step.code} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {step.name}
                  </span>
                  <span className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    {step.complete ? 'Bouclé' : `${step.done} sur ${step.total}`}
                  </span>
                  <span
                    className="block h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--bg-sunken)' }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progression ${step.name}`}
                  >
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${pct}%`, background: `var(--acc-${step.accent})` }}
                    />
                  </span>
                </span>
                <Bookmark
                  size={16}
                  aria-hidden="true"
                  className="flex-shrink-0"
                  style={{ color: step.complete ? 'var(--coral)' : 'var(--text-muted)', fill: step.complete ? 'var(--coral)' : 'none' }}
                />
              </Surface>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
