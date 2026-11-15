/**
 * Série, pages, objectif du jour, tampons, étape mise en avant.
 * Les dates sont en UTC ; Madagascar est en UTC+3 (sans heure d'été).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  localDay,
  shiftDay,
  isWeekend,
  computeStats,
  computeStamps,
  focusLevel,
  DAILY_GOAL,
  type StampLevel,
} from '../lib/gamification.ts'

// « Maintenant » : mercredi 18 novembre 2026, 10 h à Antananarivo (07:00 UTC)
const NOW = new Date('2026-11-18T07:00:00Z')
// Repères de la semaine : jeu 12, ven 13, sam 14, dim 15, lun 16, mar 17, mer 18
const at = (day: string) => `${day}T05:00:00Z` // 08:00 à Madagascar

test('le jour est celui de Madagascar, pas celui d’UTC', () => {
  // 22:30 UTC le 17 = 01:30 le 18 à Antananarivo
  assert.equal(localDay('2026-11-17T22:30:00Z'), '2026-11-18')
  // 20:59 UTC le 17 = 23:59 le 17 à Antananarivo
  assert.equal(localDay('2026-11-17T20:59:00Z'), '2026-11-17')
})

test('shiftDay traverse les fins de mois et d’année', () => {
  assert.equal(shiftDay('2026-03-01', -1), '2026-02-28')
  assert.equal(shiftDay('2026-12-31', 1), '2027-01-01')
  assert.equal(shiftDay('2028-03-01', -1), '2028-02-29') // année bissextile
})

test('isWeekend reconnaît samedi et dimanche', () => {
  assert.equal(isWeekend('2026-11-14'), true) // samedi
  assert.equal(isWeekend('2026-11-15'), true) // dimanche
  assert.equal(isWeekend('2026-11-16'), false) // lundi
  assert.equal(isWeekend('2026-11-13'), false) // vendredi
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
  const one = computeStats([at('2026-11-18')], NOW)
  assert.equal(one.pages, 10)
  assert.equal(one.todayCount, 1)
  assert.equal(one.goalReached, false)
  const two = computeStats([at('2026-11-18'), '2026-11-18T06:00:00Z'], NOW)
  assert.equal(two.goalReached, true)
})

test('une ressource terminée à 1 h du matin compte pour le bon jour', () => {
  const s = computeStats(['2026-11-17T22:30:00Z'], NOW) // 01:30 le 18 à Madagascar
  assert.equal(s.todayCount, 1)
  assert.equal(s.streak, 1)
})

test('trois jours de semaine d’affilée jusqu’à aujourd’hui : série de 3', () => {
  const s = computeStats([at('2026-11-16'), at('2026-11-17'), at('2026-11-18')], NOW)
  assert.equal(s.streak, 3)
  assert.equal(s.streakAtRisk, false)
})

test('rien encore aujourd’hui : la série tient grâce à hier, mais elle est en danger', () => {
  const s = computeStats([at('2026-11-16'), at('2026-11-17')], NOW)
  assert.equal(s.streak, 2)
  assert.equal(s.streakAtRisk, true)
})

test('un jour de semaine entier sans rien : la série retombe à zéro', () => {
  // jeu + ven, puis lundi et mardi vides
  const s = computeStats([at('2026-11-12'), at('2026-11-13')], NOW)
  assert.equal(s.streak, 0)
  assert.equal(s.bestStreak, 2, 'la meilleure série est conservée')
})

test('plusieurs ressources le même jour ne comptent qu’un jour de série', () => {
  const s = computeStats([at('2026-11-18'), '2026-11-18T06:00:00Z', '2026-11-18T06:30:00Z'], NOW)
  assert.equal(s.streak, 1)
  assert.equal(s.todayCount, 3)
})

test('la meilleure série est la plus longue suite, où qu’elle soit', () => {
  // jeu 1 → dim 4 octobre (4 jours d'activité), puis mar 17 → mer 18 novembre
  const dates = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-11-17', '2026-11-18'].map(at)
  const s = computeStats(dates, NOW)
  assert.equal(s.bestStreak, 4)
  assert.equal(s.streak, 2)
})

// ── Week-ends neutres ─────────────────────────────────────────────────────

test('week-end : un lundi matin, la série du vendredi tient toujours', () => {
  const monday = new Date('2026-11-16T07:00:00Z')
  const s = computeStats([at('2026-11-12'), at('2026-11-13')], monday)
  assert.equal(s.streak, 2, 'samedi et dimanche vides ne cassent rien')
  assert.equal(s.streakAtRisk, true, 'mais lundi est un jour de semaine : il faut travailler')
})

test('week-end : une activité le samedi compte dans la série', () => {
  const monday = new Date('2026-11-16T07:00:00Z')
  const s = computeStats([at('2026-11-13'), at('2026-11-14'), at('2026-11-16')], monday)
  assert.equal(s.streak, 3)
})

test('week-end : un samedi sans activité, la série n’est pas en danger', () => {
  const saturday = new Date('2026-11-14T07:00:00Z')
  const s = computeStats([at('2026-11-13')], saturday)
  assert.equal(s.streak, 1)
  assert.equal(s.streakAtRisk, false)
})

test('week-end : manquer le lundi casse la série, même après un week-end', () => {
  const tuesday = new Date('2026-11-17T07:00:00Z')
  const s = computeStats([at('2026-11-13')], tuesday)
  assert.equal(s.streak, 0)
})

test('week-end : la meilleure série enjambe un week-end vide', () => {
  const s = computeStats([at('2026-11-12'), at('2026-11-13'), at('2026-11-16'), at('2026-11-17')], NOW)
  assert.equal(s.bestStreak, 4)
  assert.equal(s.streak, 4, 'mercredi pas encore travaillé, mais mardi compte')
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
