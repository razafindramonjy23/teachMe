/**
 * Règle d'habilitation partagée par l'interface admin et les routes API.
 * Si elle dévie, un admin pourrait se promouvoir superuser ou supprimer un
 * superuser par un appel direct à l'API.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canManageRole, assignableRoles, type AdminRole, type UserRole } from '../lib/roles.ts'

const matrix: [AdminRole, UserRole, boolean][] = [
  ['superuser', 'superuser', true],
  ['superuser', 'admin', true],
  ['superuser', 'user', true],
  ['admin', 'superuser', false],
  ['admin', 'admin', true],
  ['admin', 'user', true],
]

for (const [caller, target, expected] of matrix) {
  test(`${caller} ${expected ? 'peut' : 'ne peut PAS'} gérer un ${target}`, () => {
    assert.equal(canManageRole(caller, target), expected)
  })
}

test('un admin ne se voit jamais proposer le rôle superuser', () => {
  assert.deepEqual(assignableRoles('admin'), ['user', 'admin'])
})

test('un superuser peut attribuer tous les rôles', () => {
  assert.deepEqual(assignableRoles('superuser'), ['user', 'admin', 'superuser'])
})
