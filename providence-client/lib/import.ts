/**
 * Import d'une classe — fonctions pures, partagées par l'interface et l'API,
 * testées dans tests/import.test.ts.
 */

/** Apprenants créés par appel API (délai d'exécution des fonctions serverless). */
export const IMPORT_BATCH_SIZE = 10

/** Taille maximale d'une liste collée en une fois. */
export const IMPORT_MAX = 200

export type ImportResult =
  | { displayName: string; ok: true; matricule: string | null; password: string }
  | { displayName: string; ok: false; message: string }

export type ParsedClassList = {
  /** Noms retenus, dans l'ordre, sans doublon. */
  names: string[]
  /** Noms ignorés parce qu'ils apparaissaient déjà plus haut. */
  duplicates: string[]
  /** Au-delà d'IMPORT_MAX : non retenus. */
  overflow: number
}

/**
 * Transforme le texte collé par l'admin en liste de noms.
 * Accepte une liste brute (un nom par ligne), une numérotation (« 1. », « 2) »,
 * « 3 - »), ou un copier-coller de tableur / CSV : seule la première colonne
 * est gardée. Les espaces superflus sont normalisés ; les doublons (casse et
 * accents ignorés) sont écartés et signalés.
 */
export function parseClassList(text: string): ParsedClassList {
  const names: string[] = []
  const duplicates: string[] = []
  const seen = new Set<string>()
  let overflow = 0

  for (const raw of text.split(/\r?\n/)) {
    let line = raw.split(/[\t;]/)[0] // première colonne (tableur, CSV « ; »)
    line = line.replace(/^\s*\d+\s*[.)\-–]\s*/, '') // numérotation
    line = line.replace(/^["']|["']$/g, '').replace(/\s+/g, ' ').trim()
    if (!line) continue

    const key = line.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    if (seen.has(key)) {
      duplicates.push(line)
      continue
    }
    seen.add(key)
    if (names.length >= IMPORT_MAX) {
      overflow++
      continue
    }
    names.push(line.slice(0, 100))
  }
  return { names, duplicates, overflow }
}

/** Découpe une liste en paquets de `size`. */
export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}
