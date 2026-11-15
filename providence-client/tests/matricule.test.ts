/**
 * Matricules étudiants : format PA-{SITE}-STU-{AAMM}-{NNN}.
 * C'est l'identifiant de connexion des étudiants, il doit rester valide.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  LOCATIONS,
  generateMatricule,
  parseMatricule,
  isValidMatricule,
  getLocationName,
} from '../lib/utils/matricule.ts'

test('un matricule généré est valide pour chaque site', () => {
  for (const location of Object.values(LOCATIONS)) {
    const m = generateMatricule(location, 45)
    assert.match(m, new RegExp(`^PA-${location}-STU-\\d{4}-045$`))
    assert.ok(isValidMatricule(m), m)
  }
})

test('la séquence est complétée sur 3 chiffres', () => {
  assert.match(generateMatricule(LOCATIONS.ALAROBIA, 7), /-007$/)
  assert.match(generateMatricule(LOCATIONS.ALAROBIA, 123), /-123$/)
})

test('parseMatricule découpe les 5 composantes', () => {
  assert.deepEqual(parseMatricule('PA-010-STU-2603-045'), {
    prefix: 'PA',
    location: '010',
    userType: 'STU',
    yearMonth: '2603',
    sequence: '045',
  })
  assert.equal(parseMatricule('PA-010-STU'), null)
})

test('l’exemple affiché sur la page de connexion est un matricule valide', () => {
  // Placeholder du champ « Matricule » dans app/auth/page.tsx
  assert.ok(isValidMatricule('PA-010-STU-2603-045'))
})

test('les matricules mal formés sont refusés', () => {
  const invalid = [
    'XX-010-STU-2603-045', // préfixe
    'PA-999-STU-2603-045', // site inconnu
    'PA-010-TEA-2603-045', // pas un étudiant
    'PA-010-STU-26-045', // année-mois sur 2 chiffres
    'PA-010-STU-2603-45', // séquence sur 2 chiffres
    'pa-010-stu-2603-045', // casse
    '',
  ]
  for (const m of invalid) assert.equal(isValidMatricule(m), false, m)
})

test('les codes de site ont un nom lisible', () => {
  assert.equal(getLocationName('010'), 'Alarobia')
  assert.equal(getLocationName('999'), 'Unknown')
})
