'use client'

/**
 * Barre latérale — elle change de contenu selon l'espace où l'on se trouve.
 *
 *   /dashboard/**          navigation de l'apprenant (accueil, catalogue,
 *                          niveaux, suivi) + encart « objectif du jour »
 *   /dashboard/admin/**    navigation d'administration + périmètre du compte,
 *                          et un retour explicite vers l'espace apprenant
 *
 * Trois formes :
 *   - colonne fixe dépliée (248 px), par défaut à partir de 1024 px ;
 *   - rail d'icônes (68 px) côté apprenant, choix mémorisé par la coquille ;
 *   - tiroir, en dessous de 1024 px, toujours déplié.
 *
 * En rail, le libellé de chaque entrée reste dans le DOM en `sr-only` : les
 * lecteurs d'écran lisent la même navigation qu'en mode déplié, et le `title`
 * donne l'infobulle au survol.
 *
 * L'indicateur de page active est un calque partagé (`layoutId`) : il glisse
 * du lien quitté vers le lien atteint, y compris depuis une sous-section.
 */

import { createContext, useContext, useEffect, useId, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  BookMarked,
  Building2,
  ChevronRight,
  Compass,
  Home,
  LayoutDashboard,
  Library,
  LifeBuoy,
  LineChart,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Shield,
  ShieldCheck,
  Stamp,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { LogoMark } from '@/components/brand/Logo'
import { useAuth } from '@/lib/auth'
import { useProgress } from '@/lib/progress'
import { useParcours } from '@/lib/use-parcours'
import { useOrganisations } from '@/lib/use-organisations'
import { LEVELS, COURSES } from '@/lib/catalog'
import { levelResourceIds } from '@/lib/resources'
import { ProgressRing } from '@/components/ui/ProgressRing'

/**
 * Portée du rendu : la colonne fixe et le tiroir sont montés en même temps
 * (la colonne est seulement masquée en CSS sous 1024 px). Leurs calques
 * d'indicateur doivent donc porter des `layoutId` distincts, sinon
 * framer-motion les considère comme un seul élément qui saute de l'un à
 * l'autre.
 */
type Scope = 'colonne' | 'tiroir'

const ScopeContext = createContext<Scope>('colonne')

/** Vrai quand la barre est réduite au rail d'icônes. Jamais dans le tiroir. */
const RailContext = createContext(false)

/** Fond glissant de l'élément actif. */
function ActiveLayer() {
  const scope = useContext(ScopeContext)
  return (
    <motion.span
      layoutId={`sidebar-active-${scope}`}
      className="absolute inset-0"
      style={{ background: 'var(--sidebar-active)', borderRadius: 'var(--radius-md)' }}
      transition={{ type: 'spring', stiffness: 430, damping: 38 }}
    />
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const rail = useContext(RailContext)

  // En rail, un titre de section ne tient pas : un filet le remplace, et le
  // texte reste lisible par les lecteurs d'écran.
  if (rail) {
    return (
      <>
        <span className="sr-only">{children}</span>
        <span aria-hidden="true" className="mx-3 my-2 h-px" style={{ background: 'var(--border-soft)' }} />
      </>
    )
  }

  return (
    <p
      className="px-3 pt-4 pb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em]"
      style={{ color: 'var(--text-muted)' }}
    >
      {children}
    </p>
  )
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
  tone,
}: {
  href: string
  label: string
  icon: typeof Home
  active: boolean
  onNavigate: () => void
  /** Couleur de texte imposée (entrée Administration). */
  tone?: string
}) {
  const rail = useContext(RailContext)

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className="sidebar-link relative"
      style={tone ? { color: tone } : undefined}
      title={rail ? label : undefined}
    >
      {active && <ActiveLayer />}
      <Icon size={17} aria-hidden="true" className="relative flex-shrink-0" />
      <span className={rail ? 'sr-only' : 'relative truncate'}>{label}</span>
    </Link>
  )
}

/** Section dépliable : Niveaux généraux, Parcours spécialisés. */
function NavGroup({
  label,
  icon: Icon,
  items,
  pathname,
  onNavigate,
  onExpandSidebar,
}: {
  label: string
  icon: typeof Home
  items: { href: string; name: string; code: string; accent: string; slug: string }[]
  pathname: string
  onNavigate: () => void
  /** Déplie la barre : une section ne peut pas s'ouvrir dans un rail. */
  onExpandSidebar: () => void
}) {
  const panelId = useId()
  const rail = useContext(RailContext)
  const containsActive = items.some(i => pathname === i.href)
  const [open, setOpen] = useState(containsActive)
  const { countDone } = useProgress()

  // Ouvrir la section si l'on arrive directement sur une de ses pages.
  useEffect(() => {
    if (containsActive) setOpen(true)
  }, [containsActive])

  // En rail, la section ne se déroule pas : le clic déplie d'abord la barre.
  if (rail) {
    return (
      <button
        type="button"
        className="sidebar-link relative w-full"
        title={label}
        onClick={() => {
          onExpandSidebar()
          setOpen(true)
        }}
      >
        <Icon size={17} aria-hidden="true" className="flex-shrink-0" />
        <span className="sr-only">{label} — déplier la navigation</span>
      </button>
    )
  }

  return (
    <div>
      <button
        type="button"
        className="sidebar-link w-full"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(v => !v)}
      >
        <Icon size={17} aria-hidden="true" className="flex-shrink-0" />
        <span className="truncate">{label}</span>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="sidebar-chevron ml-auto flex"
          aria-hidden="true"
        >
          <ChevronRight size={15} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            {items.map(item => {
              const active = pathname === item.href
              const ids = levelResourceIds(item.slug)
              const done = countDone(ids)
              const complete = ids.length > 0 && done === ids.length
              return (
                <li key={item.slug}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className="sidebar-link relative ml-3 text-[0.85rem]"
                  >
                    {active && <ActiveLayer />}
                    <span
                      aria-hidden="true"
                      className="relative w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: `var(--acc-${item.accent})`, opacity: complete ? 1 : 0.45 }}
                    />
                    <span className="relative truncate">{item.name}</span>
                    <span
                      className="relative ml-auto text-[0.7rem] tabular-nums"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {done}/{ids.length}
                    </span>
                  </Link>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Espace apprenant                                                    */
/* ------------------------------------------------------------------ */

function LearnerNav({
  pathname,
  onNavigate,
  onExpandSidebar,
}: {
  pathname: string
  onNavigate: () => void
  onExpandSidebar: () => void
}) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'superuser'
  const parcoursMode = user?.homeMode === 'parcours'

  return (
    <>
      <SectionLabel>Apprendre</SectionLabel>
      <NavLink href="/dashboard" label="Accueil" icon={Home} active={pathname === '/dashboard'} onNavigate={onNavigate} />
      <NavLink
        href="/dashboard/levels"
        label="Catalogue"
        icon={Library}
        active={pathname === '/dashboard/levels'}
        onNavigate={onNavigate}
      />
      <NavGroup
        label="Niveaux"
        icon={Compass}
        items={LEVELS}
        pathname={pathname}
        onNavigate={onNavigate}
        onExpandSidebar={onExpandSidebar}
      />
      <NavGroup
        label="Parcours spécialisés"
        icon={BookMarked}
        items={COURSES}
        pathname={pathname}
        onNavigate={onNavigate}
        onExpandSidebar={onExpandSidebar}
      />

      <SectionLabel>Suivi</SectionLabel>
      <NavLink
        href="/dashboard/stats"
        label="Statistiques"
        icon={LineChart}
        active={pathname === '/dashboard/stats'}
        onNavigate={onNavigate}
      />
      {parcoursMode && (
        <NavLink
          href="/dashboard/tampons"
          label="Carnet de tampons"
          icon={Stamp}
          active={pathname === '/dashboard/tampons'}
          onNavigate={onNavigate}
        />
      )}
      <NavLink
        href="/dashboard/rules"
        label="Règles"
        icon={ScrollText}
        active={pathname === '/dashboard/rules'}
        onNavigate={onNavigate}
      />
      <NavLink
        href="/dashboard/contact"
        label="Aide et contact"
        icon={LifeBuoy}
        active={pathname === '/dashboard/contact'}
        onNavigate={onNavigate}
      />

      {isAdmin && (
        <>
          <SectionLabel>Encadrement</SectionLabel>
          <NavLink
            href="/dashboard/admin"
            label="Administration"
            icon={user?.role === 'superuser' ? ShieldCheck : Shield}
            active={false}
            onNavigate={onNavigate}
            tone={user?.role === 'superuser' ? 'var(--acc-purple)' : 'var(--coral-text)'}
          />
        </>
      )}
    </>
  )
}

/** Encart bas de barre côté apprenant : l'objectif du jour. */
function GoalCard() {
  const { stats } = useParcours()
  const rail = useContext(RailContext)
  const reached = Math.min(stats.todayCount, stats.goal)
  const ringLabel = `Objectif du jour : ${reached} sur ${stats.goal}`

  // En rail, il ne reste de place que pour l'anneau — mais l'information la
  // plus utile de l'encart, c'est précisément lui.
  if (rail) {
    return (
      <Link
        href="/dashboard/stats"
        className="flex justify-center py-1 rounded-[var(--radius-md)]"
        title={`${ringLabel} · voir mes statistiques`}
      >
        <ProgressRing value={stats.todayCount} max={stats.goal} size={40} thickness={5} label={ringLabel}>
          <span className="text-[0.62rem] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {reached}/{stats.goal}
          </span>
        </ProgressRing>
      </Link>
    )
  }

  return (
    <div
      className="p-4 flex flex-col items-center text-center gap-2"
      style={{ background: 'var(--tile-peach)', color: 'var(--tile-ink)', borderRadius: 'var(--radius-lg)' }}
    >
      <ProgressRing
        value={stats.todayCount}
        max={stats.goal}
        size={56}
        thickness={6}
        color="var(--coral-deep)"
        track="rgba(27, 42, 74, 0.12)"
        label={ringLabel}
      >
        <span className="font-display text-sm font-bold">
          {reached}/{stats.goal}
        </span>
      </ProgressRing>
      <p className="text-sm font-semibold leading-tight">Objectif du jour</p>
      <p className="text-xs leading-snug" style={{ opacity: 0.75 }}>
        {stats.goalReached
          ? `Atteint. Série de ${stats.streak} jour${stats.streak > 1 ? 's' : ''}.`
          : `Encore ${stats.goal - stats.todayCount} ressource${stats.goal - stats.todayCount > 1 ? 's' : ''}.`}
      </p>
      <Link
        href="/dashboard/stats"
        className="mt-1 inline-flex items-center justify-center min-h-[36px] px-4 rounded-full text-xs font-bold"
        style={{ background: 'var(--coral-deep)', color: '#f7f5f0' }}
      >
        Voir mes stats
      </Link>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Espace d'administration                                             */
/* ------------------------------------------------------------------ */

const ADMIN_TABS = [
  { href: '/dashboard/admin', label: 'Vue d’ensemble', Icon: LayoutDashboard, superOnly: false },
  { href: '/dashboard/admin/utilisateurs', label: 'Utilisateurs', Icon: Users, superOnly: false },
  { href: '/dashboard/admin/import', label: 'Import en lot', Icon: UserPlus, superOnly: false },
  { href: '/dashboard/admin/suivi', label: 'Suivi', Icon: LineChart, superOnly: false },
  { href: '/dashboard/admin/organisations', label: 'Organisations', Icon: Building2, superOnly: true },
  { href: '/dashboard/admin/journal', label: 'Journal', Icon: ScrollText, superOnly: true },
]

function AdminNav({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  const { user } = useAuth()
  const tabs = ADMIN_TABS.filter(t => !t.superOnly || user?.role === 'superuser')

  return (
    <>
      <NavLink href="/dashboard" label="Espace apprenant" icon={ArrowLeft} active={false} onNavigate={onNavigate} />

      <SectionLabel>Administration</SectionLabel>
      {tabs.map(({ href, label, Icon }) => (
        <NavLink
          key={href}
          href={href}
          label={label}
          icon={Icon}
          active={href === '/dashboard/admin' ? pathname === href : pathname.startsWith(href)}
          onNavigate={onNavigate}
        />
      ))}
    </>
  )
}

/**
 * Encart bas de barre côté administration : le périmètre du compte.
 * C'est l'information qui conditionne tout ce que l'écran affiche — un admin
 * rattaché ne voit que son organisation.
 */
function ScopeCard() {
  const { user } = useAuth()
  const orgs = useOrganisations()
  const organisationId = user?.organisationId ?? null
  const global = user?.role === 'superuser' || !organisationId
  const scope = global ? 'Toutes les organisations' : orgs.label(organisationId)

  return (
    <div
      className="p-4 flex flex-col gap-1.5"
      style={{ background: 'var(--tile-sky)', color: 'var(--tile-ink)', borderRadius: 'var(--radius-lg)' }}
    >
      <span className="flex items-center gap-2 text-xs font-semibold" style={{ opacity: 0.75 }}>
        <Building2 size={13} aria-hidden="true" />
        Votre périmètre
      </span>
      <p className="text-sm font-semibold leading-snug">{scope}</p>
      <p className="text-xs leading-snug" style={{ opacity: 0.7 }}>
        {user?.role === 'superuser'
          ? 'Super administrateur : accès complet.'
          : global
            ? 'Administrateur : tous les apprenants.'
            : 'Vous gérez les membres de cette organisation.'}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */

/** Initiales d'un nom, pour l'avatar. */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
}

function SidebarBody({
  onNavigate,
  canCollapse,
  onToggleCollapse,
}: {
  onNavigate: () => void
  /** Le repli n'est proposé que dans l'espace apprenant, et pas dans le tiroir. */
  canCollapse: boolean
  onToggleCollapse: () => void
}) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const rail = useContext(RailContext)
  const adminSpace = pathname.startsWith('/dashboard/admin')

  const expand = () => {
    if (rail) onToggleCollapse()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Marque */}
      <div
        className={`flex items-center gap-2.5 h-[var(--topbar-h)] flex-shrink-0 ${rail ? 'justify-center px-2' : 'px-3'}`}
      >
        <LogoMark size={32} className="flex-shrink-0" />
        {!rail && (
          <>
            <span className="min-w-0">
              <span
                className="block brand-wordmark text-[1.05rem] leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                teach<span className="brand-accent">Me</span>
              </span>
              <span className="block text-[0.68rem] leading-tight truncate" style={{ color: 'var(--text-muted)' }}>
                {adminSpace ? 'Administration' : 'Learn English Online'}
              </span>
            </span>
            {canCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="tap-target rounded-lg ml-auto -mr-2 flex-shrink-0"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Réduire la navigation"
                title="Réduire la navigation"
              >
                <PanelLeftClose size={17} aria-hidden="true" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <nav
        aria-label={adminSpace ? 'Navigation d’administration' : 'Navigation principale'}
        className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 flex flex-col gap-0.5"
      >
        {rail && canCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="sidebar-link"
            aria-label="Déplier la navigation"
            title="Déplier la navigation"
          >
            <PanelLeftOpen size={17} aria-hidden="true" />
          </button>
        )}

        {adminSpace ? (
          <AdminNav pathname={pathname} onNavigate={onNavigate} />
        ) : (
          <LearnerNav pathname={pathname} onNavigate={onNavigate} onExpandSidebar={expand} />
        )}
      </nav>

      {/* Encart contextuel + compte */}
      <div className={`pb-3 flex flex-col gap-3 flex-shrink-0 ${rail ? 'px-2' : 'px-3'}`}>
        {adminSpace ? <ScopeCard /> : <GoalCard />}

        {user && (
          <div
            className={`flex items-center rounded-[var(--radius-md)] ${rail ? 'flex-col gap-1 py-2' : 'gap-2.5 p-2'}`}
            style={{ background: 'var(--border-soft)' }}
          >
            <span
              aria-hidden="true"
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'var(--coral)', color: 'var(--navy)' }}
              title={rail ? user.name : undefined}
            >
              {initialsOf(user.name)}
            </span>
            {!rail && (
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {user.name}
                </span>
                <span className="block text-[0.7rem] truncate" style={{ color: 'var(--text-muted)' }}>
                  {adminSpace ? (user.role === 'superuser' ? 'Super administrateur' : 'Administrateur') : user.level}
                </span>
              </span>
            )}
            <button
              type="button"
              onClick={logout}
              className="tap-target rounded-lg flex-shrink-0"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              <LogOut size={16} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SidebarContent({
  onNavigate,
  scope,
  rail,
  canCollapse,
  onToggleCollapse,
}: {
  onNavigate: () => void
  scope: Scope
  rail: boolean
  canCollapse: boolean
  onToggleCollapse: () => void
}) {
  return (
    <ScopeContext.Provider value={scope}>
      <RailContext.Provider value={rail}>
        <SidebarBody onNavigate={onNavigate} canCollapse={canCollapse} onToggleCollapse={onToggleCollapse} />
      </RailContext.Provider>
    </ScopeContext.Provider>
  )
}

export function Sidebar({
  open,
  onClose,
  collapsed,
  canCollapse,
  onToggleCollapse,
}: {
  open: boolean
  onClose: () => void
  collapsed: boolean
  canCollapse: boolean
  onToggleCollapse: () => void
}) {
  // Échap ferme le tiroir, et le corps ne défile pas derrière.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  return (
    <>
      {/* Grand écran : colonne fixe, dépliée ou en rail */}
      <aside
        className={`app-sidebar hidden lg:block fixed inset-y-0 left-0 z-40 ${collapsed ? 'sidebar-rail' : ''}`}
        style={{ width: 'var(--sidebar-w)', background: 'var(--bg-sidebar)' }}
      >
        <SidebarContent
          scope="colonne"
          rail={collapsed}
          canCollapse={canCollapse}
          onToggleCollapse={onToggleCollapse}
          onNavigate={() => undefined}
        />
      </aside>

      {/* Petit écran : tiroir, toujours déplié */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.45)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              aria-hidden="true"
            />
            <motion.aside
              className="lg:hidden fixed inset-y-0 left-0 z-50"
              style={{ width: 248, background: 'var(--bg-sidebar)' }}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 40 }}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
            >
              <button
                type="button"
                onClick={onClose}
                className="tap-target absolute top-3 right-2 rounded-lg z-10"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Fermer le menu"
              >
                <X size={18} aria-hidden="true" />
              </button>
              <SidebarContent
                scope="tiroir"
                rail={false}
                canCollapse={false}
                onToggleCollapse={onToggleCollapse}
                onNavigate={onClose}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
