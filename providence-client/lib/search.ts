/**
 * Recherche dans le catalogue — fonction pure, sans réseau ni état React.
 *
 * L'index est construit une seule fois, à la demande, à partir du catalogue
 * statique (lib/catalog.ts et lib/resources.ts). Il tient en mémoire :
 * quelques centaines d'entrées, pas de quoi justifier un moteur.
 *
 * La comparaison ignore la casse et les accents : « preparation » trouve
 * « Préparation ». Un libellé qui commence par la requête passe devant un
 * libellé qui la contient au milieu, et un niveau passe devant une ressource —
 * on cherche plus souvent un niveau qu'un exercice précis.
 */

import { LEVELS, COURSES, type Accent } from './catalog.ts'
import { levelData, resourceId } from './resources.ts'

export type SearchHit = {
  kind: 'niveau' | 'parcours' | 'ressource'
  /** Clé React stable. */
  key: string
  title: string
  /** Deuxième ligne : niveau d'origine, catégorie, description. */
  subtitle: string
  accent: Accent
  /** Route interne (niveau) ou URL externe (ressource). */
  href: string
  external: boolean
  /** Identifiant de progression, pour les ressources seulement. */
  resourceId?: string
  levelSlug?: string
}

/** Minuscules, sans accents ni signes : la forme sur laquelle on compare. */
export function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

type IndexEntry = SearchHit & { haystack: string }

let cachedIndex: IndexEntry[] | null = null

/** L'index complet, construit au premier appel puis réutilisé. */
export function searchIndex(): IndexEntry[] {
  if (cachedIndex) return cachedIndex

  const entries: IndexEntry[] = []

  for (const level of LEVELS) {
    entries.push({
      kind: 'niveau',
      key: `niveau:${level.slug}`,
      title: level.name,
      subtitle: `${level.code} · ${level.desc}`,
      accent: level.accent,
      href: level.href,
      external: false,
      levelSlug: level.slug,
      haystack: fold(`${level.name} ${level.code} ${level.desc}`),
    })
  }

  for (const course of COURSES) {
    entries.push({
      kind: 'parcours',
      key: `parcours:${course.slug}`,
      title: course.name,
      subtitle: `${course.code} · ${course.desc}`,
      accent: course.accent,
      href: course.href,
      external: false,
      levelSlug: course.slug,
      haystack: fold(`${course.name} ${course.shortName} ${course.code} ${course.desc}`),
    })
  }

  // Une même page peut figurer dans plusieurs niveaux : on ne l'indexe qu'une
  // fois, au premier niveau rencontré, comme le fait findResource().
  const seen = new Set<string>()
  for (const [slug, level] of Object.entries(levelData)) {
    for (const category of level.categories) {
      for (const link of category.links) {
        const id = resourceId(link.url)
        if (seen.has(id)) continue
        seen.add(id)
        entries.push({
          kind: 'ressource',
          key: `ressource:${id}`,
          title: link.title,
          subtitle: `${level.name} · ${category.label}`,
          accent: level.accent as Accent,
          href: link.url,
          external: true,
          resourceId: id,
          levelSlug: slug,
          haystack: fold(`${link.title} ${category.label} ${level.name} ${level.code}`),
        })
      }
    }
  }

  cachedIndex = entries
  return entries
}

const KIND_RANK: Record<SearchHit['kind'], number> = { niveau: 0, parcours: 1, ressource: 2 }

/**
 * Les `limit` meilleures correspondances. Tous les mots de la requête doivent
 * apparaître — taper deux mots restreint la liste au lieu de l'élargir.
 * Une requête vide ne renvoie rien : c'est à l'appelant d'afficher ses
 * suggestions.
 */
export function searchCatalog(query: string, limit = 8): SearchHit[] {
  const needle = fold(query)
  if (needle.length === 0) return []
  const words = needle.split(' ')

  const scored: { entry: IndexEntry; score: number }[] = []
  for (const entry of searchIndex()) {
    if (!words.every(w => entry.haystack.includes(w))) continue
    const at = entry.haystack.indexOf(words[0])
    // Début de libellé = 0, début de mot = 1, milieu de mot = 2.
    const position = at === 0 ? 0 : entry.haystack[at - 1] === ' ' ? 1 : 2
    scored.push({ entry, score: KIND_RANK[entry.kind] * 10 + position })
  }

  return scored
    .sort((a, b) => a.score - b.score || a.entry.title.localeCompare(b.entry.title, 'fr'))
    .slice(0, limit)
    .map(({ entry }) => {
      const { haystack, ...hit } = entry
      return hit
    })
}
