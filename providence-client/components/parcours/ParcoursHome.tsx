'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, BookOpen, Bookmark, ArrowRight, PlayCircle, Plane, Briefcase, GraduationCap, Globe, Stamp } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useProgress } from '@/lib/progress'
import { COURSES, type CourseItem } from '@/lib/catalog'
import { useParcours, type PathStep } from '@/lib/use-parcours'
import { ModeSwitch, BUBBLE_PATH } from './ModeSwitch'

const COURSE_ICONS: Record<CourseItem['iconName'], typeof Plane> = {
  plane: Plane,
  briefcase: Briefcase,
  graduation: GraduationCap,
  globe: Globe,
}

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
        <span
          aria-hidden="true"
          className="absolute rounded-full"
          style={{ left: x - 58, top: y - 58, width: 116, height: 116, background: 'var(--acc-coral-soft)' }}
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
  const ringLength = 2 * Math.PI * 26
  const ringProgress = Math.min(stats.todayCount / stats.goal, 1)
  const height = path.length * ROW

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* En-tête */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--coral-text)' }}>Bonjour, {user?.name}</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
            Votre anglais, une page par jour.
          </h1>
        </div>
        <ModeSwitch />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-10 items-start">
        {/* Colonne latérale : série, objectif, actions (en premier sur téléphone) */}
        <aside className="lg:order-last flex flex-col gap-4">
          <div className="flex gap-3">
            <div
              className="flex-1 rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <Bookmark size={22} aria-hidden="true" style={{ color: 'var(--coral-deep)', fill: 'var(--coral)' }} />
              <p className="leading-tight">
                <span className="block font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.streak}</span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{stats.streak > 1 ? 'jours d’affilée' : 'jour d’affilée'}</span>
              </p>
            </div>
            <div
              className="flex-1 rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <BookOpen size={22} aria-hidden="true" style={{ color: 'var(--text-primary)' }} />
              <p className="leading-tight">
                <span className="block font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.pages}</span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>pages tournées</span>
              </p>
            </div>
          </div>

          <section
            aria-label="Objectif du jour"
            className="rounded-2xl p-5 flex flex-col gap-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="var(--bg-secondary)" strokeWidth="7" />
                  <circle
                    cx="32" cy="32" r="26" fill="none" stroke="var(--coral)" strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={ringLength}
                    strokeDashoffset={ringLength * (1 - ringProgress)}
                    transform="rotate(-90 32 32)"
                    style={{ transition: 'stroke-dashoffset .5s ease' }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {Math.min(stats.todayCount, stats.goal)}/{stats.goal}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Objectif du jour</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {stats.goalReached ? 'Atteint' : `${stats.goal} ressources`}
                </p>
              </div>
            </div>
            <p
              className="text-sm leading-relaxed px-4 py-3"
              style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)', borderRadius: '14px 14px 14px 4px' }}
            >
              {isLoading ? '…' : bubbleMessage(stats)}
            </p>
            {focusStep ? (
              <Link href={focusStep.href} className="btn-chunky w-full">
                Continuer · {focusStep.name}
              </Link>
            ) : (
              <Link href="/dashboard/levels" className="btn-chunky w-full">
                Tout est bouclé · voir les niveaux
              </Link>
            )}
            {resume && (
              <a
                href={resume.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => markOpened(resume.id, resume.levelSlug)}
                className="flex items-center gap-2 text-sm rounded-lg -mx-1 px-1 py-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                <PlayCircle size={16} aria-hidden="true" style={{ color: 'var(--coral-text)', flexShrink: 0 }} />
                <span className="truncate">Reprendre « {resume.title} »</span>
              </a>
            )}
          </section>

          <Link
            href="/dashboard/tampons"
            className="group rounded-2xl p-4 flex items-center gap-3"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--acc-coral-soft)' }}>
              <Stamp size={20} aria-hidden="true" style={{ color: 'var(--coral-text)' }} />
            </span>
            <span className="flex-1">
              <span className="block font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Carnet de tampons</span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{earned} sur {stamps.length} obtenus</span>
            </span>
            <ArrowRight size={16} aria-hidden="true" className="group-hover:translate-x-1 transition-transform" style={{ color: 'var(--text-muted)' }} />
          </Link>
        </aside>

        {/* Le chemin */}
        <div>
          <div className="mb-2">
            <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Votre parcours</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Du niveau A1 au C1, une étape à la fois. Toutes les étapes restent ouvertes.
            </p>
          </div>

          <motion.nav
            aria-label="Étapes du parcours"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
                  <path
                    key={`done-${step.slug}`}
                    d={segment(i)}
                    fill="none"
                    stroke="var(--text-primary)"
                    strokeOpacity={0.45}
                    strokeWidth={4}
                    strokeLinecap="round"
                  />
                ) : null,
              )}
            </svg>
            {path.map((step, i) => (
              <PathNode key={step.slug} step={step} index={i} isFocus={step.slug === focus} />
            ))}
          </motion.nav>

          {/* Parcours spécialisés */}
          <h2 className="font-display text-2xl font-bold mt-4 mb-4" style={{ color: 'var(--text-primary)' }}>Parcours spécialisés</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {courses.map(step => {
              const meta = COURSES.find(c => c.slug === step.slug)
              const Icon = meta ? COURSE_ICONS[meta.iconName] : Globe
              const pct = step.total === 0 ? 0 : Math.round((step.done / step.total) * 100)
              return (
                <Link
                  key={step.slug}
                  href={step.href}
                  className="card-glow rounded-2xl p-4 flex items-center gap-4"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <span
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `var(--acc-${step.accent}-soft)` }}
                  >
                    <Icon size={20} aria-hidden="true" style={{ color: `var(--acc-${step.accent})` }} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{step.name}</span>
                    <span className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      {step.complete ? 'Bouclé' : `${step.done} sur ${step.total}`}
                    </span>
                    <span
                      className="block h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'var(--bg-secondary)' }}
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progression ${step.name}`}
                    >
                      <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: `var(--acc-${step.accent})` }} />
                    </span>
                  </span>
                </Link>
              )
            })}
          </div>
          <p className="mt-6 text-sm">
            <Link href="/dashboard/levels" className="font-medium" style={{ color: 'var(--coral-text)' }}>
              Voir tous les niveaux et ressources →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
