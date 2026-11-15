'use client'

import { useEffect, useState } from 'react'
import { useAuth, User } from '@/lib/auth'
import { LOCATIONS, LOCATION_NAMES, COURSE_LEVELS } from '@/lib/utils/matricule'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/brand/Logo'

export default function OnboardingPage() {
  const { user, completeStudentProfile, logout } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    location: user?.location || '010',
    courseLevel: user?.courseLevel || 'BEPC',
  })

  useEffect(() => {
    // Redirect if not a student or profile is already complete
    if (!user) {
      router.push('/auth')
    } else if (user.userType !== 'student') {
      router.push('/dashboard')
    } else if (user.profileComplete) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await completeStudentProfile(user!.id, formData.location, formData.courseLevel)
      if (result) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        setError('Erreur lors de la sauvegarde du profil')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.userType !== 'student') {
    return null
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-md mx-auto rounded-2xl p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <div className="mb-8">
          <Logo size={34} className="mb-6" wordmarkClassName="text-xl" />
          <h1 className="font-display text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Bienvenue!</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Complétez votre profil pour continuer</p>
        </div>

        {/* Student Info Card */}
        <div className="mb-6 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div className="mb-3">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nom</p>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Matricule</p>
            <p className="font-mono font-bold text-lg text-coral-700 dark:text-coral">{user.matricule}</p>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center">
            <p>Profil complété avec succès!</p>
            <p className="text-sm mt-2">Redirection en cours...</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Localisation
              </label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-coral/50 transition"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                {Object.entries(LOCATIONS).map(([_, code]) => (
                  <option key={code} value={code}>
                    {LOCATION_NAMES[code]}
                  </option>
                ))}
              </select>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Sélectionnez votre site d’apprentissage
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Niveau de cours
              </label>
              <select
                value={formData.courseLevel}
                onChange={(e) => setFormData({ ...formData, courseLevel: e.target.value })}
                className="w-full px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-coral/50 transition"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                {COURSE_LEVELS.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Choisissez votre niveau d’études
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-coral text-navy py-2.5 rounded-xl hover:bg-coral-600 disabled:opacity-50 font-semibold transition"
            >
              {loading ? 'Sauvegarde en cours...' : 'Compléter mon profil'}
            </button>
          </form>
        )}

        <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={logout}
            className="w-full py-2 text-sm font-medium transition-colors hover:text-coral" style={{ color: 'var(--text-muted)' }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  )
}
