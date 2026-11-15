/**
 * Invariants du catalogue et de l'identité des ressources.
 *
 * Pourquoi c'est critique : `resourceId()` est la clé de la table
 * `resource_progress`. Deux ressources différentes avec le même identifiant
 * partageraient leur case « terminé » ; un identifiant qui change détache la
 * progression déjà enregistrée par les étudiants.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  levelData,
  resourceId,
  normalizeUrl,
  levelResourceIds,
  allResourceIds,
  totalResourceCount,
  findResource,
} from '../lib/resources.ts'
import { LEVELS, COURSES } from '../lib/catalog.ts'

const placements = Object.entries(levelData).flatMap(([level, entry]) =>
  entry.categories.flatMap(cat => cat.links.map(link => ({ level, category: cat.label, ...link }))),
)

test('deux URLs canoniques différentes ne partagent jamais un identifiant', () => {
  const canonicalById = new Map<string, string>()
  for (const { url } of placements) {
    const id = resourceId(url)
    const canonical = normalizeUrl(url)
    const seen = canonicalById.get(id)
    assert.ok(!seen || seen === canonical, `collision ${id} : ${seen} ≠ ${canonical}`)
    canonicalById.set(id, canonical)
  }
})

test('les identifiants tiennent dans la colonne SQL (≤ 200) et ont un format stable', () => {
  for (const id of allResourceIds()) {
    assert.ok(id.length <= 200, `trop long : ${id}`)
    assert.match(id, /^[a-z0-9-]+~[a-z0-9]{7,}$/, `format inattendu : ${id}`)
  }
})

test('passer un lien de http à https ne change pas son identifiant', () => {
  // C'est ce qui a permis de migrer 36 liens en https sans perdre de progression.
  const id = resourceId('http://www.eslgold.com/grammar/high_beginning/')
  assert.equal(resourceId('https://www.eslgold.com/grammar/high_beginning/'), id)
  assert.equal(resourceId('https://eslgold.com/grammar/high_beginning'), id, 'www. et / final ignorés')
  assert.equal(resourceId('HTTPS://ESLGOLD.COM/grammar/high_beginning'), id, 'casse de l’hôte ignorée')
})

test('le chemin, la requête et le fragment distinguent les ressources', () => {
  const base = 'https://www.isabelperez.com/grammar.htm'
  assert.notEqual(resourceId(`${base}#Grammar`), resourceId(`${base}#Vocabulary`), 'sections différentes')
  assert.notEqual(resourceId('https://a.com/page1'), resourceId('https://a.com/page2'))
  assert.notEqual(resourceId('https://a.com/p?ID=1'), resourceId('https://a.com/p?ID=40'))
  // Le chemin est sensible à la casse côté serveur : on ne le normalise pas.
  assert.notEqual(resourceId('https://a.com/Page'), resourceId('https://a.com/page'))
})

test('une même page listée à plusieurs niveaux est une seule ressource', () => {
  const placementCount = placements.length
  const distinct = totalResourceCount()
  assert.ok(distinct < placementCount, 'le catalogue contient des ressources partagées entre niveaux')
  assert.equal(distinct, new Set(placements.map(p => resourceId(p.url))).size)
})

test('aucun niveau ne liste deux fois la même ressource', () => {
  for (const level of Object.keys(levelData)) {
    const ids = levelResourceIds(level)
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
    assert.deepEqual(dupes, [], `doublon dans « ${level} »`)
  }
})

test('chaque niveau et cours affiché dans l’interface existe dans le catalogue', () => {
  // Sinon la carte du dashboard mène à « Niveau introuvable ».
  for (const item of [...LEVELS, ...COURSES]) {
    assert.ok(levelData[item.slug], `slug absent de lib/resources.ts : ${item.slug}`)
    assert.equal(item.href, `/dashboard/levels/${item.slug}`, `href incohérent pour ${item.slug}`)
  }
})

test('aucune catégorie n’est vide', () => {
  for (const [level, entry] of Object.entries(levelData)) {
    for (const cat of entry.categories) {
      assert.ok(cat.links.length > 0, `catégorie vide : ${level} / ${cat.label}`)
    }
  }
})

test('les URLs du catalogue sont valides et en http(s)', () => {
  for (const { url, level, category } of placements) {
    const parsed = new URL(url) // lève si invalide
    assert.ok(['http:', 'https:'].includes(parsed.protocol), `${level}/${category} : ${url}`)
  }
})

test('findResource retrouve une ressource, et renvoie null pour une ressource retirée', () => {
  const first = placements[0]
  const found = findResource(resourceId(first.url))
  assert.ok(found)
  assert.equal(found.url, first.url)
  assert.equal(found.levelSlug, first.level)
  assert.equal(findResource('ressource-retiree~0000000'), null)
})

test('les domaines retirés pour détournement ne réapparaissent pas', () => {
  // Retirés le 2026-11-15 : redirigeaient vers des sites sans rapport, dont
  // un site de jeux d'argent (aj3000.com). Voir scripts/check-catalog.mjs.
  const banned = ['aj3000.com', 'waynefarleyaviation.com', 'tyronebishop.com']
  for (const { url } of placements) {
    for (const domain of banned) assert.ok(!url.includes(domain), `domaine banni réintroduit : ${url}`)
  }
})
