/**
 * Série, pages, objectif du jour, tampons, étape mise en avant.
 * Les dates sont en UTC ; Madagascar est en UTC+3 (sans heure d'été).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  localDay,
  shiftDay,
  computeStats,
  computeStamps,
  focusLevel,
  DAILY_GOAL,
  type StampLevel,
} from '../lib/gamification.ts'

// « Maintenant » : 15 novembre 2026, 10 h à Antananarivo (07:00 UTC)
const NOW = new Date('2026-11-15T07:00:00Z')

test('le jour est celui de Madagascar, pas celui d’UTC', () => {
  // 22:30 UTC le 14 = 01:30 le 15 à Antananarivo
  assert.equal(localDay('2026-11-14T22:30:00Z'), '2026-11-15')
  // 20:59 UTC le 14 = 23:59 le 14 à Antananarivo
  assert.equal(localDay('2026-11-14T20:59:00Z'), '2026-11-14')
})

test('shiftDay traverse les fins de mois et d’année', () => {
  assert.equal(shiftDay('2026-03-01', -1), '2026-02-28')
  assert.equal(shiftDay('2026-12-31', 1), '2027-01-01')
  assert.equal(shiftDay('2028-03-01', -1), '2028-02-29') // année bissextile
})

test('aucune ressource : tout est à zéro', () => {
  const s = computeStats([], NOW)
  assert.deepEqual(
    [s.doneCount, s.pages, s.todayCount, s.streak, s.bestStreak, s.goalReached, s.streakAtRisk],
    [0, 0, 0, 0, 0, false, false],
  )
})

test('10 pages par ressource et objectif du jour à 2', () => {
  assert.equal(DAILY_GOAL, 2)
  const one = computeStats(['2026-11-15T05:00:00Z'], NOW)
  assert.equal(one.pages, 10)
  assert.equal(one.todayCount, 1)
  assert.equal(one.goalReached, false)
  const two = computeStats(['2026-11-15T05:00:00Z', '2026-11-15T06:00:00Z'], NOW)
  assert.equal(two.goalReached, true)
})

test('une ressource terminée à 1 h du matin compte pour le bon jour', () => {
  // 22:30 UTC le 14 = 01:30 le 15 à Madagascar → « aujourd’hui »
  const s = computeStats(['2026-11-14T22:30:00Z'], NOW)
  assert.equal(s.todayCount, 1)
  assert.equal(s.streak, 1)
})

test('trois jours d’affilée jusqu’à aujourd’hui : série de 3', () => {
  const s = computeStats(['2026-11-13T08:00:00Z', '2026-11-14T08:00:00Z', '2026-11-15T05:00:00Z'], NOW)
  assert.equal(s.streak, 3)
  assert.equal(s.streakAtRisk, false)
})

test('rien encore aujourd’hui : la série tient grâce à hier, mais elle est en danger', () => {
  const s = computeStats(['2026-11-13T08:00:00Z', '2026-11-14T08:00:00Z'], NOW)
  assert.equal(s.streak, 2)
  assert.equal(s.streakAtRisk, true)
})

test('une journée entière sans rien : la série retombe à zéro', () => {
  const s = computeStats(['2026-11-12T08:00:00Z', '2026-11-13T08:00:00Z'], NOW)
  assert.equal(s.streak, 0)
  assert.equal(s.bestStreak, 2, 'la meilleure série est conservée')
})

test('plusieurs ressources le même jour ne comptent qu’un jour de série', () => {
  const s = computeStats(['2026-11-15T04:00:00Z', '2026-11-15T05:00:00Z', '2026-11-15T06:00:00Z'], NOW)
  assert.equal(s.streak, 1)
  assert.equal(s.todayCount, 3)
})

test('la meilleure série est la plus longue suite, où qu’elle soit', () => {
  const dates = [
    '2026-10-01T08:00:00Z', '2026-10-02T08:00:00Z', '2026-10-03T08:00:00Z', '2026-10-04T08:00:00Z',
    '2026-11-14T08:00:00Z', '2026-11-15T05:00:00Z',
  ]
  const s = computeStats(dates, NOW)
  assert.equal(s.bestStreak, 4)
  assert.equal(s.streak, 2)
})

const LEVELS: StampLevel[] = [
  { slug: 'beginner', name: 'Beginner', code: 'A1', kind: 'niveau', ids: ['a', 'b'] },
  { slug: 'elementary', name: 'Elementary', code: 'A2', kind: 'niveau', ids: ['c', 'd', 'e'] },
  { slug: 'ielts', name: 'IELTS Preparation', code: 'IELTS', kind: 'parcours', ids: ['f'] },
]

test('tampons : premier pas, niveaux, séries puis parcours, dans cet ordre', () => {
  const stamps = computeStamps({ levels: LEVELS, isDone: () => false, doneCount: 0, bestStreak: 0 })
  assert.deepEqual(
    stamps.map(s => s.id),
    ['premier-pas', 'niveau-beginner', 'niveau-elementary', 'serie-7', 'serie-30', 'parcours-ielts'],
  )
  assert.ok(stamps.every(s => !s.earned))
})

test('un niveau est tamponné seulement quand toutes ses ressources sont terminées', () => {
  const done = new Set(['a', 'b', 'c'])
  const stamps = computeStamps({ levels: LEVELS, isDone: id => done.has(id), doneCount: 3, bestStreak: 1 })
  const by = Object.fromEntries(stamps.map(s => [s.id, s]))
  assert.equal(by['premier-pas'].earned, true)
  assert.equal(by['niveau-beginner'].earned, true)
  assert.equal(by['niveau-elementary'].earned, false)
  assert.match(by['niveau-elementary'].condition, /Vous en êtes à 1/)
})

test('un tampon de série se gagne sur la meilleure série et ne se perd plus', () => {
  const stamps = computeStamps({ levels: [], isDone: () => false, doneCount: 10, bestStreak: 8 })
  const by = Object.fromEntries(stamps.map(s => [s.id, s]))
  assert.equal(by['serie-7'].earned, true)
  assert.equal(by['serie-30'].earned, false)
  assert.match(by['serie-30'].condition, /Meilleure série : 8 jours/)
})

const ORDER = ['beginner', 'elementary', 'intermediate']

test('étape mise en avant : la dernière activité, si elle n’est pas bouclée', () => {
  const focus = focusLevel({ order: ORDER, isComplete: () => false, lastActivitySlug: 'intermediate', profileLevelSlug: 'beginner' })
  assert.equal(focus, 'intermediate')
})

test('étape mise en avant : un élève placé en B1 n’est pas renvoyé en A1', () => {
  // Aucune activité, A1 non bouclé, mais le profil dit « intermediate »
  const focus = focusLevel({ order: ORDER, isComplete: () => false, profileLevelSlug: 'intermediate' })
  assert.equal(focus, 'intermediate')
})

test('étape mise en avant : sinon le premier niveau non bouclé ; null si tout est bouclé', () => {
  assert.equal(focusLevel({ order: ORDER, isComplete: s => s === 'beginner' }), 'elementary')
  assert.equal(focusLevel({ order: ORDER, isComplete: () => true }), null)
  // dernière activité dans un parcours spécialisé (hors du chemin A1→C1) : ignorée
  assert.equal(focusLevel({ order: ORDER, isComplete: () => false, lastActivitySlug: 'aviation' }), 'beginner')
})
