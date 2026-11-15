/**
 * Saisie d'une organisation : nom requis, espaces nettoyés, lieu facultatif.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanOrganisationInput, organisationLabel, ORG_NAME_MAX } from '../lib/organisations.ts'

test('nom et lieu nettoyés des espaces superflus', () => {
  assert.deepEqual(cleanOrganisationInput({ name: '  Lycée   Jules Ferry ', place: ' Toamasina  ' }), {
    ok: true, name: 'Lycée Jules Ferry', place: 'Toamasina',
  })
})

test('le lieu est facultatif', () => {
  assert.deepEqual(cleanOrganisationInput({ name: 'Air Madagascar' }), { ok: true, name: 'Air Madagascar', place: null })
  assert.deepEqual(cleanOrganisationInput({ name: 'Air Madagascar', place: '   ' }), { ok: true, name: 'Air Madagascar', place: null })
})

test('un nom vide ou absent est refusé', () => {
  for (const raw of [{ name: '' }, { name: '   ' }, {}, null, 'texte', { name: 42 }]) {
    assert.equal(cleanOrganisationInput(raw).ok, false, JSON.stringify(raw))
  }
})

test('les longueurs sont bornées', () => {
  assert.equal(cleanOrganisationInput({ name: 'x'.repeat(ORG_NAME_MAX) }).ok, true)
  assert.equal(cleanOrganisationInput({ name: 'x'.repeat(ORG_NAME_MAX + 1) }).ok, false)
  assert.equal(cleanOrganisationInput({ name: 'A', place: 'y'.repeat(ORG_NAME_MAX + 1) }).ok, false)
})

test('libellé d’affichage', () => {
  assert.equal(organisationLabel({ id: '1', name: 'Alarobia', place: null }), 'Alarobia')
  assert.equal(organisationLabel({ id: '1', name: 'Cours du soir', place: 'Paris, France' }), 'Cours du soir — Paris, France')
  assert.equal(organisationLabel(null), 'Aucune organisation')
})
