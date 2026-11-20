/**
 * Séries d'activité : jours, semaines, heures, parts.
 * Les dates sont en UTC ; Madagascar est en UTC+3 (sans heure d'été).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  localHour,
  weekdayOf,
  startOfWeek,
  shortDayLabel,
  dailyActivity,
  weeklyActivity,
  hourlyActivity,
  peakHour,
  countSince,
  firstActiveDay,
  shares,
  perActiveDay,
} from '../lib/activity.ts'

// « Maintenant » : mercredi 18 novembre 2026, 10 h à Antananarivo (07:00 UTC)
const NOW = new Date('2026-11-18T07:00:00Z')
const at = (day: string, utcHour = 5) => `${day}T${String(utcHour).padStart(2, '0')}:00:00Z`

test('l’heure est celle de Madagascar, pas celle d’UTC', () => {
  // 22:30 UTC le 17 = 01:30 le 18 à Antananarivo
  assert.equal(localHour('2026-11-17T22:30:00Z'), 1)
  // 05:00 UTC = 08:00 à Antananarivo
  assert.equal(localHour('2026-11-18T05:00:00Z'), 8)
  // minuit pile à Antananarivo = 21:00 UTC la veille
  assert.equal(localHour('2026-11-17T21:00:00Z'), 0)
})

test('la semaine commence le lundi', () => {
  assert.equal(weekdayOf('2026-11-16'), 1) // lundi
  assert.equal(weekdayOf('2026-11-18'), 3) // mercredi
  assert.equal(weekdayOf('2026-11-22'), 7) // dimanche
  assert.equal(startOfWeek('2026-11-18'), '2026-11-16')
  assert.equal(startOfWeek('2026-11-16'), '2026-11-16')
  assert.equal(startOfWeek('2026-11-22'), '2026-11-16')
  // la semaine précédente traverse le changement de mois
  assert.equal(startOfWeek('2026-11-01'), '2026-10-26')
})

test('l’étiquette de jour est courte et française', () => {
  assert.equal(shortDayLabel('2026-11-16'), '16 nov.')
  assert.equal(shortDayLabel('2026-01-05'), '5 janv.')
  assert.equal(shortDayLabel('2026-08-31'), '31 août')
})

test('la série quotidienne est continue, les jours vides valent zéro', () => {
  const done = [at('2026-11-18'), at('2026-11-18', 6), at('2026-11-16')]
  const points = dailyActivity(done, 7, NOW)

  assert.equal(points.length, 7)
  assert.equal(points[0].day, '2026-11-12')
  assert.equal(points[6].day, '2026-11-18')
  assert.deepEqual(
    points.map(p => p.count),
    [0, 0, 0, 0, 1, 0, 2],
  )
})

test('une ressource terminée après 21 h UTC compte pour le lendemain malgache', () => {
  // 22:00 UTC le 17 = 01:00 le 18 à Antananarivo
  const points = dailyActivity([at('2026-11-17', 22)], 2, NOW)
  assert.deepEqual(
    points.map(p => [p.day, p.count]),
    [
      ['2026-11-17', 0],
      ['2026-11-18', 1],
    ],
  )
})

test('la série hebdomadaire finit sur la semaine en cours, même incomplète', () => {
  const done = [
    at('2026-11-18'), // semaine du 16
    at('2026-11-16'), // semaine du 16
    at('2026-11-10'), // semaine du 9
    at('2026-11-03'), // semaine du 2
    at('2026-10-20'), // hors fenêtre de 3 semaines
  ]
  const weeks = weeklyActivity(done, 3, NOW)

  assert.deepEqual(
    weeks.map(w => [w.weekStart, w.count]),
    [
      ['2026-11-02', 1],
      ['2026-11-09', 1],
      ['2026-11-16', 2],
    ],
  )
  assert.equal(weeks[2].label, '16 nov.')
})

test('le cadran horaire a toujours ses 24 secteurs', () => {
  const points = hourlyActivity([at('2026-11-18', 5)], 30, NOW)
  assert.equal(points.length, 24)
  assert.deepEqual(
    points.map(p => p.hour),
    Array.from({ length: 24 }, (_, i) => i),
  )
  assert.equal(points[8].count, 1) // 05:00 UTC = 08:00 à Madagascar
})

test('le cadran horaire ignore ce qui précède la fenêtre', () => {
  const done = [at('2026-11-18', 5), at('2026-09-01', 5)]
  const recent = hourlyActivity(done, 30, NOW)
  assert.equal(recent.reduce((n, p) => n + p.count, 0), 1)

  const wide = hourlyActivity(done, 120, NOW)
  assert.equal(wide.reduce((n, p) => n + p.count, 0), 2)
})

test('l’heure de pointe est la plus active, la plus matinale en cas d’égalité', () => {
  assert.equal(peakHour(hourlyActivity([], 30, NOW)), null)

  const done = [at('2026-11-18', 5), at('2026-11-17', 5), at('2026-11-16', 15)]
  assert.equal(peakHour(hourlyActivity(done, 30, NOW)), 8)

  // égalité entre 8 h et 18 h : 8 h gagne
  const tie = [at('2026-11-18', 5), at('2026-11-17', 15)]
  assert.equal(peakHour(hourlyActivity(tie, 30, NOW)), 8)
})

test('countSince compte aujourd’hui inclus', () => {
  const done = [at('2026-11-18'), at('2026-11-12'), at('2026-10-01')]
  assert.equal(countSince(done, 1, NOW), 1)
  assert.equal(countSince(done, 7, NOW), 2)
  assert.equal(countSince(done, 90, NOW), 3)
})

test('firstActiveDay trouve le plus ancien jour, pas le premier de la liste', () => {
  assert.equal(firstActiveDay([]), null)
  assert.equal(firstActiveDay([at('2026-11-18'), at('2026-09-01'), at('2026-10-01')]), '2026-09-01')
})

test('les parts écartent le vide et trient du plus grand au plus petit', () => {
  const result = shares([
    { slug: 'a', count: 1 },
    { slug: 'b', count: 3 },
    { slug: 'c', count: 0 },
  ])
  assert.deepEqual(
    result.map(r => [r.slug, r.count, r.share]),
    [
      ['b', 3, 75],
      ['a', 1, 25],
    ],
  )
})

test('aucune part quand rien n’est terminé', () => {
  assert.deepEqual(shares([{ slug: 'a', count: 0 }]), [])
})

test('la moyenne ne compte que les jours actifs', () => {
  const points = dailyActivity([at('2026-11-18'), at('2026-11-18', 6), at('2026-11-16')], 7, NOW)
  // 3 ressources sur 2 jours actifs
  assert.equal(perActiveDay(points), 1.5)
  assert.equal(perActiveDay(dailyActivity([], 7, NOW)), 0)
})
