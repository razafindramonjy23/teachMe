/**
 * Recherche dans le catalogue : repli des accents, ordre des résultats,
 * dédoublonnage des ressources listées à plusieurs niveaux.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fold, searchCatalog, searchIndex } from '../lib/search.ts'
import { totalResourceCount } from '../lib/resources.ts'
import { LEVELS, COURSES } from '../lib/catalog.ts'

test('fold ignore accents, casse et ponctuation', () => {
  assert.equal(fold('Préparation'), 'preparation')
  assert.equal(fold('C1 Advanced (CAE)'), 'c1 advanced cae')
  assert.equal(fold('  Pre-Intermediate  '), 'pre intermediate')
})

test('l’index couvre niveaux, parcours et ressources distinctes', () => {
  const index = searchIndex()
  const niveaux = index.filter(e => e.kind === 'niveau')
  const parcours = index.filter(e => e.kind === 'parcours')
  const ressources = index.filter(e => e.kind === 'ressource')

  assert.equal(niveaux.length, LEVELS.length)
  assert.equal(parcours.length, COURSES.length)
  // une page listée à plusieurs niveaux n'est indexée qu'une fois
  assert.equal(ressources.length, totalResourceCount())
})

test('une requête vide ne renvoie rien', () => {
  assert.deepEqual(searchCatalog(''), [])
  assert.deepEqual(searchCatalog('   '), [])
})

test('la recherche ignore les accents', () => {
  const hits = searchCatalog('preparation')
  assert.ok(hits.length > 0)
  assert.ok(hits.some(h => h.title.includes('IELTS')))
})

test('un niveau passe devant une ressource', () => {
  const hits = searchCatalog('beginner')
  assert.equal(hits[0].kind, 'niveau')
  assert.equal(hits[0].title, 'Beginner')
  assert.equal(hits[0].href, '/dashboard/levels/beginner')
  assert.equal(hits[0].external, false)
})

test('tous les mots doivent correspondre', () => {
  const large = searchCatalog('business', 50)
  const narrow = searchCatalog('business english', 50)
  assert.ok(large.length >= narrow.length)
  assert.ok(narrow.every(h => fold(`${h.title} ${h.subtitle}`).includes('business')))
})

test('une requête sans correspondance renvoie une liste vide', () => {
  assert.deepEqual(searchCatalog('zzzzzzzz'), [])
})

test('la limite est respectée', () => {
  assert.ok(searchCatalog('e', 3).length <= 3)
})

test('une ressource porte son identifiant de progression et son niveau', () => {
  const hit = searchCatalog('grammar', 50).find(h => h.kind === 'ressource')
  assert.ok(hit, 'au moins une ressource attendue')
  assert.equal(hit.external, true)
  assert.ok(hit.resourceId && hit.resourceId.length > 0)
  assert.ok(hit.levelSlug && hit.levelSlug.length > 0)
  assert.ok(hit.href.startsWith('http'))
})
