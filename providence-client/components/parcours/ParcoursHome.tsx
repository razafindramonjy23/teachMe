'use client'

/**
 * Accueil « parcours guidé » — le chemin d'étapes, dans la coquille et le
 * langage visuel de la maquette (surfaces arrondies, tuiles pastel, entrées
 * animées). La géométrie du chemin et les règles de jeu sont inchangées :
 * seule la mise en forme autour a été reprise.
 */

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Check, Flame, PlayCircle, Stamp, Target } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useProgress } from '@/lib/progress'
import { useParcours, type PathStep } from '@/lib/use-parcours'
import { Surface, SectionCard } from '@/components/ui/Card'
import { StatTile } from '@/components/ui/StatTile'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { LevelCover } from '@/components/ui/LevelCover'
import { stagger, staggerItem } from '@/components/ui/PageTransition'
import { ModeSwitch, BUBBLE_PATH } from './ModeSwitch'

// Géométrie du chemin : colonne de 320 px, étapes alternées gauche / droite
const COL = 320
const ROW = 120
const X_LEFT = 80
const X_RIGHT = 240
const NODE = 76
const NODE_FOCUS = 88

function nodeCenter(i: number) {
  return { x: i % 2 === 0 ? X_LEFT : X_RIGHT, y: 60 + i * ROW }
}

function segment(i: number) {
  const a = nodeCenter(i)
  const b = nodeCenter(i + 1)
  return `M${a.x} ${a.y} C${a.x} ${a.y + 60} ${b.x} ${b.y - 60} ${b.x} ${b.y}`
}

function plural(n: number, word: string) {
  return `${n} ${word}${n > 1 ? 's' : ''}`
}

/** Le message de la bulle : un seul encouragement, le plus utile du moment. */
function bubbleMessage(s: { todayCount: number; goal: number; goalReached: boolean; streak: number; streakAtRisk: boolean }) {
  if (s.todayCount === 0 && s.streakAtRisk) {
    return `Votre série de ${plural(s.streak, 'jour')} est en jeu : terminez une ressource aujourd’hui pour la garder.`
  }
  if (s.todayCount === 0) return 'Terminez une ressource aujourd’hui et votre série commence.'
  if (!s.goalReached) {
    const left = s.goal - s.todayCount
    return `Encore ${plural(left, 'ressource')} et l’objectif du jour est atteint.`
  }
  return 'Objectif du jour atteint. Revenez demain pour prolonger votre série.'
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

function PathNode({ step, index, isFocus }: { step: PathStep; index: number; isFocus: boolean }) {
  const { x, y } = nodeCenter(index)
  const size = isFocus ? NODE_FOCUS : NODE
  const top = y - 0.41 * size
  const state = step.complete ? 'complete' : isFocus ? 'focus' : step.done > 0 ? 'started' : 'todo'

  const shape = {
    complete: { fill: 'var(--text-primary)', stroke: 'none', strokeWidth: 0, dash: undefined },
    focus: { fill: 'var(--coral)', stroke: 'var(--coral-deep)', strokeWidth: 4, dash: undefined },
    started: { fill: 'var(--bg-card)', stroke: 'var(--coral)', strokeWidth: 4, dash: undefined },
    todo: { fill: 'var(--bg-secondary)', stroke: 'var(--text-muted)', strokeWidth: 3, dash: '7 6' },
  }[state]

  const status = step.complete
    ? 'bouclé'
    : `${step.done} sur ${step.total}${isFocus ? ' · recommandé' : ''}`
  const onLeft = index % 2 === 0

  return (
    <>
      {isFocus && (
        <motion.span
          aria-hidden="true"
          className="absolute rounded-full"
          style={{ left: x - 58, top: y - 58, width: 116, height: 116, background: 'var(--acc-coral-soft)' }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
      )}
      <Link
        href={step.href}
        aria-label={`${step.name}, ${step.code} : ${step.done} ressources terminées sur ${step.total}${step.complete ? ', bouclé' : ''}${isFocus ? ', étape recommandée' : ''}`}
        className="absolute block rounded-3xl transition-transform hover:scale-105"
        style={{ left: x - size / 2, top, width: size, height: size }}
      >
        <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" className="block">
          <path
            d={BUBBLE_PATH}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            strokeDasharray={shape.dash}
            strokeOpacity={state === 'todo' ? 0.55 : 1}
          />
        </svg>
        <span className="absolute left-0 top-0 flex items-center justify-center" style={{ width: size, height: size * 0.76 }}>
          {state === 'complete' ? (
            <Check size={28} strokeWidth={3} aria-hidden="true" style={{ color: 'var(--bg-primary)' }} />
          ) : (
            <span
              className="font-display font-bold"
              style={{
                fontSize: isFocus ? 26 : 20,
                color: state === 'focus' ? 'var(--navy)' : state === 'started' ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {step.code}
            </span>
          )}
        </span>
      </Link>
      <div
        className="absolute"
        style={
          onLeft
            ? { left: x + size / 2 + 12, top: y - 20, width: COL - (x + size / 2 + 12) }
            : { left: 0, top: y - 20, width: x - size / 2 - 12, textAlign: 'right' }
        }
      >
        <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{step.name}</p>
        <p
          className="text-xs mt-1"
          style={{ color: isFocus ? 'var(--coral-text)' : 'var(--text-secondary)', fontWeight: isFocus ? 600 : 400 }}
        >
          {step.code} · {status}
        </p>
      </div>
    </>
  )
}

export function ParcoursHome() {
  const { user } = useAuth()
  const { markOpened } = useProgress()
  const { isLoading, stats, path, courses, focus, stamps, resume } = useParcours()

  const focusStep = path.find(s => s.slug === focus) ?? null
  const earned = stamps.filter(s => s.earned).length
  const height = path.length * ROW

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-10">
      {/* En-tête */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
            {greeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Votre anglais, une page par jour.
          </p>
        </div>
        <ModeSwitch />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        {/* Colonne latérale : série, objectif, actions (en premier sur téléphone) */}
        <aside className="lg:order-last flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <StatTile index={0} tone="peach" icon={Flame} label="Série" value={stats.streak} hint={`meilleure : ${stats.bestStreak} j`} />
            <StatTile index={1} tone="sky" icon={BookOpen} label="Pages tournées" value={stats.pages} hint="10 par ressource" />
          </div>

          <SectionCard title="Objectif du jour" subtitle={stats.goalReached ? 'Atteint' : `${stats.goal} ressources`}>
            <div className="flex items-center gap-4 mb-4">
              <ProgressRing
                value={stats.todayCount}
                max={stats.goal}
                size={64}
                thickness={7}
                label={`Objectif du jour : ${Math.min(stats.todayCount, stats.goal)} sur ${stats.goal}`}
              >
                <span className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {Math.min(stats.todayCount, stats.goal)}/{stats.goal}
                </span>
              </ProgressRing>
              <p
                className="flex-1 text-sm leading-relaxed px-4 py-3"
                style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)', borderRadius: '14px 14px 4px 14px' }}
              >
                {isLoading ? '…' : bubbleMessage(stats)}
              </p>
            </div>

            {focusStep ? (
              <Link href={focusStep.href} className="btn-chunky w-full">
                Continuer · {focusStep.name}
              </Link>
            ) : (
              <Link href="/dashboard/levels" className="btn-chunky w-full">
                Tout est bouclé · voir le catalogue
              </Link>
            )}

            {resume && (
              <a
                href={resume.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => markOpened(resume.id, resume.levelSlug)}
                className="flex items-center gap-2 text-sm mt-3 rounded-lg -mx-1 px-1 py-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                <PlayCircle size={16} aria-hidden="true" style={{ color: 'var(--coral-text)', flexShrink: 0 }} />
                <span className="truncate">Reprendre « {resume.title} »</span>
              </a>
            )}
          </SectionCard>

          <Surface as={Link} href="/dashboard/tampons" interactive className="group p-4 flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--acc-coral-soft)' }}
            >
              <Stamp size={20} aria-hidden="true" style={{ color: 'var(--coral-text)' }} />
            </span>
            <span className="flex-1">
              <span className="block font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Carnet de tampons
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {earned} sur {stamps.length} obtenus
              </span>
            </span>
            <ArrowRight
              size={16}
              aria-hidden="true"
              className="group-hover:translate-x-1 transition-transform"
              style={{ color: 'var(--text-muted)' }}
            />
          </Surface>

          <Surface as={Link} href="/dashboard/stats" interactive className="group p-4 flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--acc-blue-soft)' }}
            >
              <Target size={20} aria-hidden="true" style={{ color: 'var(--acc-blue)' }} />
            </span>
            <span className="flex-1">
              <span className="block font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Vos statistiques
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Activité, rythme et série
              </span>
            </span>
            <ArrowRight
              size={16}
              aria-hidden="true"
              className="group-hover:translate-x-1 transition-transform"
              style={{ color: 'var(--text-muted)' }}
            />
          </Surface>
        </aside>

        {/* Le chemin */}
        <div>
          <Surface className="p-5">
            <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
              Votre parcours
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Du niveau A1 au C1, une étape à la fois. Toutes les étapes restent ouvertes.
            </p>

            <motion.nav
              aria-label="Étapes du parcours"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="relative mx-auto my-6"
              style={{ width: COL, height }}
            >
              <svg width={COL} height={height} viewBox={`0 0 ${COL} ${height}`} aria-hidden="true" className="absolute inset-0">
                {path.slice(0, -1).map((step, i) => (
                  <path
                    key={`base-${step.slug}`}
                    d={segment(i)}
                    fill="none"
                    stroke="var(--text-muted)"
                    strokeOpacity={0.35}
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeDasharray="2 10"
                  />
                ))}
                {path.slice(0, -1).map((step, i) =>
                  step.complete ? (
                    <motion.path
                      key={`done-${step.slug}`}
                      d={segment(i)}
                      fill="none"
                      stroke="var(--text-primary)"
                      strokeOpacity={0.45}
                      strokeWidth={4}
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, delay: 0.1 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    />
                  ) : null,
                )}
              </svg>
              {path.map((step, i) => (
                <PathNode key={step.slug} step={step} index={i} isFocus={step.slug === focus} />
              ))}
            </motion.nav>
          </Surface>

          {/* Parcours spécialisés */}
          <h2 className="font-display text-2xl font-bold mt-6 mb-4" style={{ color: 'var(--text-primary)' }}>
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
                  <Surface as={Link} href={step.href} interactive className="flex items-center gap-3 p-3">
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
                  </Surface>
                </motion.div>
              )
            })}
          </motion.div>

          <p className="mt-6 text-sm">
            <Link href="/dashboard/levels" className="font-medium" style={{ color: 'var(--coral-text)' }}>
              Voir tout le catalogue →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
