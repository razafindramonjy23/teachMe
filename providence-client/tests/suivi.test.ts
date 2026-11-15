/**
 * Vue encadrant : statut, avancement par niveau, tri par priorité.
 * « Maintenant » : mercredi 18 novembre 2026, 10 h à Antananarivo.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  summarizeStudents,
  overview,
  sortStudents,
  weeklyActivity,
  mondayOf,
  byOrganisation,
  INACTIVE_AFTER_DAYS,
  type StudentProfile,
  type ProgressRow,
  type CatalogLevel,
} from '../lib/suivi.ts'

const NOW = new Date('2026-11-18T07:00:00Z')
const at = (day: string) => `${day}T05:00:00Z`

const CATALOG: CatalogLevel[] = [
  { slug: 'beginner', name: 'Beginner', code: 'A1', kind: 'niveau', ids: ['a', 'b', 'shared'] },
  { slug: 'elementary', name: 'Elementary', code: 'A2', kind: 'niveau', ids: ['c', 'shared'] },
  { slug: 'ielts', name: 'IELTS Preparation', code: 'IELTS', kind: 'parcours', ids: ['d'] },
]

const profile = (id: string, name: string, extra: Partial<StudentProfile> = {}): StudentProfile => ({
  id, name, matricule: null, organisationId: 'org-a', level: 'Beginner', createdAt: '2026-09-01T00:00:00Z', ...extra,
})
const row = (userId: string, resourceId: string, doneDay: string | null, levelSlug = 'beginner', openedDay?: string): ProgressRow => ({
  userId, resourceId, levelSlug,
  openedAt: at(openedDay ?? doneDay ?? '2026-11-01'),
  doneAt: doneDay ? at(doneDay) : null,
})

test('sans aucune ligne de progression : « jamais commencé »', () => {
  const [s] = summarizeStudents([profile('u1', 'Aina')], [], CATALOG, NOW)
  assert.equal(s.status, 'jamais')
  assert.equal(s.lastActivityAt, null)
  assert.equal(s.doneCount, 0)
})

test('activité récente : « actif » ; inactif depuis 7 jours ou plus : « à relancer »', () => {
  assert.equal(INACTIVE_AFTER_DAYS, 7)
  const rows = [
    row('recent', 'a', '2026-11-17'),
    row('six', 'a', '2026-11-12'), // 6 jours
    row('sept', 'a', '2026-11-11'), // 7 jours
  ]
  const by = Object.fromEntries(
    summarizeStudents([profile('recent', 'A'), profile('six', 'B'), profile('sept', 'C')], rows, CATALOG, NOW).map(s => [s.id, s]),
  )
  assert.equal(by.recent.status, 'actif')
  assert.equal(by.six.status, 'actif')
  assert.equal(by.six.daysSinceActivity, 6)
  assert.equal(by.sept.status, 'a-relancer')
})

test('une ressource ouverte sans être cochée compte comme activité', () => {
  const [s] = summarizeStudents([profile('u1', 'Aina')], [row('u1', 'a', null, 'beginner', '2026-11-17')], CATALOG, NOW)
  assert.equal(s.status, 'actif')
  assert.equal(s.doneCount, 0)
})

test('une ressource partagée entre deux niveaux compte dans chacun, mais une seule fois au total', () => {
  const [s] = summarizeStudents([profile('u1', 'Aina')], [row('u1', 'shared', '2026-11-17')], CATALOG, NOW)
  assert.equal(s.doneCount, 1)
  const by = Object.fromEntries(s.levels.map(l => [l.slug, l]))
  assert.equal(by.beginner.done, 1)
  assert.equal(by.elementary.done, 1)
})

test('une ressource retirée du catalogue ne compte plus', () => {
  const [s] = summarizeStudents([profile('u1', 'Aina')], [row('u1', 'retiree', '2026-11-17')], CATALOG, NOW)
  assert.equal(s.doneCount, 0)
  assert.equal(s.status, 'actif', 'mais elle reste une activité récente')
})

test('les progressions des élèves ne se mélangent pas', () => {
  const rows = [row('u1', 'a', '2026-11-17'), row('u1', 'b', '2026-11-17'), row('u2', 'c', '2026-11-17')]
  const by = Object.fromEntries(
    summarizeStudents([profile('u1', 'A'), profile('u2', 'B')], rows, CATALOG, NOW).map(s => [s.id, s]),
  )
  assert.equal(by.u1.doneCount, 2)
  assert.equal(by.u2.doneCount, 1)
})

test('étape recommandée : niveau du profil si aucune activité ; A1 bouclé → A2', () => {
  const [placed] = summarizeStudents([profile('u1', 'A', { level: 'Elementary' })], [], CATALOG, NOW)
  assert.equal(placed.focus?.slug, 'elementary')
  const rows = ['a', 'b', 'shared'].map(id => row('u2', id, '2026-11-17'))
  const [done] = summarizeStudents([profile('u2', 'B')], rows, CATALOG, NOW)
  assert.equal(done.focus?.slug, 'elementary')
  assert.equal(done.focus?.done, 1, 'la ressource partagée compte déjà pour A2')
})

test('ressources terminées cette semaine et série', () => {
  const rows = [row('u1', 'a', '2026-11-16'), row('u1', 'b', '2026-11-17'), row('u1', 'c', '2026-11-02')]
  const [s] = summarizeStudents([profile('u1', 'A')], rows, CATALOG, NOW)
  assert.equal(s.doneThisWeek, 2)
  assert.equal(s.streak, 2)
})

test('vue d’ensemble : un compte par statut', () => {
  const rows = [row('actif', 'a', '2026-11-17'), row('relance', 'a', '2026-11-01')]
  const list = summarizeStudents([profile('actif', 'A'), profile('relance', 'B'), profile('jamais', 'C')], rows, CATALOG, NOW)
  assert.deepEqual(overview(list), { total: 3, actifs: 1, aRelancer: 1, jamais: 1, doneThisWeek: 1 })
})

test('tri « priorité » : à relancer (les plus anciens d’abord), puis jamais commencé, puis actifs', () => {
  const rows = [row('actif', 'a', '2026-11-17'), row('relance10', 'a', '2026-11-08'), row('relance20', 'a', '2026-10-29')]
  const list = summarizeStudents(
    [profile('actif', 'Ando'), profile('jamais', 'Bako'), profile('relance10', 'Fara'), profile('relance20', 'Hery')],
    rows, CATALOG, NOW,
  )
  assert.deepEqual(sortStudents(list, 'priorite').map(s => s.id), ['relance20', 'relance10', 'jamais', 'actif'])
  assert.deepEqual(sortStudents(list, 'nom').map(s => s.name), ['Ando', 'Bako', 'Fara', 'Hery'])
})

// ── Tendance hebdomadaire et répartition par site ─────────────────────────


test('mondayOf : le lundi de la semaine, même un dimanche', () => {
  assert.equal(mondayOf('2026-11-18'), '2026-11-16') // mercredi
  assert.equal(mondayOf('2026-11-16'), '2026-11-16') // lundi
  assert.equal(mondayOf('2026-11-22'), '2026-11-16') // dimanche
  assert.equal(mondayOf('2027-01-01'), '2026-12-28') // à cheval sur l'année
})

test('weeklyActivity : 8 semaines, de la plus ancienne à la semaine en cours', () => {
  const series = weeklyActivity([], NOW, 8)
  assert.equal(series.length, 8)
  assert.equal(series[7].weekStart, '2026-11-16')
  assert.equal(series[0].weekStart, '2026-09-28')
})

test('weeklyActivity : ressources terminées et élèves actifs par semaine', () => {
  const rows = [
    row('u1', 'a', '2026-11-16'),
    row('u1', 'b', '2026-11-18'),
    row('u2', 'c', '2026-11-17'),
    row('u3', 'd', null, 'beginner', '2026-11-17'), // ouvert sans être coché : actif, 0 terminée
    row('u1', 'e', '2026-11-10'), // semaine précédente
    row('u9', 'f', '2026-01-05'), // hors fenêtre : ignoré
  ]
  const series = weeklyActivity(rows, NOW, 8)
  assert.deepEqual(series[7], { weekStart: '2026-11-16', done: 3, activeStudents: 3 })
  assert.deepEqual(series[6], { weekStart: '2026-11-09', done: 1, activeStudents: 1 })
})

test('weeklyActivity : un dimanche soir à Madagascar reste dans sa semaine', () => {
  // dimanche 15 novembre, 23:30 à Antananarivo = 20:30 UTC
  const s = weeklyActivity([{ userId: 'u1', resourceId: 'a', levelSlug: 'beginner', openedAt: null, doneAt: '2026-11-15T20:30:00Z' }], NOW, 2)
  assert.equal(s[0].weekStart, '2026-11-09')
  assert.equal(s[0].done, 1)
  assert.equal(s[1].done, 0)
})

test('byOrganisation : statuts par organisation, la plus grande d’abord, « sans organisation » en dernier', () => {
  const rows = [row('a', 'a', '2026-11-17')]
  const list = summarizeStudents(
    [
      profile('a', 'A', { organisationId: 'org-b' }),
      profile('b', 'B', { organisationId: 'org-a' }),
      profile('c', 'C', { organisationId: 'org-a' }),
      profile('d', 'D', { organisationId: null }),
    ],
    rows, CATALOG, NOW,
  )
  assert.deepEqual(byOrganisation(list), [
    { organisationId: 'org-a', total: 2, actifs: 0, aRelancer: 0, jamais: 2 },
    { organisationId: 'org-b', total: 1, actifs: 1, aRelancer: 0, jamais: 0 },
    { organisationId: null, total: 1, actifs: 0, aRelancer: 0, jamais: 1 },
  ])
})
