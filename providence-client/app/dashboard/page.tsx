'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { BookOpen, Target, CheckCircle2, ArrowRight, Globe, Briefcase, Plane, GraduationCap, PlayCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { LEVELS, COURSES, type CourseItem } from '@/lib/catalog'
import { levelData, levelResourceCount, totalResourceCount, resourceId } from '@/lib/resources'
import { useProgress } from '@/lib/progress'

const COURSE_ICONS: Record<CourseItem['iconName'], typeof Plane> = {
  plane: Plane,
  briefcase: Briefcase,
  graduation: GraduationCap,
  globe: Globe,
}

/** Retrouve le titre et le niveau d'une ressource à partir de son identifiant. */
function findResource(id: string) {
  for (const [slug, level] of Object.entries(levelData)) {
    for (const cat of level.categories) {
      for (const link of cat.links) {
        if (resourceId(slug, cat.label, link.title) === id) {
          return { slug, levelName: level.name, accent: level.accent, title: link.title, url: link.url, category: cat.label }
        }
      }
    }
  }
  return null
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function DashboardHome() {
  const { user } = useAuth()
  const { totalDone, doneCountForLevel, lastOpened, markOpened } = useProgress()

  const totalResources = totalResourceCount()
  const resume = lastOpened ? findResource(lastOpened.resourceId) : null

  const stats = [
    { label: 'ressources terminées', value: String(totalDone), icon: CheckCircle2 },
    { label: 'ressources au catalogue', value: String(totalResources), icon: BookOpen },
    { label: 'niveaux', value: String(LEVELS.length), icon: Target },
    { label: 'parcours spécialisés', value: String(COURSES.length), icon: Globe },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 relative"
      >
        <div className="absolute -top-4 -left-4 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(232,115,90,0.08) 0%, transparent 70%)' }}
        />
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--coral-text)' }}>
          Bienvenue, {user?.name} <span aria-hidden="true">👋</span>
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight mb-3" style={{ color: 'var(--text-primary)' }}>
          Pratiquez votre <span className="shimmer-text">anglais en ligne.</span>
        </h1>
        <p className="text-base max-w-xl" style={{ color: 'var(--text-secondary)' }}>
          Exercices, tests et jeux pour tous les niveaux — choisissez votre parcours.
        </p>

        <div className="flex gap-3 mt-5">
          <Link href="/dashboard/levels/beginner">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: '#e8735a', color: '#1b2a4a' }}
            >
              Commencer <ArrowRight size={15} />
            </motion.button>
          </Link>
          <Link href="/dashboard/rules">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              Voir les règles
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Reprendre */}
      {resume && (
        <motion.a
          href={resume.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => markOpened(lastOpened!.resourceId, resume.slug)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="group flex items-center gap-4 rounded-xl p-4 mb-8 transition-all hover:scale-[1.005]"
          style={{
            background: `var(--acc-${resume.accent}-soft)`,
            border: `1px solid var(--acc-${resume.accent}-line)`,
          }}
        >
          <span
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--bg-card)' }}
          >
            <PlayCircle size={20} aria-hidden="true" style={{ color: `var(--acc-${resume.accent})` }} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-xs font-medium mb-0.5" style={{ color: `var(--acc-${resume.accent})` }}>
              Reprendre où vous en étiez
            </span>
            <span className="block font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {resume.title}
            </span>
            <span className="block text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {resume.levelName} · {resume.category}
            </span>
          </span>
          <ArrowRight
            size={18}
            aria-hidden="true"
            className="flex-shrink-0 group-hover:translate-x-1 transition-transform"
            style={{ color: `var(--acc-${resume.accent})` }}
          />
        </motion.a>
      )}

      {/* Stats */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10"
      >
        {stats.map(s => (
          <motion.div key={s.label} variants={item}
            className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <s.icon size={15} aria-hidden="true" style={{ color: 'var(--coral-text)' }} className="flex-shrink-0" />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{s.value}</span>{' '}
              {s.label.toLowerCase()}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Levels */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Niveaux généraux
          </h2>
          <Link href="/dashboard/levels" className="text-sm flex items-center gap-1 hover:text-coral transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {LEVELS.map(level => (
            <motion.div key={level.code} variants={item}>
              <Link href={level.href}>
                <div className="card-glow rounded-xl p-5 h-full cursor-pointer group"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono"
                      style={{ background: `var(--acc-${level.accent}-soft)`, color: `var(--acc-${level.accent})`, border: `1px solid var(--acc-${level.accent}-line)` }}
                    >
                      {level.code}
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {levelResourceCount(level.slug)} ressources
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-coral transition-colors"
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
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span style={{ color: 'var(--text-muted)' }}>{done}/{total} terminées</span>
                          <span className="font-medium" style={{ color: `var(--acc-${level.accent})` }}>{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}
                          role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
                          aria-label={`Progression ${level.name}`}>
                          <div className="h-full rounded-full transition-[width] duration-500"
                            style={{ width: `${pct}%`, background: `var(--acc-${level.accent})` }} />
                        </div>
                      </div>
                    )
                  })()}

                  <div className="mt-3 flex items-center gap-1 text-xs font-medium"
                    style={{ color: `var(--acc-${level.accent})` }}
                  >
                    Explorer <ArrowRight size={12} aria-hidden="true" className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Special courses */}
      <div>
        <h2 className="font-display text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          Cours spécialisés
        </h2>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {COURSES.map(course => (
            <motion.div key={course.code} variants={item}>
              <Link href={course.href}>
                <div className="card-glow rounded-xl p-5 cursor-pointer group flex items-center gap-4"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `var(--acc-${course.accent}-soft)`, border: `1px solid var(--acc-${course.accent}-line)` }}
                  >
                    {(() => { const Icon = COURSE_ICONS[course.iconName]; return <Icon size={22} aria-hidden="true" style={{ color: `var(--acc-${course.accent})` }} /> })()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-0.5 group-hover:text-coral transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {course.name}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{course.desc}</p>
                  </div>
                  <ArrowRight size={16} style={{ color: 'var(--text-muted)' }}
                    className="group-hover:translate-x-1 group-hover:text-coral transition-all flex-shrink-0"
                  />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="mt-16 pt-8 text-center" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          © 2026 teachMe — Learn English Online
        </p>
      </div>
    </div>
  )
}
