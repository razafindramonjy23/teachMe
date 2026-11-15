/**
 * Mots de passe provisoires, faits pour être lus sur papier et retapés par un
 * apprenant : pas de caractères ambigus (0/O, 1/l/I), groupés par 3, tirés au sort
 * avec le générateur cryptographique (jamais Math.random).
 *
 * 9 caractères parmi 31 ≈ 44 bits d'entropie : largement suffisant pour un
 * mot de passe provisoire, et toujours au-dessus du minimum de Supabase (6).
 */

export const PASSWORD_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'

export function generateTempPassword(
  randomInt: (max: number) => number = defaultRandomInt,
  groups = 3,
  groupSize = 3,
): string {
  const parts: string[] = []
  for (let g = 0; g < groups; g++) {
    let part = ''
    for (let i = 0; i < groupSize; i++) part += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]
    parts.push(part)
  }
  return parts.join('-')
}

/** Entier uniforme dans [0, max) à partir du générateur cryptographique. */
function defaultRandomInt(max: number): number {
  // Rejet des valeurs au-delà du plus grand multiple de `max` : pas de biais.
  const limit = Math.floor(0x1_0000_0000 / max) * max
  const buf = new Uint32Array(1)
  for (;;) {
    globalThis.crypto.getRandomValues(buf)
    if (buf[0] < limit) return buf[0] % max
  }
}
