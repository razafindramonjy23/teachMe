'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, UserPlus, Trash2, Pencil, Shield, ShieldCheck, User,
  X, Save, AlertCircle, CheckCircle, Search, ChevronDown, KeyRound, Mail
} from 'lucide-react'
import { useAuth, UserRole } from '@/lib/auth'
import type { StoredUser } from '@/lib/auth'
import { useRouter } from 'next/navigation'

const LEVELS = [
  'Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate',
  'Upper-Intermediate', 'Advanced', 'Aviation', 'Business', 'CAE', 'IELTS'
]

const ROLE_LABELS: Record<UserRole, { label: string; color: string; icon: typeof Shield }> = {
  superuser: { label: 'Super Admin', color: '#c084fc', icon: ShieldCheck },
  admin: { label: 'Admin', color: '#e8735a', icon: Shield },
  user: { label: 'Utilisateur', color: '#60a5fa', icon: User },
}

type ModalMode = 'create' | 'edit' | null

// FIX 1: Ajout de location et courseLevel dans le type de form
type FormState = {
  name: string
  email: string
  password: string
  role: UserRole
  level: string
  location: string
  courseLevel: string
}

const DEFAULT_FORM: FormState = {
  name: '',
  email: '',
  password: '',
  role: 'user',
  level: 'Beginner',
  location: '',
  courseLevel: '',
}

export default function AdminPage() {
  const { user, getAllUsers, createUser, updateUser, deleteUser, createStudent } = useAuth()
  const router = useRouter()

  const [users, setUsers] = useState<StoredUser[]>([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ModalMode>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [userType, setUserType] = useState<'student' | 'staff'>('staff')

  const [form, setForm] = useState<FormState>(DEFAULT_FORM)

  useEffect(() => {
    if (user && user.role === 'user') {
      router.replace('/dashboard')
    }
    refreshUsers()
  }, [user])

  const refreshUsers = async () => {
    const fetchedUsers = await getAllUsers()
    setUsers(fetchedUsers)
  }

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const openCreate = () => {
    setUserType('staff')
    setForm(DEFAULT_FORM)
    setEditingId(null)
    setModal('create')
  }

  // FIX 2: openEdit réinitiaise userType et inclut location/courseLevel
  const openEdit = (u: StoredUser) => {
    // Déduire le type d'utilisateur depuis les données existantes
    const type = u.userType === 'student' ? 'student' : 'staff'
    setUserType(type)
    setForm({
      name: u.name,
      email: u.email || '',
      password: '', // FIX 4: vide par défaut, validation corrigée plus bas
      role: u.role,
      level: u.level || 'Beginner',
      location: u.location || '',
      courseLevel: u.courseLevel || '',
    })
    setEditingId(u.id)
    setModal('edit')
  }

  const closeModal = () => { setModal(null); setEditingId(null) }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      showToast('error', 'Le nom est requis.')
      return
    }

    // FIX 4: En mode édition, le mot de passe est optionnel
    if (modal === 'create' && !form.password.trim()) {
      showToast('error', 'Le mot de passe est requis pour la création.')
      return
    }

    if (modal === 'create') {
      if (userType === 'student') {
        if (!form.location || !form.courseLevel) {
          showToast('error', 'Localisation et niveau de cours requis.')
          return
        }
        const result = await createStudent(form.name, form.password, form.location, form.courseLevel)
        if (result.ok) {
          showToast('success', `Étudiant créé ! Matricule : ${result.matricule}`)
          refreshUsers()
          closeModal()
        } else {
          showToast('error', result.error || 'Erreur lors de la création.')
        }
      } else {
        // staff ou parent
        if (!form.email.trim()) {
          showToast('error', 'L\'email est requis.')
          return
        }
        const result = await createUser(
          form.name,
          form.email,
          form.password,
          form.role,
          form.level
        )
        if (result.ok) {
          showToast('success', 'Utilisateur créé avec succès.')
          refreshUsers()
          closeModal()
        } else {
          showToast('error', result.error || 'Erreur lors de la création.')
        }
      }
    } else if (modal === 'edit' && editingId) {
      // En édition : on n'envoie le mot de passe que s'il a été rempli
      const updatePayload: Partial<StoredUser> & { password?: string } = {
        name: form.name,
        email: form.email,
        role: form.role,
        level: form.level,
        location: form.location,
        courseLevel: form.courseLevel,
      }
      if (form.password.trim()) {
        updatePayload.password = form.password
      }

      const ok = await updateUser(editingId, updatePayload)
      if (ok) {
        showToast('success', 'Utilisateur modifié avec succès.')
        refreshUsers()
        closeModal()
      } else {
        showToast('error', 'Erreur lors de la modification.')
      }
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await deleteUser(id)
    if (ok) {
      showToast('success', 'Utilisateur supprimé.')
      refreshUsers()
    } else {
      showToast('error', 'Erreur lors de la suppression.')
    }
    setConfirmDelete(null)
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.email?.toLowerCase().includes(search.toLowerCase()) ?? false)
  )

  if (!user || user.role === 'user') return null

  const canManageRole = (targetRole: UserRole) => {
    if (user.role === 'superuser') return true
    if (user.role === 'admin' && targetRole !== 'superuser') return true
    return false
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium"
            style={{
              background: 'var(--bg-card)',
              borderColor: toast.type === 'success' ? '#4ade8040' : '#f8717140',
              color: toast.type === 'success' ? '#4ade80' : '#f87171',
            }}
          >
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,115,90,0.15)' }}>
            <Users size={20} style={{ color: '#e8735a' }} />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Gestion des utilisateurs</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {user.role === 'superuser' ? 'Super Admin — accès complet' : 'Admin — gestion des utilisateurs'}
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {(['superuser', 'admin', 'user'] as UserRole[]).map(role => {
            const count = users.filter(u => u.role === role).length
            const { label, color, icon: Icon } = ROLE_LABELS[role]
            return (
              <div key={role} className="rounded-xl p-4 flex items-center gap-3"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div>
                  <p className="font-bold text-lg font-display" style={{ color: 'var(--text-primary)' }}>{count}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm flex-shrink-0"
          style={{ background: '#e8735a', color: '#1b2a4a' }}
        >
          <UserPlus size={15} /> Nouvel utilisateur
        </motion.button>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                {['Nom', 'Email', 'Niveau', 'Rôle', 'Créé le', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const { label, color, icon: RoleIcon } = ROLE_LABELS[u.role]
                return (
                  <motion.tr key={u.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: `${color}20`, color }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.name}</span>
                        {u.id === user.id && (
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(232,115,90,0.15)', color: '#e8735a' }}>Vous</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{u.level}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 w-fit px-2 py-1 rounded-lg text-xs font-medium"
                        style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                        <RoleIcon size={11} /> {label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canManageRole(u.role) && (
                          <>
                            <button onClick={() => openEdit(u)}
                              className="p-1.5 rounded-lg transition-colors hover:bg-coral/10"
                              style={{ color: 'var(--text-muted)' }} title="Modifier">
                              <Pencil size={14} />
                            </button>
                            {u.id !== user.id && u.role !== 'superuser' && (
                              <button onClick={() => setConfirmDelete(u.id)}
                                className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-400"
                                style={{ color: 'var(--text-muted)' }} title="Supprimer">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Aucun utilisateur trouvé.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) closeModal() }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {modal === 'create' ? 'Créer un utilisateur' : "Modifier l'utilisateur"}
                </h2>
                <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-coral/10 transition-colors"
                  style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
              </div>

              <div className="flex flex-col gap-4">

                {/* Type d'utilisateur — uniquement en création */}
                {modal === 'create' && (
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Type d'utilisateur
                    </label>
                    <div className="flex gap-2">
                      {(['student', 'staff'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setUserType(type)}
                          className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
                          style={{
                            background: userType === type ? '#e8735a' : 'var(--bg-secondary)',
                            color: userType === type ? '#1b2a4a' : 'var(--text-primary)',
                            border: userType === type ? 'none' : '1px solid var(--border)'
                          }}
                        >
                          {type === 'student' ? '👨‍🎓 Étudiant' : '👨‍💼 Personnel'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nom */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Nom complet</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Jean Dupont" className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                  </div>
                </div>

                {/* FIX 1: Email affiché UNE SEULE FOIS, uniquement si pas étudiant */}
                {userType !== 'student' && (
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                      <input
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="utilisateur@exemple.com"
                        type="email"
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                )}

                {/* Localisation — étudiant seulement */}
                {userType === 'student' && (
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Localisation
                    </label>
                    <select
                      value={form.location}
                      onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                      <option value="">Sélectionner...</option>
                      <option value="010">Alarobia</option>
                      <option value="020">Ambohibao</option>
                      <option value="030">Andoharanofotsy</option>
                    </select>
                  </div>
                )}

                {/* Niveau de cours — étudiant seulement */}
                {userType === 'student' && (
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Niveau de cours
                    </label>
                    <select
                      value={form.courseLevel}
                      onChange={e => setForm(f => ({ ...f, courseLevel: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                      <option value="">Sélectionner...</option>
                      {LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                    </select>
                  </div>
                )}

                {/* Mot de passe */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Mot de passe{' '}
                    {/* FIX 4: label cohérent avec la validation */}
                    {modal === 'edit' && <span className="opacity-60">(laisser vide = inchangé)</span>}
                    {modal === 'create' && <span className="text-red-400">*</span>}
                  </label>
                  <div className="relative">
                    <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••"
                      type="password"
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                {/* Niveau & Rôle */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Niveau</label>
                    <div className="relative">
                      <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                        {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Rôle</label>
                    <div className="relative">
                      <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                        <option value="user">Utilisateur</option>
                        <option value="admin">Admin</option>
                        {user?.role === 'superuser' && <option value="superuser">Super Admin</option>}
                      </select>
                      <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:bg-coral/5"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  Annuler
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: '#e8735a', color: '#1b2a4a' }}>
                  <Save size={14} /> {modal === 'create' ? 'Créer' : 'Enregistrer'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Delete */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              className="w-full max-w-sm rounded-2xl p-6 text-center"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(248,113,113,0.1)' }}>
                <Trash2 size={20} className="text-red-400" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Confirmer la suppression</h3>
              <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Cette action est irréversible.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  Annuler
                </button>
                <button onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}