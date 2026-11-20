'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MotionConfig } from 'framer-motion'
import { AuthProvider, useAuth } from '@/lib/auth'
import { ProgressProvider } from '@/lib/progress'
import { AppShell } from '@/components/layout/AppShell'

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

  // Squelette de page pendant la vérification de session : même gabarit que la
  // coquille finale (barre latérale, bandeau, cartes), donc aucun saut.
  if (!checked || isLoading) {
    return (
      <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
        <div
          className="hidden lg:block fixed inset-y-0 left-0"
          style={{ width: 'var(--sidebar-w)', background: 'var(--bg-sidebar)' }}
        />
        <div className="app-content">
          <div style={{ height: 'var(--topbar-h)' }} />
          <div
            className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <span className="sr-only">Chargement de votre espace…</span>
            <div className="skeleton h-4 w-40 rounded mb-4" />
            <div className="skeleton h-9 w-3/4 max-w-lg rounded mb-3" />
            <div className="skeleton h-4 w-full max-w-xl rounded mb-10" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-24 rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
              <div className="skeleton h-64 rounded-2xl" />
              <div className="skeleton h-64 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <ProgressProvider>
      <AppShell>{children}</AppShell>
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
