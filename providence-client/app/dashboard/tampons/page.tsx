'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useParcours } from '@/lib/use-parcours'

// Légère rotation de chaque tampon obtenu, comme un vrai coup de tampon
const TILT = [-6, 4, -3, 5, -4, 3, -5, 2, -2, 6, -4, 3, -6, 4]

export default function TamponsPage() {
  const { stamps, isLoading } = useParcours()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const earned = stamps.filter(s => s.earned).length
  const selected =
    stamps.find(s => s.id === selectedId) ??
    // Par défaut : le premier tampon à obtenir, sinon le dernier obtenu
    stamps.find(s => !s.earned) ??
    stamps[stamps.length - 1]

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-2 pb-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Carnet de tampons
        </h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Chaque étape franchie laisse sa marque.{' '}
          {isLoading ? '' : `${earned} tampon${earned > 1 ? 's' : ''} sur ${stamps.length}.`}
        </p>
      </motion.div>

      <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-3 gap-y-6 justify-items-center" aria-label="Tampons">
        {stamps.map((s, i) => {
          const isSelected = selected?.id === s.id
          const ink = s.kicker === 'série' ? 'var(--text-primary)' : 'var(--coral-text)'
          return (
            <li key={s.id} className="flex flex-col items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setSelectedId(s.id)}
                aria-pressed={isSelected}
                aria-label={`${s.label}, ${s.earned ? 'tampon obtenu' : 'pas encore obtenu'}`}
                className="w-[88px] h-[88px] rounded-full flex flex-col items-center justify-center gap-1 transition-transform hover:scale-105"
                style={{
                  ...(s.earned
                    ? {
                        border: `3px solid ${ink}`,
                        outline: `2px dashed ${ink}`,
                        outlineOffset: '-10px',
                        background: 'var(--bg-card)',
                        transform: `rotate(${TILT[i % TILT.length]}deg)`,
                      }
                    : { border: '2px dashed var(--border)', background: 'var(--bg-secondary)' }),
                  boxShadow: isSelected ? '0 0 0 4px var(--bg-primary), 0 0 0 7px var(--coral)' : undefined,
                }}
              >
                {s.earned ? (
                  <>
                    <span className="font-display font-bold text-xl leading-none" style={{ color: ink }}>{s.code}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ink }}>{s.kicker}</span>
                  </>
                ) : (
                  <span className="font-display font-bold text-lg leading-none" style={{ color: 'var(--text-muted)' }}>{s.code}</span>
                )}
              </button>
              <span
                className="text-xs font-semibold text-center leading-tight"
                style={{ color: s.earned ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                {s.label}
              </span>
            </li>
          )
        })}
      </ul>

      {selected && (
        <section
          aria-live="polite"
          className="mt-10 rounded-2xl p-5 flex flex-col gap-1.5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: selected.earned ? 'var(--coral-text)' : 'var(--text-muted)' }}
          >
            {selected.earned ? 'Tampon obtenu' : 'À obtenir'}
          </span>
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{selected.label}</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{selected.condition}</p>
        </section>
      )}
    </div>
  )
}
