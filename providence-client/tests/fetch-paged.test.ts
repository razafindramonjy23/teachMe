/**
 * Pagination face au plafond de lignes de Supabase : aucune ligne ne doit
 * être perdue, même si le serveur renvoie moins que la taille de page demandée.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fetchPaged } from '../lib/supabase/fetch-paged.ts'

/** Faux serveur : `total` lignes numérotées, au plus `cap` par réponse. */
function server(total: number, cap: number) {
  const rows = Array.from({ length: total }, (_, i) => i)
  let calls = 0
  const page = async (from: number, to: number) => {
    calls++
    return { data: rows.slice(from, Math.min(to + 1, from + cap)), error: null }
  }
  return { page, calls: () => calls }
}

test('lit toutes les lignes au-delà d’une page', async () => {
  const s = server(2500, 1000)
  const all = await fetchPaged(s.page, 1000)
  assert.equal(all.length, 2500)
  assert.deepEqual(all.slice(0, 3), [0, 1, 2])
  assert.equal(all[2499], 2499)
})

test('serveur plafonné plus bas que la page demandée : rien n’est sauté', async () => {
  // Le piège : avancer de 1 000 quand le serveur n'en renvoie que 100
  // sauterait 900 lignes à chaque page.
  const s = server(950, 100)
  const all = await fetchPaged(s.page, 1000)
  assert.equal(all.length, 950)
  assert.deepEqual(all, Array.from({ length: 950 }, (_, i) => i), 'aucun trou, aucun doublon')
})

test('table vide : une seule requête, liste vide', async () => {
  const s = server(0, 1000)
  assert.deepEqual(await fetchPaged(s.page), [])
  assert.equal(s.calls(), 1)
})

test('une erreur du serveur est remontée, pas avalée', async () => {
  const failing = async () => ({ data: null, error: { message: 'permission denied' } })
  await assert.rejects(fetchPaged(failing), /permission denied/)
})
