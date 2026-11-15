'use client'

import { Fragment, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Search, Users, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useSuiviData } from '@/lib/use-suivi-data'
import { useOrganisations } from '@/lib/use-organisations'
import {
  overview,
  sortStudents,
  STATUS_LABEL,
  INACTIVE_AFTER_DAYS,
  type SuiviStatus,
  type SuiviSort,
} from '@/lib/suivi'

const STATUS_STYLE: Record<SuiviStatus, { text: string; soft: string }> = {
  actif: { text: 'var(--acc-green)', soft: 'var(--acc-green-soft)' },
  'a-relancer': { text: 'var(--acc-orange)', soft: 'var(--acc-orange-soft)' },
  jamais: { text: 'var(--text-muted)', soft: 'var(--bg-secondary)' },
}

const SORT_LABEL: Record<SuiviSort, string> = {
  priorite: 'À relancer d’abord',
  nom: 'Nom',
  avancement: 'Les plus avancés',
  activite: 'Activité la plus récente',
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Indian/Antananarivo' })

function lastActivityLabel(days: number | null): string {
  if (days === null) return '—'
  if (days === 0) return 'Aujourd’hui'
  if (days === 1) return 'Hier'
  return `Il y a ${days} j`
}

function Bar({ done, total, color = 'var(--coral)' }: { done: number; total: number; color?: string }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <span className="block h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }} aria-hidden="true">
      <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </span>
  )
}

export default function SuiviPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'superuser'
  // Garde d'accès et redirection : assurés par app/dashboard/admin/layout.tsx
  const { students, loading, error } = useSuiviData(isAdmin)
  const orgs = useOrganisations()
  // Un admin rattaché ne voit que son organisation (RLS) : pas de filtre à proposer.
  const scoped = user?.role === 'admin' && !!user.organisationId

  /** 'tous', 'aucune' (sans organisation) ou l'identifiant d'une organisation. */
  const [org, setOrg] = useState('tous')
  const [status, setStatus] = useState<'tous' | SuiviStatus>('tous')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SuiviSort>('priorite')
  const [openId, setOpenId] = useState<string | null>(null)

  // Vue d'ensemble : sur l'organisation choisie, avant le filtre de statut
  const orgStudents = useMemo(
    () =>
      students.filter(s =>
        org === 'tous' ? true : org === 'aucune' ? s.organisationId === null : s.organisationId === org,
      ),
    [students, org],
  )
  const stats = useMemo(() => overview(orgStudents), [orgStudents])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sortStudents(
      orgStudents.filter(
        s =>
          (status === 'tous' || s.status === status) &&
          (!q || s.name.toLowerCase().includes(q) || (s.matricule ?? '').toLowerCase().includes(q)),
      ),
      sort,
    )
  }, [orgStudents, status, query, sort])

  if (!user || !isAdmin) return null

  const cards: { key: 'tous' | SuiviStatus; label: string; value: number; hint: string }[] = [
    {
      key: 'tous',
      label: 'Apprenants',
      value: stats.total,
      hint: scoped
        ? orgs.label(user.organisationId)
        : org === 'tous'
          ? 'toutes organisations'
          : org === 'aucune'
            ? 'sans organisation'
            : orgs.label(org),
    },
    { key: 'actif', label: 'Actifs', value: stats.actifs, hint: `activité depuis moins de ${INACTIVE_AFTER_DAYS} jours` },
    { key: 'a-relancer', label: 'À relancer', value: stats.aRelancer, hint: `${INACTIVE_AFTER_DAYS} jours ou plus sans activité` },
    { key: 'jamais', label: 'Jamais commencé', value: stats.jamais, hint: 'aucune ressource ouverte' },
  ]

  const selectStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-sm font-medium mb-1 flex items-center gap-2" style={{ color: 'var(--coral-text)' }}>
          <Users size={15} aria-hidden="true" /> Encadrement
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Suivi des apprenants
        </h1>
        <p className="text-sm max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
          Qui progresse, qui décroche. Lecture seule : la progression est déclarée par chaque apprenant, qui en est
          informé dans le règlement. {stats.doneThisWeek > 0 && `${stats.doneThisWeek} ressources terminées ces 7 derniers jours.`}
        </p>
      </motion.div>

      {/* Vue d'ensemble — chaque carte filtre le tableau */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8" role="group" aria-label="Filtrer par statut">
        {cards.map(c => {
          const active = status === c.key
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={active}
              onClick={() => setStatus(c.key)}
              className="text-left rounded-2xl p-4 transition-colors"
              style={{
                background: 'var(--bg-card)',
                border: active ? '2px solid var(--coral)' : '1px solid var(--border)',
                padding: active ? 15 : 16,
              }}
            >
              <span className="block font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {loading ? '…' : c.value}
              </span>
              <span className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{c.label}</span>
              <span className="block text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{c.hint}</span>
            </button>
          )
        })}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <label className="flex flex-col gap-1 text-xs font-medium flex-1 min-w-[200px]" style={{ color: 'var(--text-secondary)' }}>
          Rechercher
          <span className="relative">
            <Search size={15} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Nom ou matricule"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm"
              style={selectStyle}
            />
          </span>
        </label>
        {!scoped && (
          <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Organisation
            <select value={org} onChange={e => setOrg(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm max-w-[260px]" style={selectStyle}>
              <option value="tous">Toutes</option>
              {orgs.list.map(o => (
                <option key={o.id} value={o.id}>{orgs.label(o.id)}</option>
              ))}
              <option value="aucune">Sans organisation</option>
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Trier par
          <select value={sort} onChange={e => setSort(e.target.value as SuiviSort)} className="px-3 py-2.5 rounded-xl text-sm" style={selectStyle}>
            {(Object.keys(SORT_LABEL) as SuiviSort[]).map(k => (
              <option key={k} value={k}>{SORT_LABEL[k]}</option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl px-4 py-3 mb-5 text-sm"
          style={{ background: 'var(--acc-red-soft)', border: '1px solid var(--acc-red-line)', color: 'var(--text-primary)' }}
        >
          <AlertCircle size={18} aria-hidden="true" style={{ color: 'var(--acc-red)', flexShrink: 0 }} />
          <span>Impossible de charger le suivi : {error}</span>
        </div>
      )}

      {/* Tableau */}
      <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <table className="w-full text-sm" style={{ minWidth: 860 }}>
          <caption className="sr-only">
            Apprenants, avec leur étape en cours, leur avancement et leur dernière activité
          </caption>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              {['Apprenant', 'Organisation', 'Étape en cours', 'Terminées', 'Série', 'Dernière activité', 'Statut', ''].map((h, i) => (
                <th
                  key={i}
                  scope="col"
                  className="text-left font-semibold text-xs uppercase tracking-wider px-4 py-3"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {h === '' ? <span className="sr-only">Détail</span> : h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`sk-${i}`}>
                  <td colSpan={8} className="px-4 py-3">
                    <div className="skeleton h-6 rounded" />
                  </td>
                </tr>
              ))}

            {!loading && visible.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center" style={{ color: 'var(--text-secondary)' }}>
                  {students.length === 0 ? 'Aucun apprenant pour le moment.' : 'Aucun apprenant ne correspond à ces filtres.'}
                </td>
              </tr>
            )}

            {!loading &&
              visible.map(s => {
                const open = openId === s.id
                const st = STATUS_STYLE[s.status]
                return (
                  <Fragment key={s.id}>
                    <tr style={{ borderTop: '1px solid var(--border)' }}>
                      <th scope="row" className="text-left font-normal px-4 py-3">
                        <span className="block font-semibold" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                        {s.matricule && (
                          <span className="block font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{s.matricule}</span>
                        )}
                      </th>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                        {s.organisationId ? orgs.byId.get(s.organisationId)?.name ?? '—' : '—'}
                      </td>
                      <td className="px-4 py-3" style={{ minWidth: 150 }}>
                        {s.focus ? (
                          <span className="flex flex-col gap-1.5">
                            <span style={{ color: 'var(--text-primary)' }}>
                              <span className="font-semibold">{s.focus.code}</span>{' '}
                              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                {s.focus.done}/{s.focus.total}
                              </span>
                            </span>
                            <Bar done={s.focus.done} total={s.focus.total} />
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>A1 → C1 bouclé</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{s.doneCount}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                        {s.streak > 0 ? `${s.streak} j` : '—'}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                        <span title={s.lastActivityAt ? dateFmt.format(new Date(s.lastActivityAt)) : undefined}>
                          {lastActivityLabel(s.daysSinceActivity)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                          style={{ background: st.soft, color: st.text }}
                        >
                          {STATUS_LABEL[s.status]}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-right">
                        <button
                          type="button"
                          onClick={() => setOpenId(open ? null : s.id)}
                          aria-expanded={open}
                          aria-controls={`detail-${s.id}`}
                          aria-label={`${open ? 'Masquer' : 'Afficher'} le détail de ${s.name}`}
                          className="tap-target rounded-lg"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <ChevronDown size={18} aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                        </button>
                      </td>
                    </tr>
                    {open && (
                      <tr id={`detail-${s.id}`} style={{ background: 'var(--bg-primary)' }}>
                        <td colSpan={8} className="px-4 py-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2.5">
                            {s.levels.map(l => (
                              <div key={l.slug} className="grid grid-cols-[52px_minmax(0,1fr)_56px] items-center gap-3 text-xs">
                                <span className="font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{l.code}</span>
                                <span className="flex flex-col gap-1 min-w-0">
                                  <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{l.name}</span>
                                  <Bar done={l.done} total={l.total} color={l.done === l.total && l.total > 0 ? 'var(--acc-green)' : 'var(--coral)'} />
                                </span>
                                <span className="text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                                  {l.done}/{l.total}
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
                            Compte créé le {dateFmt.format(new Date(s.createdAt))}
                            {s.lastActivityAt && ` · dernière activité le ${dateFmt.format(new Date(s.lastActivityAt))}`}
                            {` · ${s.doneThisWeek} ressource${s.doneThisWeek > 1 ? 's' : ''} terminée${s.doneThisWeek > 1 ? 's' : ''} ces 7 derniers jours`}
                          </p>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
          </tbody>
        </table>
      </div>

      {!loading && !error && (
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          {visible.length} apprenant{visible.length > 1 ? 's' : ''} affiché{visible.length > 1 ? 's' : ''} sur {students.length}.
        </p>
      )}
    </div>
  )
}
