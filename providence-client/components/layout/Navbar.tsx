'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LogOut, ChevronDown, Shield, ShieldCheck } from 'lucide-react'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Logo, LogoMark, Wordmark } from '../brand/Logo'
import { useAuth } from '@/lib/auth'
import { LEVELS, COURSES } from '@/lib/catalog'


export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [levelsOpen, setLevelsOpen] = useState(false)
  const { user, logout } = useAuth()

  const isAdmin = user?.role === 'admin' || user?.role === 'superuser'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group" aria-label="teachMe — accueil">
            <LogoMark size={34} className="flex-shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5" />
            <Wordmark className="text-lg text-[var(--text-primary)] leading-tight hidden sm:block" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-sm text-[var(--text-secondary)] hover:text-coral transition-colors">
              Accueil
            </Link>

            <div className="relative" onMouseEnter={() => setLevelsOpen(true)} onMouseLeave={() => setLevelsOpen(false)}>
              <button className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-coral transition-colors">
                Niveaux <ChevronDown size={14} className={`transition-transform ${levelsOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {levelsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-64 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-xl p-2"
                  >
                    <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Niveaux généraux
                    </p>
                    <div className="grid grid-cols-1 gap-0.5">
                      {LEVELS.map(l => (
                        <Link key={l.href} href={l.href}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-coral/10 hover:text-coral transition-colors"
                        >
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: `var(--acc-${l.accent})` }} />
                          {l.name}
                          <span className="ml-auto text-xs font-mono opacity-50">{l.code}</span>
                        </Link>
                      ))}
                      <div className="coral-divider my-1" />
                      <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        Cours spécialisés
                      </p>
                      {COURSES.map(c => (
                        <Link key={c.href} href={c.href}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-coral/10 hover:text-coral transition-colors"
                        >
                          {c.shortName}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {user?.homeMode === 'parcours' && (
              <Link href="/dashboard/tampons" className="text-sm text-[var(--text-secondary)] hover:text-coral transition-colors">
                Tampons
              </Link>
            )}
            <Link href="/dashboard/rules" className="text-sm text-[var(--text-secondary)] hover:text-coral transition-colors">
              Règles
            </Link>
            <Link href="/dashboard/contact" className="text-sm text-[var(--text-secondary)] hover:text-coral transition-colors">
              Contact
            </Link>

            {isAdmin && (
              <Link href="/dashboard/admin"
                className="flex items-center gap-1.5 text-sm transition-colors font-medium"
                style={{ color: user?.role === 'superuser' ? 'var(--acc-purple)' : 'var(--coral-text)' }}
              >
                {user?.role === 'superuser' ? <ShieldCheck size={14} /> : <Shield size={14} />}
                Admin
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user && (
              <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-[var(--text-muted)]">{user.level}</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{user.name}</p>
                </div>
                <button onClick={logout} aria-label="Se déconnecter"
                  className="tap-target rounded-lg text-[var(--text-muted)] hover:text-coral hover:bg-coral/10 transition-colors">
                  <LogOut size={16} />
                </button>
              </div>
            )}
            <button
              className="tap-target md:hidden rounded-lg text-[var(--text-secondary)] hover:text-coral transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileOpen}
              aria-controls="menu-mobile"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            id="menu-mobile"
            className="md:hidden border-t border-[var(--border)] bg-[var(--bg-card)]"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 px-3 py-2 mb-2">
                <Logo size={30} wordmarkClassName="text-base" className="text-[var(--text-primary)]" tagline />
              </div>
              <div className="coral-divider mb-2" />
              <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Niveaux</p>
              {LEVELS.map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-coral transition-colors rounded-lg hover:bg-coral/10"
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: `var(--acc-${item.accent})` }} />
                  {item.name}
                  <span className="ml-auto text-xs font-mono opacity-50">{item.code}</span>
                </Link>
              ))}
              <div className="coral-divider my-2" />
              <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Spécialisés</p>
              {COURSES.map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-coral transition-colors rounded-lg hover:bg-coral/10"
                >
                  {item.shortName}
                </Link>
              ))}
              <div className="coral-divider my-2" />
              {user?.homeMode === 'parcours' && (
                <Link href="/dashboard/tampons" onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-coral transition-colors rounded-lg hover:bg-coral/10">
                  Tampons
                </Link>
              )}
              <Link href="/dashboard/rules" onClick={() => setMobileOpen(false)}
                className="px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-coral transition-colors rounded-lg hover:bg-coral/10">
                Règles
              </Link>
              <Link href="/dashboard/contact" onClick={() => setMobileOpen(false)}
                className="px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-coral transition-colors rounded-lg hover:bg-coral/10">
                Contact
              </Link>
              {isAdmin && (
                <Link href="/dashboard/admin" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg hover:bg-coral/10 transition-colors"
                  style={{ color: user?.role === 'superuser' ? 'var(--acc-purple)' : 'var(--coral-text)' }}>
                  {user?.role === 'superuser' ? <ShieldCheck size={14} /> : <Shield size={14} />}
                  Administration
                </Link>
              )}
              <div className="coral-divider my-2" />
              {user && (
                <button onClick={() => { logout(); setMobileOpen(false) }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut size={14} /> Déconnexion
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}