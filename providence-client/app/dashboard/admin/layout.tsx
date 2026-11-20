'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

/**
 * Espace d'administration : un seul contrôle d'accès pour toutes les pages.
 * Chaque route API revérifie de toute façon les droits — ce garde ne fait
 * qu'éviter d'afficher ce qui serait refusé.
 *
 * La navigation entre sections et le rappel du périmètre d'organisation sont
 * portés par la barre latérale (components/layout/Sidebar), qui bascule en
 * mode administration dès que le chemin commence par /dashboard/admin. Le
 * fournisseur des organisations est monté par la coquille, au-dessus de la
 * barre latérale, qui en a besoin elle aussi.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()
  const isAdmin = user?.role === 'admin' || user?.role === 'superuser'

  useEffect(() => {
    if (user && !isAdmin) router.replace('/dashboard')
  }, [user, isAdmin, router])

  if (!user || !isAdmin) return null

  return <>{children}</>
}
