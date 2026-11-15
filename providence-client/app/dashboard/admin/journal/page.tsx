'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ScrollText } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import { useOrganisations } from '@/lib/use-organisations'

type AuditRow = {
  id: number
  at: string
  actor_label: string
  action: string
  target_label: string | null
  details: Record<string, unknown>
}

const ACTION_LABEL: Record<string, string> = {
  create: 'Création',
  import: 'Import',
  update: 'Modification',
  deactivate: 'Désactivation',
  reactivate: 'Réactivation',
  reset_password: 'Mot de passe réinitialisé',
  delete: 'Suppression définitive',
  org_create: 'Organisation créée',
  org_update: 'Organisation modifiée',
  org_delete: 'Organisation supprimée',
}

const ACTION_ACCENT: Record<string, string> = {
  create: 'green', import: 'green', update: 'blue', reactivate: 'green',
  deactivate: 'orange', reset_password: 'amber', delete: 'red',
  org_create: 'green', org_update: 'blue', org_delete: 'red',
}

const ROLE_LABEL: Record<string, string> = { superuser: 'Super Admin', admin: 'Admin', user: 'Utilisateur' }
const FIELD_LABEL: Record<string, string> = {
  display_name: 'nom', email: 'email', role: 'rôle', user_type: 'type', level: 'niveau',
  organisation_id: 'organisation', matricule: 'matricule', profile_complete: 'profil', password: 'mot de passe',
}

const PAGE = 100
const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Indian/Antananarivo' })

type FromTo = { from?: unknown; to?: unknown }
const isFromTo = (v: unknown): v is FromTo => !!v && typeof v === 'object' && ('from' in v || 'to' in v)
const text = (v: unknown, empty = '—') => (typeof v === 'string' && v ? v : empty)

/**
 * Détail lisible d'une entrée — jamais de mot de passe (il n'est pas journalisé).
 * `orgLabel` traduit un identifiant d'organisation en nom.
 */
function describe(row: AuditRow, orgLabel: (id: string | null) => string): string {
  const d = row.details ?? {}
  const parts: string[] = []
  const org = (v: unknown) => orgLabel(typeof v === 'string' ? v : null)
  const role = d.role as FromTo | string | undefined
  if (isFromTo(role)) parts.push(`rôle : ${ROLE_LABEL[String(role.from)] ?? role.from} → ${ROLE_LABEL[String(role.to)] ?? role.to}`)
  else if (typeof role === 'string') parts.push(`rôle : ${ROLE_LABEL[role] ?? role}`)
  if (isFromTo(d.organisation)) parts.push(`organisation : ${org(d.organisation.from)} → ${org(d.organisation.to)}`)
  if ('organisationId' in d) parts.push(`organisation : ${org(d.organisationId)}`)
  // Entrées d'organisation : changement de nom ou de lieu
  if (isFromTo(d.name)) parts.push(`nom : ${text(d.name.from)} → ${text(d.name.to)}`)
  if (isFromTo(d.place)) parts.push(`lieu : ${text(d.place.from)} → ${text(d.place.to)}`)
  else if (row.action === 'org_create') parts.push(`lieu : ${text(d.place, 'non précisé')}`)
  if (typeof d.matricule === 'string') parts.push(`matricule ${d.matricule}`)
  if (Array.isArray(d.fields) && !isFromTo(role)) {
    parts.push(`champs : ${d.fields.map(f => FIELD_LABEL[String(f)] ?? String(f)).join(', ')}`)
  }
  return parts.join(' · ')
}

export default function JournalPage() {
  const { user } = useAuth()
  const isSuper = user?.role === 'superuser'
  const orgs = useOrganisations()
  const orgLabel = (id: string | null) => orgs.label(id)
  const [rows, setRows] = useState<AuditRow[]>([])
  const [action, setAction] = useState('toutes')
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (offset: number) => {
      setLoading(true)
      let q = supabase
        .from('admin_audit')
        .select('id, at, actor_label, action, target_label, details')
        .order('at', { ascending: false })
        .order('id', { ascending: false })
      if (action !== 'toutes') q = q.eq('action', action)
      const { data, error: e } = await q.range(offset, offset + PAGE - 1)
      if (e) {
        setError(/admin_audit/.test(e.message) ? 'Le journal nécessite la migration 0005.' : e.message)
      } else {
        const page = (data ?? []) as AuditRow[]
        setRows(prev => (offset === 0 ? page : [...prev, ...page]))
        setHasMore(page.length === PAGE)
        setError(null)
      }
      setLoading(false)
    },
    [action],
  )

  useEffect(() => {
    if (isSuper) void load(0)
  }, [isSuper, load])

  if (!isSuper) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center" style={{ color: 'var(--text-secondary)' }}>
        Le journal est réservé au super administrateur.
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <ScrollText size={28} aria-hidden="true" style={{ color: 'var(--coral-text)' }} /> Journal
          </h1>
          <p className="text-sm max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            Chaque action d’administration : qui, quand, sur quel compte. Personne ne peut modifier ni effacer ce journal,
            pas même un superuser.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Action
          <select value={action} onChange={e => setAction(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <option value="toutes">Toutes</option>
            {Object.entries(ACTION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </motion.div>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl px-4 py-3 mb-5 text-sm"
          style={{ background: 'var(--acc-red-soft)', border: '1px solid var(--acc-red-line)', color: 'var(--text-primary)' }}>
          <AlertCircle size={18} aria-hidden="true" style={{ color: 'var(--acc-red)', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <table className="w-full text-sm" style={{ minWidth: 760 }}>
          <caption className="sr-only">Journal des actions d’administration, les plus récentes en premier</caption>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              {['Date', 'Par', 'Action', 'Compte', 'Détail'].map(h => (
                <th key={h} scope="col" className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 && !error && (
              <tr><td colSpan={5} className="px-4 py-12 text-center" style={{ color: 'var(--text-secondary)' }}>Aucune action enregistrée.</td></tr>
            )}
            {rows.map(r => {
              const accent = ACTION_ACCENT[r.action] ?? 'blue'
              return (
                <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums" style={{ color: 'var(--text-secondary)' }}>{dateFmt.format(new Date(r.at))}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{r.actor_label}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                      style={{ background: `var(--acc-${accent}-soft)`, color: `var(--acc-${accent})` }}>
                      {ACTION_LABEL[r.action] ?? r.action}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{r.target_label ?? '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{describe(r, orgLabel) || '—'}</td>
                </tr>
              )
            })}
            {loading && (
              <tr><td colSpan={5} className="px-4 py-3"><div className="skeleton h-6 rounded" /></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {hasMore && !loading && (
        <div className="mt-4 text-center">
          <button type="button" onClick={() => load(rows.length)} className="btn-chunky btn-chunky-ghost">Charger plus</button>
        </div>
      )}
    </div>
  )
}
