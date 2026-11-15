'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { UserPlus, Users, LineChart, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useSuiviData } from '@/lib/use-suivi-data'
import { overview, weeklyActivity, byOrganisation, INACTIVE_AFTER_DAYS } from '@/lib/suivi'
import { useOrganisations } from '@/lib/use-organisations'
import { WeeklyBars, type BarPoint } from '@/components/admin/WeeklyBars'

const shortFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const longFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' })

/** Accueil de l'administration : l'état de la plateforme en un coup d'œil. */
export default function AdminOverviewPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'superuser'
  const { students, rows, loading, error } = useSuiviData(isAdmin)
  const orgs = useOrganisations()

  const stats = useMemo(() => overview(students), [students])
  const groups = useMemo(() => byOrganisation(students), [students])
  const weeks = useMemo(() => weeklyActivity(rows), [rows])
  const thisWeek = weeks[weeks.length - 1]

  const toPoints = (key: 'done' | 'activeStudents'): BarPoint[] =>
    weeks.map((w, i) => {
      const d = new Date(`${w.weekStart}T00:00:00Z`)
      return {
        label: shortFmt.format(d),
        fullLabel: `Semaine du ${longFmt.format(d)}`,
        value: w[key],
        partial: i === weeks.length - 1,
      }
    })

  const tiles = [
    { label: 'Apprenants', value: stats.total, hint: 'comptes actifs' },
    { label: 'Actifs cette semaine', value: thisWeek?.activeStudents ?? 0, hint: 'ont ouvert ou terminé une ressource' },
    { label: 'À relancer', value: stats.aRelancer, hint: `${INACTIVE_AFTER_DAYS} jours ou plus sans activité` },
    { label: 'Jamais commencé', value: stats.jamais, hint: 'aucune ressource ouverte' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Vue d’ensemble
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          L’activité de la plateforme, semaine par semaine. Les chiffres portent sur les apprenants de votre périmètre.
        </p>
      </motion.div>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl px-4 py-3 mb-6 text-sm"
          style={{ background: 'var(--acc-red-soft)', border: '1px solid var(--acc-red-line)', color: 'var(--text-primary)' }}>
          <AlertCircle size={18} aria-hidden="true" style={{ color: 'var(--acc-red)', flexShrink: 0 }} />
          <span>Impossible de charger les données : {error}</span>
        </div>
      )}

      {/* Chiffres clés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {tiles.map(t => (
          <div key={t.label} className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{loading ? '…' : t.value}</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t.label}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{t.hint}</p>
          </div>
        ))}
      </div>

      {/* Tendance : deux graphiques d'une série chacun (jamais deux axes) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {loading ? (
          <>
            <div className="skeleton h-64 rounded-2xl" />
            <div className="skeleton h-64 rounded-2xl" />
          </>
        ) : (
          <>
            <WeeklyBars title="Ressources terminées par semaine" unit={['ressource', 'ressources']} points={toPoints('done')} />
            <WeeklyBars title="Apprenants actifs par semaine" unit={['apprenant', 'apprenants']} points={toPoints('activeStudents')} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        {/* Par organisation */}
        <section className="rounded-2xl overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="font-semibold text-sm px-5 pt-4 pb-3" style={{ color: 'var(--text-primary)' }}>Par organisation</h2>
          <table className="w-full text-sm" style={{ minWidth: 480 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                {['Organisation', 'Apprenants', 'Actifs', 'À relancer', 'Jamais commencé'].map((h, i) => (
                  <th key={h} scope="col" className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider ${i === 0 ? 'text-left' : 'text-right'}`}
                    style={{ color: 'var(--text-secondary)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && groups.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-6 text-center" style={{ color: 'var(--text-secondary)' }}>Aucun apprenant pour le moment.</td></tr>
              )}
              {groups.map(s => (
                <tr key={s.organisationId ?? 'aucune'} style={{ borderTop: '1px solid var(--border)' }}>
                  <th scope="row" className="text-left font-medium px-5 py-2.5" style={{ color: 'var(--text-primary)' }}>
                    {orgs.label(s.organisationId, 'Sans organisation')}
                  </th>
                  <td className="text-right px-5 py-2.5 tabular-nums" style={{ color: 'var(--text-primary)' }}>{s.total}</td>
                  <td className="text-right px-5 py-2.5 tabular-nums" style={{ color: 'var(--text-secondary)' }}>{s.actifs}</td>
                  <td className="text-right px-5 py-2.5 tabular-nums font-semibold" style={{ color: s.aRelancer > 0 ? 'var(--acc-orange)' : 'var(--text-secondary)' }}>{s.aRelancer}</td>
                  <td className="text-right px-5 py-2.5 tabular-nums" style={{ color: 'var(--text-secondary)' }}>{s.jamais}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Raccourcis */}
        <nav aria-label="Actions rapides" className="flex flex-col gap-3">
          {[
            { href: '/dashboard/admin/import', label: 'Import en lot', hint: 'Créer plusieurs apprenants d’un coup', Icon: UserPlus },
            { href: '/dashboard/admin/utilisateurs', label: 'Gérer les utilisateurs', hint: 'Modifier, réinitialiser, désactiver', Icon: Users },
            { href: '/dashboard/admin/suivi', label: 'Suivi des apprenants', hint: `${stats.aRelancer} apprenant${stats.aRelancer > 1 ? 's' : ''} à relancer`, Icon: LineChart },
          ].map(({ href, label, hint, Icon }) => (
            <Link key={href} href={href} className="group rounded-2xl p-4 flex items-center gap-3"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--acc-coral-soft)' }}>
                <Icon size={18} aria-hidden="true" style={{ color: 'var(--coral-text)' }} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</span>
                <span className="block text-xs" style={{ color: 'var(--text-secondary)' }}>{hint}</span>
              </span>
              <ArrowRight size={16} aria-hidden="true" className="group-hover:translate-x-1 transition-transform" style={{ color: 'var(--text-muted)' }} />
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
