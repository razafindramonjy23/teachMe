'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Plus, Pencil, Trash2, Save, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import { fetchPaged } from '@/lib/supabase/fetch-paged'
import { adminApi } from '@/lib/admin-api'
import { useOrganisations } from '@/lib/use-organisations'
import { ORG_NAME_MAX, type Organisation } from '@/lib/organisations'

type Draft = { name: string; place: string }
const EMPTY: Draft = { name: '', place: '' }

const fieldStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }

/**
 * Organisations (superuser) : établissements, associations, entreprises ou
 * groupes qui regroupent des apprenants. Facultatives — un apprenant peut
 * n'appartenir à aucune. Un admin rattaché ne voit que la sienne.
 */
export default function OrganisationsPage() {
  const { user } = useAuth()
  const isSuper = user?.role === 'superuser'
  const orgs = useOrganisations()

  const [members, setMembers] = useState<Map<string, number>>(new Map())
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [editing, setEditing] = useState<{ id: string } & Draft | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Nombre de membres par organisation (comptes actifs ou non)
  useEffect(() => {
    if (!isSuper) return
    let active = true
    fetchPaged<{ organisation_id: string | null }>((from, to) =>
      supabase.from('profiles').select('organisation_id').not('organisation_id', 'is', null).order('id').range(from, to),
    )
      .then(rows => {
        if (!active) return
        const counts = new Map<string, number>()
        for (const r of rows) if (r.organisation_id) counts.set(r.organisation_id, (counts.get(r.organisation_id) ?? 0) + 1)
        setMembers(counts)
      })
      .catch(() => {
        /* le décompte est indicatif ; la suppression reste vérifiée côté serveur */
      })
    return () => {
      active = false
    }
  }, [isSuper, orgs.list])

  if (!isSuper) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center" style={{ color: 'var(--text-secondary)' }}>
        La gestion des organisations est réservée au super administrateur.
      </div>
    )
  }

  async function act(fn: () => Promise<unknown>, success: string) {
    setBusy(true)
    setNotice(null)
    try {
      await fn()
      await orgs.reload()
      setNotice({ type: 'success', msg: success })
      return true
    } catch (e) {
      setNotice({ type: 'error', msg: e instanceof Error ? e.message : 'Erreur' })
      return false
    } finally {
      setBusy(false)
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.name.trim()) return
    const name = draft.name.trim()
    if (await act(() => adminApi.createOrganisation(draft), `« ${name} » créée.`)) setDraft(EMPTY)
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing || !editing.name.trim()) return
    if (await act(() => adminApi.updateOrganisation(editing.id, { name: editing.name, place: editing.place }), 'Organisation modifiée.')) {
      setEditing(null)
    }
  }

  async function remove(o: Organisation) {
    if (await act(() => adminApi.deleteOrganisation(o.id), `« ${o.name} » supprimée.`)) setConfirmId(null)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <Building2 size={28} aria-hidden="true" style={{ color: 'var(--coral-text)' }} /> Organisations
        </h1>
        <p className="text-sm max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
          École, association, entreprise, groupe d’étude… n’importe où à Madagascar ou ailleurs. Une organisation
          regroupe des apprenants et peut avoir son propre administrateur, qui ne voit qu’elle. Elle reste facultative :
          un apprenant peut s’inscrire à titre individuel.
        </p>
      </motion.div>

      {/* Création */}
      <form onSubmit={create} className="rounded-2xl p-5 mb-6 grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_auto] gap-3 items-end"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Nom
          <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} maxLength={ORG_NAME_MAX} required
            placeholder="Ex. Lycée Andohalo, Club d’anglais de Toamasina" className="px-3 py-2.5 rounded-xl text-sm" style={fieldStyle} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Lieu (facultatif)
          <input value={draft.place} onChange={e => setDraft(d => ({ ...d, place: e.target.value }))} maxLength={ORG_NAME_MAX}
            placeholder="Ville, région ou pays" className="px-3 py-2.5 rounded-xl text-sm" style={fieldStyle} />
        </label>
        <button type="submit" disabled={busy || !draft.name.trim()} className="btn-chunky disabled:opacity-50 disabled:cursor-not-allowed">
          <Plus size={16} aria-hidden="true" /> Ajouter
        </button>
      </form>

      {notice && (
        <p role={notice.type === 'error' ? 'alert' : 'status'} className="flex items-start gap-2 rounded-xl px-4 py-3 mb-5 text-sm"
          style={{
            background: notice.type === 'error' ? 'var(--acc-red-soft)' : 'var(--acc-green-soft)',
            border: `1px solid var(--acc-${notice.type === 'error' ? 'red' : 'green'}-line)`,
            color: 'var(--text-primary)',
          }}>
          {notice.type === 'error'
            ? <AlertCircle size={18} aria-hidden="true" style={{ color: 'var(--acc-red)', flexShrink: 0 }} />
            : <CheckCircle2 size={18} aria-hidden="true" style={{ color: 'var(--acc-green)', flexShrink: 0 }} />}
          {notice.msg}
        </p>
      )}

      {orgs.error && (
        <p role="alert" className="rounded-xl px-4 py-3 mb-5 text-sm"
          style={{ background: 'var(--acc-red-soft)', border: '1px solid var(--acc-red-line)', color: 'var(--text-primary)' }}>
          {/organisations/.test(orgs.error) ? 'Les organisations nécessitent la migration 0005.' : orgs.error}
        </p>
      )}

      {/* Liste */}
      <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <table className="w-full text-sm" style={{ minWidth: 560 }}>
          <caption className="sr-only">Organisations, avec leur lieu et leur nombre de membres</caption>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              {['Organisation', 'Lieu', 'Membres', ''].map((h, i) => (
                <th key={i} scope="col" className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${i === 2 ? 'text-right' : 'text-left'}`}
                  style={{ color: 'var(--text-secondary)' }}>
                  {h || <span className="sr-only">Actions</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orgs.loading && (
              <tr><td colSpan={4} className="px-4 py-3"><div className="skeleton h-6 rounded" /></td></tr>
            )}
            {!orgs.loading && orgs.list.length === 0 && !orgs.error && (
              <tr><td colSpan={4} className="px-4 py-12 text-center" style={{ color: 'var(--text-secondary)' }}>
                Aucune organisation pour l’instant. Les apprenants peuvent quand même être créés sans organisation.
              </td></tr>
            )}
            {orgs.list.map(o => {
              const count = members.get(o.id) ?? 0
              if (editing?.id === o.id) {
                return (
                  <tr key={o.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td colSpan={4} className="px-4 py-3">
                      <form onSubmit={saveEdit} className="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_auto] gap-2 items-center">
                        <input aria-label="Nom de l’organisation" value={editing.name} maxLength={ORG_NAME_MAX} required autoFocus
                          onChange={e => setEditing(ed => ed && { ...ed, name: e.target.value })}
                          className="px-3 py-2 rounded-xl text-sm" style={fieldStyle} />
                        <input aria-label="Lieu" value={editing.place} maxLength={ORG_NAME_MAX} placeholder="Lieu (facultatif)"
                          onChange={e => setEditing(ed => ed && { ...ed, place: e.target.value })}
                          className="px-3 py-2 rounded-xl text-sm" style={fieldStyle} />
                        <span className="flex gap-1">
                          <button type="submit" disabled={busy} className="tap-target rounded-lg" aria-label="Enregistrer" style={{ color: 'var(--acc-green)' }}>
                            <Save size={17} aria-hidden="true" />
                          </button>
                          <button type="button" onClick={() => setEditing(null)} className="tap-target rounded-lg" aria-label="Annuler" style={{ color: 'var(--text-secondary)' }}>
                            <X size={17} aria-hidden="true" />
                          </button>
                        </span>
                      </form>
                    </td>
                  </tr>
                )
              }
              return (
                <tr key={o.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <th scope="row" className="text-left font-semibold px-4 py-3" style={{ color: 'var(--text-primary)' }}>{o.name}</th>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{o.place ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums" style={{ color: 'var(--text-primary)' }}>{count}</td>
                  <td className="px-2 py-1 text-right whitespace-nowrap">
                    {confirmId === o.id ? (
                      <span className="inline-flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Supprimer ?
                        <button type="button" onClick={() => remove(o)} disabled={busy}
                          className="px-2.5 py-1.5 rounded-lg font-semibold" style={{ background: 'var(--acc-red-soft)', color: 'var(--acc-red)' }}>
                          Oui
                        </button>
                        <button type="button" onClick={() => setConfirmId(null)} className="px-2.5 py-1.5 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
                          Non
                        </button>
                      </span>
                    ) : (
                      <>
                        <button type="button" onClick={() => { setConfirmId(null); setEditing({ id: o.id, name: o.name, place: o.place ?? '' }) }}
                          className="tap-target rounded-lg" aria-label={`Modifier ${o.name}`} style={{ color: 'var(--text-secondary)' }}>
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => { setEditing(null); setConfirmId(o.id) }}
                          disabled={count > 0}
                          title={count > 0 ? 'Rattachez d’abord ses membres ailleurs' : undefined}
                          className="tap-target rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label={count > 0 ? `Impossible de supprimer ${o.name} : ${count} membre${count > 1 ? 's' : ''}` : `Supprimer ${o.name}`}
                          style={{ color: 'var(--acc-red)' }}>
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
        Une organisation qui a encore des membres ne peut pas être supprimée : changez d’abord leur organisation dans
        l’onglet Utilisateurs.
      </p>
    </div>
  )
}
