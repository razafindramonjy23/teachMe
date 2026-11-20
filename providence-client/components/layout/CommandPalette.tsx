'use client'

/**
 * Recherche globale (⌘K / Ctrl+K).
 *
 * Elle interroge `searchCatalog` — index statique, aucun appel réseau — et
 * ouvre soit une page de niveau, soit la ressource elle-même dans un nouvel
 * onglet, en enregistrant au passage son ouverture dans la progression.
 *
 * Clavier : flèches pour parcourir, Entrée pour ouvrir, Échap pour fermer.
 * Le focus revient à l'élément qui a ouvert la palette.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, CornerDownLeft, ExternalLink, Layers } from 'lucide-react'
import { searchCatalog, type SearchHit } from '@/lib/search'
import { useProgress } from '@/lib/progress'
import { LEVELS } from '@/lib/catalog'

/** Suggestions affichées tant que rien n'est saisi. */
function defaultHits(): SearchHit[] {
  return LEVELS.slice(0, 4).map(level => ({
    kind: 'niveau' as const,
    key: `niveau:${level.slug}`,
    title: level.name,
    subtitle: `${level.code} · ${level.desc}`,
    accent: level.accent,
    href: level.href,
    external: false,
    levelSlug: level.slug,
  }))
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const { markOpened, isDone } = useProgress()
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const openerRef = useRef<Element | null>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const hits = useMemo(() => (query.trim() ? searchCatalog(query, 8) : defaultHits()), [query])

  // Mémorise le déclencheur, met le focus dans le champ, puis le rend.
  useEffect(() => {
    if (open) {
      openerRef.current = document.activeElement
      setQuery('')
      setIndex(0)
      // Après la peinture, sinon le champ n'est pas encore monté.
      const id = window.requestAnimationFrame(() => inputRef.current?.focus())
      return () => window.cancelAnimationFrame(id)
    }
    const opener = openerRef.current
    if (opener instanceof HTMLElement) opener.focus()
  }, [open])

  useEffect(() => {
    setIndex(0)
  }, [query])

  // L'élément survolé au clavier reste visible.
  useEffect(() => {
    listRef.current?.children[index]?.scrollIntoView({ block: 'nearest' })
  }, [index])

  const run = useCallback(
    (hit: SearchHit) => {
      onClose()
      if (hit.external && hit.resourceId && hit.levelSlug) {
        markOpened(hit.resourceId, hit.levelSlug)
        window.open(hit.href, '_blank', 'noopener,noreferrer')
        return
      }
      router.push(hit.href)
    },
    [markOpened, onClose, router],
  )

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (hits.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIndex(i => (i + 1) % hits.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setIndex(i => (i - 1 + hits.length) % hits.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      run(hits[index])
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Rechercher dans le catalogue"
            className="surface w-full max-w-xl overflow-hidden"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
            onKeyDown={onKeyDown}
          >
            <div
              className="flex items-center gap-3 px-4"
              style={{ height: 56, borderBottom: '1px solid var(--border-soft)' }}
            >
              <Search size={17} aria-hidden="true" style={{ color: 'var(--text-muted)' }} />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Niveau, parcours, exercice…"
                aria-label="Rechercher"
                aria-controls="palette-results"
                autoComplete="off"
                className="flex-1 bg-transparent outline-none text-base"
                style={{ color: 'var(--text-primary)' }}
              />
              <kbd
                className="text-[0.68rem] px-1.5 py-0.5 rounded"
                style={{ background: 'var(--bg-sunken)', color: 'var(--text-muted)' }}
              >
                Échap
              </kbd>
            </div>

            {hits.length === 0 ? (
              <p className="px-4 py-8 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                Aucun résultat pour « {query} ».
              </p>
            ) : (
              <ul id="palette-results" ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
                {!query.trim() && (
                  <li
                    className="px-2 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Suggestions
                  </li>
                )}
                {hits.map((hit, i) => {
                  const active = i === index
                  const done = hit.resourceId ? isDone(hit.resourceId) : false
                  return (
                    <li key={hit.key}>
                      <button
                        type="button"
                        onClick={() => run(hit)}
                        onMouseEnter={() => setIndex(i)}
                        className="w-full flex items-center gap-3 px-2 py-2.5 rounded-[var(--radius-md)] text-left transition-colors"
                        style={{ background: active ? 'var(--sidebar-active)' : 'transparent' }}
                      >
                        <span
                          aria-hidden="true"
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `var(--acc-${hit.accent}-soft)`, color: `var(--acc-${hit.accent})` }}
                        >
                          {hit.external ? <ExternalLink size={14} /> : <Layers size={14} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className="block text-sm font-medium truncate"
                            style={{
                              color: 'var(--text-primary)',
                              textDecoration: done ? 'line-through' : undefined,
                            }}
                          >
                            {hit.title}
                          </span>
                          <span className="block text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                            {hit.subtitle}
                          </span>
                        </span>
                        {active && (
                          <CornerDownLeft
                            size={14}
                            aria-hidden="true"
                            className="flex-shrink-0"
                            style={{ color: 'var(--text-muted)' }}
                          />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
