'use client'

import { motion } from 'framer-motion'
import { Map as MapIcon, LayoutGrid, ArrowRight } from 'lucide-react'
import { useAuth, type HomeMode } from '@/lib/auth'

const CHOICES: {
  mode: HomeMode
  title: string
  text: string
  points: string[]
  Icon: typeof MapIcon
}[] = [
  {
    mode: 'parcours',
    title: 'Parcours guidé',
    text: 'Un chemin du niveau A1 au C1, avec une étape recommandée à chaque fois.',
    points: ['Objectif : 2 ressources par jour', 'Une série de jours à entretenir', 'Des tampons à collectionner'],
    Icon: MapIcon,
  },
  {
    mode: 'libre',
    title: 'Accès libre',
    text: 'Tous les niveaux et toutes les ressources d’un coup d’œil, comme avant.',
    points: ['Sans objectif ni série', 'Vous choisissez où aller', 'Votre progression est enregistrée quand même'],
    Icon: LayoutGrid,
  },
]

/**
 * Écran affiché tant que l'apprenant n'a pas choisi son mode d'accueil.
 * C'est le moment qui compte : un réglage est rarement modifié ensuite.
 */
export function ModeChoice() {
  const { user, setHomeMode } = useAuth()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--coral-text)' }}>
          Bienvenue{user?.name ? `, ${user.name}` : ''}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Comment voulez-vous apprendre ?
        </h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Vous pourrez changer à tout moment depuis l’accueil, sans rien perdre.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CHOICES.map(({ mode, title, text, points, Icon }, i) => (
          <motion.button
            key={mode}
            type="button"
            onClick={() => setHomeMode(mode)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="group text-left rounded-2xl p-6 flex flex-col gap-4 transition-all hover:-translate-y-0.5"
            style={{
              background: 'var(--bg-card)',
              border: '2px solid var(--border)',
              borderBottomWidth: '5px',
            }}
          >
            <span
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--acc-coral-soft)', border: '1px solid var(--acc-coral-line)' }}
            >
              <Icon size={22} aria-hidden="true" style={{ color: 'var(--coral-text)' }} />
            </span>
            <span>
              <span className="block font-display text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {title}
              </span>
              <span className="block text-sm" style={{ color: 'var(--text-secondary)' }}>{text}</span>
            </span>
            <ul className="flex flex-col gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {points.map(p => (
                <li key={p} className="flex items-center gap-2">
                  <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--coral)' }} />
                  {p}
                </li>
              ))}
            </ul>
            <span
              className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: 'var(--coral-text)' }}
            >
              Choisir {mode === 'parcours' ? 'le parcours' : 'l’accès libre'}
              <ArrowRight size={15} aria-hidden="true" className="group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
