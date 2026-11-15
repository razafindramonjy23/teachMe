/**
 * Catalogue des niveaux et cours — constantes d'affichage partagées
 * entre le tableau de bord, la navigation et la page /dashboard/levels.
 *
 * `accent` est un token de couleur défini dans app/globals.css
 * (--acc-<token>, --acc-<token>-soft, --acc-<token>-line) et décliné
 * en mode clair et sombre pour respecter un contraste ≥ 4.5:1.
 */

export type Accent =
  | 'green' | 'blue' | 'violet' | 'amber' | 'orange'
  | 'red' | 'cyan' | 'emerald' | 'purple' | 'coral'

export type LevelItem = {
  name: string
  code: string
  accent: Accent
  desc: string
  href: string
  /** Slug utilisé par /dashboard/levels/[slug] et par la progression. */
  slug: string
}

export type CourseItem = {
  name: string
  shortName: string
  code: string
  accent: Accent
  desc: string
  href: string
  slug: string
  iconName: 'plane' | 'briefcase' | 'graduation' | 'globe'
}

export const LEVELS: LevelItem[] = [
  { name: 'Beginner', code: 'A1', accent: 'green', desc: 'Pour les débutants complets', href: '/dashboard/levels/beginner', slug: 'beginner' },
  { name: 'Elementary', code: 'A2', accent: 'blue', desc: "Bases solides de l'anglais", href: '/dashboard/levels/elementary', slug: 'elementary' },
  { name: 'Pre-Intermediate', code: 'B1-', accent: 'violet', desc: 'Développez votre vocabulaire', href: '/dashboard/levels/pre-intermediate', slug: 'pre-intermediate' },
  { name: 'Intermediate', code: 'B1', accent: 'amber', desc: 'Communiquez avec confiance', href: '/dashboard/levels/intermediate', slug: 'intermediate' },
  { name: 'Upper-Intermediate', code: 'B2', accent: 'orange', desc: 'Maîtrisez les nuances', href: '/dashboard/levels/upper-intermediate', slug: 'upper-intermediate' },
  { name: 'Advanced', code: 'C1', accent: 'red', desc: 'Perfectionnez votre anglais', href: '/dashboard/levels/advanced', slug: 'advanced' },
]

export const COURSES: CourseItem[] = [
  { name: 'Aviation English', shortName: 'Aviation', code: 'AVI', accent: 'cyan', desc: 'Phraséologie et communications aériennes', href: '/dashboard/levels/aviation', slug: 'aviation', iconName: 'plane' },
  { name: 'Business English', shortName: 'Business', code: 'BUS', accent: 'emerald', desc: 'Anglais professionnel et commercial', href: '/dashboard/levels/business', slug: 'business', iconName: 'briefcase' },
  { name: 'C1 Advanced (CAE)', shortName: 'C1 Advanced (CAE)', code: 'CAE', accent: 'purple', desc: 'Préparation à la certification Cambridge', href: '/dashboard/levels/cae', slug: 'cae', iconName: 'graduation' },
  { name: 'IELTS Preparation', shortName: 'IELTS', code: 'IELTS', accent: 'coral', desc: 'Atteignez le score IELTS visé', href: '/dashboard/levels/ielts', slug: 'ielts', iconName: 'globe' },
]

/** Jeton de couleur -> variables CSS prêtes à poser dans un `style` */
export const accentStyle = (accent: Accent) => ({
  text: `var(--acc-${accent})`,
  soft: `var(--acc-${accent}-soft)`,
  line: `var(--acc-${accent}-line)`,
})
