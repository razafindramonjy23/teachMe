'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, ChevronRight } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LogoMark, Wordmark } from '@/components/brand/Logo'
import { useAuth } from '@/lib/auth'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.name || !formData.email || !formData.password){
      setError('Tous les champs sont obligatoires')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    try {
      const ok = await register(formData.name, formData.email, formData.password)
      if (!ok) {
        setError("Erreur lors de l'inscription")
        return
      }
      router.push('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'inscription"
      setError(message)
    } finally {
      setLoading(false)
    }

  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Left panel – decorative */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] relative overflow-hidden"
        style={{ background: '#1b2a4a' }}
      >
        {/* Grid bg */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />

        {/* Glowing orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(232,115,90,0.15) 0%, transparent 70%)' }}
        />
        <div className="absolute top-1/3 right-0 w-[300px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(232,115,90,0.08) 0%, transparent 70%)' }}
        />

        {/* ── TOP: Logo teachMe ── */}
        <div className="relative z-10 p-12">
          <div className="flex items-center gap-3">
            <LogoMark tone="dark" size={48} className="flex-shrink-0" />
            <span className="flex flex-col leading-none">
              <Wordmark tone="dark" className="text-3xl" />
              <span className="brand-tagline mt-1.5 text-[10px] text-cream/60">Learn English Online</span>
            </span>
          </div>
        </div>

        {/* ── MIDDLE: Headline + badges ── */}
        <div className="relative z-10 px-12 py-16">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <h1 className="font-display text-5xl font-bold text-cream leading-tight mb-6">
              Rejoignez<br />
              <span className="shimmer-text">notre équipe</span><br />
              dès aujourd'hui.
            </h1>
            <p className="text-cream/70 text-lg leading-relaxed max-w-sm">
              Créez votre compte et commencez votre expérience avec teachMe. Personnel bienvenue!
            </p>
          </motion.div>

          {/* Level badges */}
          <motion.div
            className="mt-10 flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {['Personnel', 'Enseignant', 'Sécurisé', 'Rapide', 'Simple'].map((l, i) => (
              <motion.span
                key={l}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.07 }}
                className="px-3 py-1 rounded-full text-sm font-medium border"
                style={{ borderColor: 'rgba(232,115,90,0.4)', color: '#e8735a', background: 'rgba(232,115,90,0.08)' }}
              >
                {l}
              </motion.span>
            ))}
          </motion.div>
        </div>

        {/* ── BOTTOM: Copyright ── */}
        <div className="relative z-10 p-12">
          <p className="text-cream/40 text-xs">
            © 2026 teachMe
          </p>
        </div>
      </div>

      {/* ── Right panel – form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        {/* Theme toggle top-right */}
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <LogoMark size={36} className="flex-shrink-0" />
            <Wordmark className="text-2xl text-[var(--text-primary)]" />
          </div>

          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            S'inscrire
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Créez votre compte pour commencer
          </p>



          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 bg-red-500/10 border border-red-500/20 mb-4"
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Nom complet
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  autoComplete="name"
                  placeholder="Votre nom complet"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Adresse email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  autoComplete="email"
                  placeholder="vous@exemple.com"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-pressed={showPassword}
                  className="tap-target absolute right-1 top-1/2 -translate-y-1/2 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all mt-2 disabled:opacity-60"
              style={{ background: '#e8735a', color: '#1b2a4a' }}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
              ) : (
                <>
                  S'inscrire
                  <ChevronRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Vous avez déjà un compte?{' '}
              <Link href="/auth" className="font-medium" style={{ color: '#e8735a' }}>
                Se connecter
              </Link>
            </p>
          </div>

          {/* Note */}
          <div className="mt-6 p-3 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-medium">📝 Note:</span> Les Étudiants ne s'inscrivent pas ici. Ils sont créés par les administrateurs.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
