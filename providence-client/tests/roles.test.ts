/**
 * Règle d'habilitation partagée par l'interface admin et les routes API.
 * Si elle dévie, un admin pourrait se promouvoir superuser ou supprimer un
 * superuser par un appel direct à l'API.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  canManageRole,
  assignableRoles,
  canOverseeOrg,
  canActOn,
  enforcedOrganisation,
  canDeletePermanently,
  canManageOrganisations,
  type AdminRole,
  type UserRole,
} from '../lib/roles.ts'

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

// ── Rattachement à une organisation ──────────────────────────────────────

const ORG_A = '11111111-aaaa-aaaa-aaaa-111111111111'
const ORG_B = '22222222-bbbb-bbbb-bbbb-222222222222'
const SUPER = { role: 'superuser' as const, organisationId: null }
const GLOBAL = { role: 'admin' as const, organisationId: null }
const SCOPED = { role: 'admin' as const, organisationId: ORG_A }

test('un admin sans organisation voit tout le monde (comportement d’avant)', () => {
  assert.equal(canOverseeOrg(GLOBAL, ORG_A), true)
  assert.equal(canOverseeOrg(GLOBAL, ORG_B), true)
  assert.equal(canOverseeOrg(GLOBAL, null), true)
})

test('un admin rattaché ne voit que son organisation', () => {
  assert.equal(canOverseeOrg(SCOPED, ORG_A), true)
  assert.equal(canOverseeOrg(SCOPED, ORG_B), false)
  assert.equal(canOverseeOrg(SCOPED, null), false, 'ni les comptes sans organisation')
})

test('agir sur un compte : règle de rôle ET règle d’organisation', () => {
  assert.equal(canActOn(SCOPED, { role: 'user', organisationId: ORG_A }), true)
  assert.equal(canActOn(SCOPED, { role: 'user', organisationId: ORG_B }), false, 'autre organisation')
  assert.equal(canActOn(SCOPED, { role: 'superuser', organisationId: ORG_A }), false, 'superuser, même dans son organisation')
  assert.equal(canActOn(SUPER, { role: 'superuser', organisationId: ORG_B }), true)
})

test('un admin rattaché crée toujours dans son organisation, quoi qu’il demande', () => {
  assert.equal(enforcedOrganisation(SCOPED, ORG_B), ORG_A)
  assert.equal(enforcedOrganisation(SCOPED, null), ORG_A)
  assert.equal(enforcedOrganisation(GLOBAL, ORG_B), ORG_B)
  assert.equal(enforcedOrganisation(GLOBAL, null), null, 'apprenant sans organisation')
  assert.equal(enforcedOrganisation(SUPER, ORG_A), ORG_A)
})

test('seul le superuser supprime définitivement et gère les organisations', () => {
  assert.equal(canDeletePermanently(SUPER), true)
  assert.equal(canDeletePermanently(GLOBAL), false)
  assert.equal(canDeletePermanently(SCOPED), false)
  assert.equal(canManageOrganisations(SUPER), true)
  assert.equal(canManageOrganisations(GLOBAL), false)
})
