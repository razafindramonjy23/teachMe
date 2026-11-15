'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Plane, Briefcase, GraduationCap, Globe } from 'lucide-react'
import { LEVELS, COURSES, type CourseItem } from '@/lib/catalog'
import { levelResourceCount } from '@/lib/resources'
import { useProgress } from '@/lib/progress'

const ICONS: Record<CourseItem['iconName'], typeof Plane> = {
  plane: Plane,
  briefcase: Briefcase,
  graduation: GraduationCap,
  globe: Globe,
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

export default function LevelsIndexPage() {
  const { doneCountForLevel } = useProgress()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm mb-8 hover:text-coral transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Retour
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--coral-text)' }}>Catalogue</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Tous les niveaux
        </h1>
        <p className="text-base max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
          Six niveaux du cadre européen (CECRL) et quatre parcours spécialisés. Choisissez votre point de départ.
        </p>
      </motion.div>

      <div className="coral-divider mb-10" />

      <section className="mb-12">
        <h2 className="font-display text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          Niveaux généraux
        </h2>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {LEVELS.map(level => (
            <motion.div key={level.code} variants={item}>
              <Link href={level.href} className="block h-full">
                <div
                  className="card-glow rounded-xl p-5 h-full group"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono"
                      style={{
                        background: `var(--acc-${level.accent}-soft)`,
                        color: `var(--acc-${level.accent})`,
                        border: `1px solid var(--acc-${level.accent}-line)`,
                      }}
                    >
                      {level.code}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {levelResourceCount(level.slug)} ressources
                    </span>
                  </div>
                  <h3
                    className="font-semibold text-lg mb-1 group-hover:text-coral transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {level.name}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{level.desc}</p>

                  {(() => {
                    const total = levelResourceCount(level.slug)
                    const done = doneCountForLevel(level.slug)
                    const pct = total === 0 ? 0 : Math.round((done / total) * 100)
                    return (
                      <span className="block mt-4">
                        <span className="flex items-center justify-between text-xs mb-1.5">
                          <span style={{ color: 'var(--text-muted)' }}>{done}/{total} terminées</span>
                          <span className="font-medium" style={{ color: `var(--acc-${level.accent})` }}>{pct}%</span>
                        </span>
                        <span className="block h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}
                          role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
                          aria-label={`Progression ${level.name}`}>
                          <span className="block h-full rounded-full transition-[width] duration-500"
                            style={{ width: `${pct}%`, background: `var(--acc-${level.accent})` }} />
                        </span>
                      </span>
                    )
                  })()}

                  <span
                    className="mt-3 flex items-center gap-1 text-xs font-medium"
                    style={{ color: `var(--acc-${level.accent})` }}
                  >
                    Explorer{' '}
                    <ArrowRight size={12} aria-hidden="true" className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          Cours spécialisés
        </h2>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {COURSES.map(course => {
            const Icon = ICONS[course.iconName]
            return (
              <motion.div key={course.code} variants={item}>
                <Link href={course.href} className="block h-full">
                  <div
                    className="card-glow rounded-xl p-5 h-full group flex items-center gap-4"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  >
                    <span
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `var(--acc-${course.accent}-soft)`,
                        border: `1px solid var(--acc-${course.accent}-line)`,
                      }}
                    >
                      <Icon size={22} aria-hidden="true" style={{ color: `var(--acc-${course.accent})` }} />
                    </span>
                    <span className="flex-1">
                      <h3
                        className="font-semibold mb-0.5 group-hover:text-coral transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {course.name}
                      </h3>
                      <span className="text-sm block" style={{ color: 'var(--text-muted)' }}>{course.desc}</span>
                    </span>
                    <ArrowRight
                      size={16}
                      aria-hidden="true"
                      style={{ color: 'var(--text-muted)' }}
                      className="group-hover:translate-x-1 group-hover:text-coral transition-all flex-shrink-0"
                    />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </section>
    </div>
  )
}
