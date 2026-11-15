'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, UserPlus, LineChart, ScrollText, Building2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { OrganisationsProvider, useOrganisations } from '@/lib/use-organisations'

const TABS = [
  { href: '/dashboard/admin', label: 'Vue d’ensemble', Icon: LayoutDashboard, superOnly: false },
  { href: '/dashboard/admin/utilisateurs', label: 'Utilisateurs', Icon: Users, superOnly: false },
  { href: '/dashboard/admin/import', label: 'Import en lot', Icon: UserPlus, superOnly: false },
  { href: '/dashboard/admin/suivi', label: 'Suivi', Icon: LineChart, superOnly: false },
  { href: '/dashboard/admin/organisations', label: 'Organisations', Icon: Building2, superOnly: true },
  { href: '/dashboard/admin/journal', label: 'Journal', Icon: ScrollText, superOnly: true },
]

/**
 * Espace d'administration : un seul contrôle d'accès pour toutes les pages, et
 * une navigation par onglets. Chaque route API revérifie de toute façon les
 * droits — ce garde ne fait qu'éviter d'afficher ce qui serait refusé.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isAdmin = user?.role === 'admin' || user?.role === 'superuser'

  useEffect(() => {
    if (user && !isAdmin) router.replace('/dashboard')
  }, [user, isAdmin, router])

  if (!user || !isAdmin) return null

  return (
    <OrganisationsProvider>
      <AdminShell pathname={pathname} role={user.role} organisationId={user.organisationId ?? null}>
        {children}
      </AdminShell>
    </OrganisationsProvider>
  )
}

function AdminShell({
  children,
  pathname,
  role,
  organisationId,
}: {
  children: React.ReactNode
  pathname: string
  role: string
  organisationId: string | null
}) {
  const orgs = useOrganisations()

  const tabs = TABS.filter(t => !t.superOnly || role === 'superuser')
  const scope = role === 'superuser' || !organisationId ? 'Toutes les organisations' : orgs.label(organisationId)

  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center gap-x-6 gap-y-2 py-2">
          <nav aria-label="Administration" className="flex flex-wrap gap-1 -mb-px">
            {tabs.map(({ href, label, Icon }) => {
              const active = href === '/dashboard/admin' ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className="inline-flex items-center gap-1.5 px-3 min-h-[44px] text-sm font-medium rounded-t-lg"
                  style={{
                    color: active ? 'var(--coral-text)' : 'var(--text-secondary)',
                    borderBottom: active ? '3px solid var(--coral)' : '3px solid transparent',
                  }}
                >
                  <Icon size={15} aria-hidden="true" />
                  {label}
                </Link>
              )
            })}
          </nav>
          <span
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            title="Périmètre de votre compte administrateur"
          >
            <Building2 size={12} aria-hidden="true" />
            {scope}
          </span>
        </div>
      </div>
      {children}
    </div>
  )
}
