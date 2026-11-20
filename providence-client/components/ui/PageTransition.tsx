'use client'

/**
 * Entrée de page : fondu et courte translation verticale.
 *
 * La clé est le chemin : changer de page rejoue l'animation. `MotionConfig
 * reducedMotion="user"` (app/providers.tsx) neutralise la translation quand le
 * système demande moins d'animations ; il n'y a donc rien à tester ici.
 */

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

/** Conteneur à entrée décalée, pour une grille de cartes. */
export const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

/** Élément d'une grille à entrée décalée. */
export const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}
