/**
 * Mots de passe provisoires : lisibles, sans caractère ambigu, imprévisibles.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateTempPassword, PASSWORD_ALPHABET } from '../lib/passwords.ts'

test('format : 3 groupes de 3 caractères, séparés par des tirets', () => {
  for (let i = 0; i < 200; i++) assert.match(generateTempPassword(), /^[a-z2-9]{3}-[a-z2-9]{3}-[a-z2-9]{3}$/)
})

test('aucun caractère ambigu à la lecture (0, O, 1, l, I)', () => {
  for (const c of '0O1lI') assert.ok(!PASSWORD_ALPHABET.includes(c), c)
  for (let i = 0; i < 500; i++) assert.doesNotMatch(generateTempPassword(), /[0O1lI]/)
})

test('assez long pour Supabase (6 caractères minimum, 11 ici)', () => {
  assert.ok(generateTempPassword().length >= 6)
})

test('pas de répétition sur 2 000 tirages', () => {
  const seen = new Set(Array.from({ length: 2000 }, () => generateTempPassword()))
  assert.equal(seen.size, 2000)
})

test('tous les caractères de l’alphabet finissent par sortir (pas de biais grossier)', () => {
  const counts = new Map<string, number>()
  for (let i = 0; i < 3000; i++) for (const c of generateTempPassword().replaceAll('-', '')) counts.set(c, (counts.get(c) ?? 0) + 1)
  assert.equal(counts.size, PASSWORD_ALPHABET.length)
  const expected = (3000 * 9) / PASSWORD_ALPHABET.length // ≈ 871
  for (const [c, n] of Array.from(counts)) assert.ok(n > expected * 0.75 && n < expected * 1.25, `${c} : ${n}`)
})

test('déterministe avec un générateur injecté (pour les tests)', () => {
  assert.equal(generateTempPassword(() => 0), 'aaa-aaa-aaa')
})
