'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MotionConfig } from 'framer-motion'
import { AuthProvider, useAuth } from '@/lib/auth'
import { ProgressProvider } from '@/lib/progress'
import { Navbar } from '@/components/layout/Navbar'

function DashboardInner({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/auth')
      }
      setChecked(true)
    }
  }, [user, isLoading, router])

  // Squelette de page pendant la vérification de session :
  // même gabarit que le contenu final, donc aucun saut de mise en page.
  if (!checked || isLoading) {
    return (
      <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
        <div className="h-16 border-b" style={{ borderColor: 'var(--border)' }} />
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <span className="sr-only">Chargement de votre espace…</span>
          <div className="skeleton h-4 w-40 rounded mb-4" />
          <div className="skeleton h-9 w-3/4 max-w-lg rounded mb-3" />
          <div className="skeleton h-4 w-full max-w-xl rounded mb-10" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-40 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <ProgressProvider>
      <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
        <Navbar />
        <main className="pt-16">{children}</main>
      </div>
    </ProgressProvider>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <MotionConfig reducedMotion="user">
        <DashboardInner>{children}</DashboardInner>
      </MotionConfig>
    </AuthProvider>
  )
}
