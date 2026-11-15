/**
 * Lecture de la liste d'élèves collée par l'admin.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseClassList, chunk, IMPORT_MAX, IMPORT_BATCH_SIZE } from '../lib/import.ts'

test('un nom par ligne, espaces et lignes vides nettoyés', () => {
  const r = parseClassList('  Rakoto   Jean \n\n Rasoa Marie\n   \n')
  assert.deepEqual(r.names, ['Rakoto Jean', 'Rasoa Marie'])
})

test('la numérotation est retirée', () => {
  const r = parseClassList('1. Rakoto Jean\n2) Rasoa Marie\n3 - Randria Paul\n10. Rabe Hery')
  assert.deepEqual(r.names, ['Rakoto Jean', 'Rasoa Marie', 'Randria Paul', 'Rabe Hery'])
})

test('copier-coller de tableur ou CSV : seule la première colonne compte', () => {
  const r = parseClassList('Rakoto Jean\tBAC\t010\n"Rasoa Marie";BEPC;020')
  assert.deepEqual(r.names, ['Rakoto Jean', 'Rasoa Marie'])
})

test('les doublons sont écartés et signalés (casse et accents ignorés)', () => {
  const r = parseClassList('Rakoto Hélène\nRAKOTO HELENE\nRasoa Marie')
  assert.deepEqual(r.names, ['Rakoto Hélène', 'Rasoa Marie'])
  assert.deepEqual(r.duplicates, ['RAKOTO HELENE'])
})

test('au-delà de la limite, les noms sont comptés mais pas retenus', () => {
  const text = Array.from({ length: IMPORT_MAX + 5 }, (_, i) => `Élève ${i}`).join('\n')
  const r = parseClassList(text)
  assert.equal(r.names.length, IMPORT_MAX)
  assert.equal(r.overflow, 5)
})

test('un nom très long est tronqué à 100 caractères', () => {
  assert.equal(parseClassList('x'.repeat(250)).names[0].length, 100)
})

test('découpage en paquets pour l’API', () => {
  assert.equal(IMPORT_BATCH_SIZE, 10)
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]])
  assert.deepEqual(chunk([], 10), [])
  assert.equal(chunk(Array.from({ length: 35 }, (_, i) => i), IMPORT_BATCH_SIZE).length, 4)
})
