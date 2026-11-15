/**
 * Matricules : l'identifiant de connexion des apprenants sans email.
 * Le format actuel n'a plus de lieu (TM-000123) ; les anciens restent valables.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isValidMatricule, normalizeMatricule, MATRICULE_EXAMPLE } from '../lib/utils/matricule.ts'

test('format actuel : TM- suivi de 6 chiffres', () => {
  assert.ok(isValidMatricule('TM-000001'))
  assert.ok(isValidMatricule('TM-123456'))
  assert.equal(isValidMatricule('TM-12345'), false, '5 chiffres')
  assert.equal(isValidMatricule('TM-1234567'), false, '7 chiffres')
})

test('l’exemple affiché sur la page de connexion est accepté', () => {
  // Régression : l'ancien exemple (…-045) était refusé par la page elle-même.
  assert.ok(isValidMatricule(MATRICULE_EXAMPLE))
})

test('les anciens matricules, avec site, restent valables', () => {
  assert.ok(isValidMatricule('PA-010-STU-2611-0001'), 'séquence sur 4 chiffres (générée par la base)')
  assert.ok(isValidMatricule('PA-020-STU-2603-045'), 'séquence sur 3 chiffres')
})

test('saisie approximative : minuscules et espaces tolérés', () => {
  assert.equal(normalizeMatricule('  tm-000123 '), 'TM-000123')
  assert.ok(isValidMatricule('tm-000123'))
  assert.ok(isValidMatricule('pa-010-stu-2611-0001'))
})

test('les saisies sans rapport sont refusées', () => {
  for (const m of ['', 'TM000123', 'XX-000123', 'PA-010-TEA-2611-0001', 'admin@teachme.mg']) {
    assert.equal(isValidMatricule(m), false, m)
  }
})
