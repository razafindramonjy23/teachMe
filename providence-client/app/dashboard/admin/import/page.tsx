'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { UserPlus, Printer, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { adminApi } from '@/lib/admin-api'
import { parseClassList, chunk, IMPORT_BATCH_SIZE, IMPORT_MAX, type ImportResult } from '@/lib/import'
import { useOrganisations } from '@/lib/use-organisations'
import { LEVELS } from '@/lib/catalog'

type Phase = 'form' | 'running' | 'done'

const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Indian/Antananarivo' })

export default function ImportPage() {
  const { user } = useAuth()
  const orgs = useOrganisations()
  // Un admin rattaché importe toujours dans son organisation (imposé côté serveur).
  const scoped = user?.role === 'admin' && !!user.organisationId
  const [orgId, setOrgId] = useState<string>(scoped ? (user?.organisationId as string) : '')
  const [level, setLevel] = useState('Beginner')
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<Phase>('form')
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<ImportResult[]>([])
  const [fatal, setFatal] = useState<string | null>(null)

  const parsed = useMemo(() => parseClassList(text), [text])
  const created = results.filter((r): r is Extract<ImportResult, { ok: true }> => r.ok)
  const failed = results.filter((r): r is Extract<ImportResult, { ok: false }> => !r.ok)

  // Les mots de passe ne sont affichés qu'une fois : on prévient avant de quitter.
  useEffect(() => {
    if (phase !== 'done' || created.length === 0) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [phase, created.length])

  async function run() {
    if (parsed.names.length === 0) return
    setPhase('running')
    setProgress(0)
    setResults([])
    setFatal(null)
    const all: ImportResult[] = []
    for (const batch of chunk(parsed.names, IMPORT_BATCH_SIZE)) {
      try {
        const { results: r } = await adminApi.importBatch({
          organisationId: orgId || null,
          level,
          students: batch.map(displayName => ({ displayName })),
        })
        all.push(...r)
      } catch (e) {
        // Échec du paquet entier (droits, réseau) : on s'arrête, on garde l'acquis.
        const message = e instanceof Error ? e.message : 'Erreur'
        setFatal(message)
        all.push(...batch.map(displayName => ({ displayName, ok: false as const, message: 'Non créé : import interrompu' })))
        const done = all.length
        const rest = parsed.names.slice(done).map(displayName => ({ displayName, ok: false as const, message: 'Non créé : import interrompu' }))
        all.push(...rest)
        break
      }
      setProgress(all.length)
      setResults([...all])
    }
    setResults([...all])
    setPhase('done')
  }

  function reset() {
    if (created.length > 0 && !window.confirm('Les mots de passe affichés ne pourront plus être consultés. Avez-vous imprimé la fiche ?')) return
    setText('')
    setResults([])
    setFatal(null)
    setPhase('form')
  }

  const selectStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 no-print">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Import en lot
        </h1>
        <p className="text-sm max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
          Collez une liste de noms : chaque apprenant reçoit un matricule et un mot de passe provisoire, regroupés sur
          une fiche à imprimer et à distribuer.
        </p>
      </motion.div>

      {phase === 'form' && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Organisation (facultatif)
                <select value={orgId} onChange={e => setOrgId(e.target.value)} disabled={scoped}
                  className="px-3 py-2.5 rounded-xl text-sm disabled:opacity-70" style={selectStyle}>
                  {!scoped && <option value="">Aucune — apprenants individuels</option>}
                  {orgs.list.map(o => (
                    <option key={o.id} value={o.id}>{orgs.label(o.id)}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Niveau de départ
                <select value={level} onChange={e => setLevel(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm" style={selectStyle}>
                  {LEVELS.map(l => <option key={l.slug} value={l.name}>{l.code} · {l.name}</option>)}
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Liste des apprenants — un nom par ligne
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={14}
                placeholder={'Rakoto Jean\nRasoa Marie\nRandria Paul\n…'}
                className="px-4 py-3 rounded-xl text-sm font-mono leading-relaxed"
                style={selectStyle}
              />
              <span style={{ color: 'var(--text-muted)' }}>
                Numérotation et colonnes de tableur acceptées (seule la première colonne est lue). {IMPORT_MAX} apprenants au plus par import.
              </span>
            </label>
          </div>

          <aside className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="font-display text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{parsed.names.length}</p>
            <p className="text-sm -mt-2" style={{ color: 'var(--text-secondary)' }}>
              apprenant{parsed.names.length > 1 ? 's' : ''} à créer{orgId ? ` dans ${orgs.label(orgId)}` : ', sans organisation'}
            </p>
            {parsed.duplicates.length > 0 && (
              <p className="text-xs flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                <AlertTriangle size={14} aria-hidden="true" style={{ color: 'var(--acc-amber)', flexShrink: 0, marginTop: 1 }} />
                {parsed.duplicates.length} doublon{parsed.duplicates.length > 1 ? 's' : ''} ignoré{parsed.duplicates.length > 1 ? 's' : ''} : {parsed.duplicates.slice(0, 3).join(', ')}
                {parsed.duplicates.length > 3 ? '…' : ''}
              </p>
            )}
            {parsed.overflow > 0 && (
              <p className="text-xs flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                <AlertTriangle size={14} aria-hidden="true" style={{ color: 'var(--acc-amber)', flexShrink: 0, marginTop: 1 }} />
                {parsed.overflow} nom{parsed.overflow > 1 ? 's' : ''} au-delà de {IMPORT_MAX} : faites un second import.
              </p>
            )}
            {parsed.names.length > 0 && (
              <ul className="text-xs flex flex-col gap-1 max-h-40 overflow-y-auto" style={{ color: 'var(--text-secondary)' }}>
                {parsed.names.slice(0, 8).map(n => <li key={n} className="truncate">· {n}</li>)}
                {parsed.names.length > 8 && <li>… et {parsed.names.length - 8} autres</li>}
              </ul>
            )}
            <button type="button" onClick={run} disabled={parsed.names.length === 0}
              className="btn-chunky w-full disabled:opacity-50 disabled:cursor-not-allowed">
              <UserPlus size={16} aria-hidden="true" />
              Créer {parsed.names.length || ''} compte{parsed.names.length > 1 ? 's' : ''}
            </button>
          </aside>
        </div>
      )}

      {phase === 'running' && (
        <div role="status" aria-live="polite" className="rounded-2xl p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Création des comptes… {progress} / {parsed.names.length}
          </p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>Gardez cette page ouverte.</p>
          <div className="h-2.5 rounded-full overflow-hidden max-w-md mx-auto" style={{ background: 'var(--bg-secondary)' }}
            role="progressbar" aria-valuemin={0} aria-valuemax={parsed.names.length} aria-valuenow={progress} aria-label="Progression de l’import">
            <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${(progress / Math.max(parsed.names.length, 1)) * 100}%`, background: 'var(--coral)' }} />
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="flex flex-col gap-5">
          <div className="no-print rounded-2xl p-5 flex flex-wrap items-center gap-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <CheckCircle2 size={28} aria-hidden="true" style={{ color: 'var(--acc-green)' }} />
            <p className="flex-1 min-w-[200px]" style={{ color: 'var(--text-primary)' }}>
              <strong>{created.length} compte{created.length > 1 ? 's' : ''} créé{created.length > 1 ? 's' : ''}</strong>
              {failed.length > 0 && <span style={{ color: 'var(--acc-red)' }}> · {failed.length} échec{failed.length > 1 ? 's' : ''}</span>}
              <span className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
                Les mots de passe ne seront plus affichés après avoir quitté cette page : imprimez la fiche maintenant.
              </span>
            </p>
            {created.length > 0 && (
              <button type="button" onClick={() => window.print()} className="btn-chunky">
                <Printer size={16} aria-hidden="true" /> Imprimer la fiche
              </button>
            )}
            <button type="button" onClick={reset} className="btn-chunky btn-chunky-ghost">
              <RotateCcw size={16} aria-hidden="true" /> Nouvel import
            </button>
          </div>

          {fatal && (
            <p role="alert" className="no-print text-sm rounded-xl px-4 py-3" style={{ background: 'var(--acc-red-soft)', border: '1px solid var(--acc-red-line)', color: 'var(--text-primary)' }}>
              Import interrompu : {fatal}. Les comptes déjà créés figurent sur la fiche ; relancez un import pour les autres.
            </p>
          )}

          {failed.length > 0 && (
            <section className="no-print rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--acc-red-line)' }}>
              <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Non créés</h2>
              <ul className="text-sm flex flex-col gap-1" style={{ color: 'var(--text-secondary)' }}>
                {failed.map((f, i) => <li key={`${f.displayName}-${i}`}><strong>{f.displayName || '(nom vide)'}</strong> — {f.message}</li>)}
              </ul>
            </section>
          )}

          {created.length > 0 && (
            <section className="print-sheet rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <header className="mb-4">
                <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>teachMe — identifiants de connexion</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {orgId ? `${orgs.label(orgId)} · ` : ''}{dateFmt.format(new Date())}. Connexion avec le matricule et le mot
                  de passe provisoire.
                </p>
              </header>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--text-primary)' }}>
                    <th scope="col" className="text-left py-2 pr-4">Apprenant</th>
                    <th scope="col" className="text-left py-2 pr-4">Matricule</th>
                    <th scope="col" className="text-left py-2">Mot de passe provisoire</th>
                  </tr>
                </thead>
                <tbody>
                  {created.map(c => (
                    <tr key={c.matricule ?? c.displayName} style={{ borderBottom: '1px solid var(--border)' }}>
                      <th scope="row" className="text-left font-normal py-2 pr-4" style={{ color: 'var(--text-primary)' }}>{c.displayName}</th>
                      <td className="py-2 pr-4 font-mono" style={{ color: 'var(--text-primary)' }}>{c.matricule}</td>
                      <td className="py-2 font-mono font-semibold tracking-wider" style={{ color: 'var(--text-primary)' }}>{c.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
