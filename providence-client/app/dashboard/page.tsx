'use client'

import { useAuth } from '@/lib/auth'
import { ModeChoice } from '@/components/parcours/ModeChoice'
import { ParcoursHome } from '@/components/parcours/ParcoursHome'
import { LibreHome } from '@/components/home/LibreHome'

/**
 * Accueil : l'apprenant choisit une fois son mode (parcours guidé ou accès
 * libre), puis peut en changer à tout moment. Les deux modes affichent la même
 * progression ; seule la couche de jeu change.
 */
export default function DashboardHome() {
  const { user } = useAuth()
  if (!user) return null
  if (!user.homeMode) return <ModeChoice />
  return user.homeMode === 'parcours' ? <ParcoursHome /> : <LibreHome />
}
