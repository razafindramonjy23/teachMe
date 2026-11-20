'use client'

/**
 * Catalogue — l'écran « bibliothèque » de la maquette.
 *
 * Onglets (niveaux / parcours / tout), filtres par état d'avancement, tri,
 * puis une grille de pochettes. Les pochettes sont dessinées en SVG
 * (components/ui/LevelCover) : aucune image distante, et elles suivent le
 * thème.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useParcours, type PathStep } from '@/lib/use-parcours'
import { Chip } from '@/components/ui/Chip'
import { Tabs, SegmentedTabs } from '@/components/ui/Tabs'
import { LevelCover } from '@/components/ui/LevelCover'
import { stagger, staggerItem } from '@/components/ui/PageTransition'

type Family = 'niveaux' | 'parcours' | 'tout'
type Status = 'tous' | 'en-cours' | 'boucles' | 'a-commencer'
type Sort = 'progression' | 'alpha'

const FAMILIES = [
  { id: 'niveaux' as const, label: 'Niveaux' },
  { id: 'parcours' as const, label: 'Parcours' },
  { id: 'tout' as const, label: 'Tout' },
]

const SORTS = [
  { id: 'progression' as const, label: 'Progression' },
  { id: 'alpha' as const, label: 'A-Z' },
]

function statusOf(step: PathStep): Exclude<Status, 'tous'> {
  if (step.complete) return 'boucles'
  return step.done > 0 ? 'en-cours' : 'a-commencer'
}

export default function CataloguePage() {
  const { path, courses } = useParcours()
  const [family, setFamily] = useState<Family>('tout')
  const [status, setStatus] = useState<Status>('tous')
  const [sort, setSort] = useState<Sort>('progression')

  const pool = useMemo(() => {
    if (family === 'niveaux') return path
    if (family === 'parcours') return courses
    return [...path, ...courses]
  }, [family, path, courses])

  const counts = useMemo(
    () => ({
      tous: pool.length,
      'en-cours': pool.filter(s => statusOf(s) === 'en-cours').length,
      boucles: pool.filter(s => statusOf(s) === 'boucles').length,
      'a-commencer': pool.filter(s => statusOf(s) === 'a-commencer').length,
    }),
    [pool],
  )

  const visible = useMemo(() => {
    const filtered = status === 'tous' ? pool : pool.filter(s => statusOf(s) === status)
    const sorted = [...filtered]
    if (sort === 'alpha') {
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    } else {
      // Du plus avancé au moins avancé, les parcours bouclés en dernier :
      // on veut reprendre ce qui est commencé, pas relire ce qui est fini.
      const ratio = (s: PathStep) => (s.total === 0 ? 0 : s.done / s.total)
      sorted.sort((a, b) => {
        if (a.complete !== b.complete) return a.complete ? 1 : -1
        return ratio(b) - ratio(a)
      })
    }
    return sorted
  }, [pool, status, sort])

  const totalResources = pool.reduce((n, s) => n + s.total, 0)
  const totalDone = pool.reduce((n, s) => n + s.done, 0)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-10">
      <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
        Catalogue
      </h1>
      <p className="text-sm mt-1 mb-5" style={{ color: 'var(--text-muted)' }}>
        {pool.length} parcours · {totalResources} ressources · {totalDone} terminée{totalDone > 1 ? 's' : ''}
      </p>

      <div className="mb-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <Tabs idPrefix="catalogue" label="Familles de parcours" items={FAMILIES} value={family} onChange={setFamily} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Chip label="Tous" count={counts.tous} pressed={status === 'tous'} onClick={() => setStatus('tous')} />
        <Chip
          label="En cours"
          accent="amber"
          count={counts['en-cours']}
          pressed={status === 'en-cours'}
          onClick={() => setStatus('en-cours')}
        />
        <Chip
          label="Bouclés"
          accent="green"
          count={counts.boucles}
          pressed={status === 'boucles'}
          onClick={() => setStatus('boucles')}
        />
        <Chip
          label="À commencer"
          accent="blue"
          count={counts['a-commencer']}
          pressed={status === 'a-commencer'}
          onClick={() => setStatus('a-commencer')}
        />
        <span className="ml-auto">
          <SegmentedTabs idPrefix="tri" label="Trier le catalogue" items={SORTS} value={sort} onChange={setSort} />
        </span>
      </div>

      <div
        role="tabpanel"
        id={`catalogue-panel-${family}`}
        aria-labelledby={`catalogue-tab-${family}`}
        tabIndex={-1}
      >
      {visible.length === 0 ? (
        <p
          className="rounded-[var(--radius-lg)] px-6 py-14 text-center text-sm"
          style={{ border: '1px dashed var(--border)', color: 'var(--text-muted)' }}
        >
          Aucun parcours dans cette sélection.
        </p>
      ) : (
        <motion.div
          key={`${family}-${status}-${sort}`}
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-6"
        >
          {visible.map(step => {
            const pct = step.total === 0 ? 0 : Math.round((step.done / step.total) * 100)
            return (
              <motion.div key={step.slug} variants={staggerItem}>
                <Link href={step.href} className="block group">
                  <span
                    className="block rounded-[var(--radius-lg)] overflow-hidden mb-2.5 transition-transform duration-300 group-hover:-translate-y-1.5"
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
                  <span className="block text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                    {step.code} · {step.total} ressource{step.total > 1 ? 's' : ''}
                  </span>
                  <span
                    className="block h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--bg-sunken)' }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progression ${step.name} : ${step.done} sur ${step.total}`}
                  >
                    <motion.span
                      className="block h-full rounded-full"
                      style={{ background: `var(--acc-${step.accent})` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </span>
                  <span className="block text-[0.7rem] mt-1 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {step.complete ? 'Bouclé' : `${step.done}/${step.total}`}
                  </span>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      )}
      </div>
    </div>
  )
}
