'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Bookmark, X } from 'lucide-react'

export type CelebrationEvent =
  | { kind: 'page'; detail: string; key: number }
  | { kind: 'goal'; streak: number; key: number }
  | { kind: 'level'; name: string; code: string; key: number }

// Confettis aux couleurs de la marque, positions fixes (pas d'aléatoire au rendu)
const CONFETTI = [
  { x: -120, r: 25, c: 'var(--coral)', w: 8, h: 14 },
  { x: -80, r: -30, c: 'var(--cream)', w: 10, h: 10 },
  { x: -40, r: 60, c: 'var(--coral-deep)', w: 6, h: 12 },
  { x: 0, r: 10, c: '#eb8670', w: 7, h: 7 },
  { x: 45, r: -45, c: 'var(--coral)', w: 8, h: 14 },
  { x: 85, r: 35, c: 'var(--cream)', w: 9, h: 9 },
  { x: 125, r: -15, c: 'var(--coral-deep)', w: 6, h: 12 },
]

const DURATION = { page: 2800, goal: 4500 }

/**
 * Annonce de progression en bas d'écran. « page » et « goal » disparaissent
 * seuls ; « level » reste jusqu'à fermeture (il propose d'aller au carnet).
 */
export function Celebration({ event, onDone }: { event: CelebrationEvent | null; onDone: () => void }) {
  useEffect(() => {
    if (!event || event.kind === 'level') return
    const t = setTimeout(onDone, DURATION[event.kind])
    return () => clearTimeout(t)
  }, [event, onDone])

  const festive = event?.kind === 'goal' || event?.kind === 'level'

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 -translate-x-1/2 bottom-6 z-50 w-[min(92vw,420px)] pointer-events-none"
    >
      <AnimatePresence>
        {event && (
          <motion.div
            key={event.key}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="relative pointer-events-auto rounded-2xl px-5 py-4 shadow-xl"
            style={
              festive
                ? { background: 'var(--navy)', color: 'var(--cream)' }
                : { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '2px solid var(--coral)', borderBottomWidth: 4 }
            }
          >
            {festive &&
              CONFETTI.map((c, i) => (
                <motion.span
                  key={i}
                  aria-hidden="true"
                  className="absolute left-1/2 top-2 rounded-sm"
                  style={{ width: c.w, height: c.h, background: c.c }}
                  initial={{ x: c.x * 0.3, y: 10, rotate: 0, opacity: 0 }}
                  animate={{ x: c.x, y: -26, rotate: c.r * 3, opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.1, delay: i * 0.03, ease: 'easeOut' }}
                />
              ))}

            {event.kind === 'page' && (
              <div className="flex items-center gap-4">
                <span className="font-display font-bold text-2xl" style={{ color: 'var(--coral-text)' }}>+10</span>
                <p className="text-sm leading-snug">
                  <strong className="block">Page tournée</strong>
                  <span style={{ color: 'var(--text-secondary)' }}>{event.detail}</span>
                </p>
              </div>
            )}

            {event.kind === 'goal' && (
              <div className="flex items-center gap-4">
                <Bookmark size={30} aria-hidden="true" style={{ color: 'var(--coral)', fill: 'var(--coral)' }} />
                <p className="leading-snug">
                  <strong className="block font-display text-lg">Objectif du jour atteint</strong>
                  <span className="text-sm" style={{ color: '#d8dde6' }}>
                    Série : {event.streak} {event.streak > 1 ? 'jours' : 'jour'} d’affilée.
                  </span>
                </p>
              </div>
            )}

            {event.kind === 'level' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="leading-snug">
                    <strong className="block font-display text-xl">{event.name} bouclé !</strong>
                    <span className="text-sm" style={{ color: '#d8dde6' }}>
                      Le tampon {event.code} rejoint votre carnet.
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={onDone}
                    aria-label="Fermer"
                    className="tap-target -mr-3 -mt-3 rounded-lg"
                    style={{ color: 'var(--cream)' }}
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
                <Link href="/dashboard/tampons" className="btn-chunky self-start">
                  Voir mon carnet
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
