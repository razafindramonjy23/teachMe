/**
 * Détection des liens détournés par le vérificateur de catalogue.
 * Les cas testés sont ceux réellement trouvés dans le catalogue le 2026-11-15.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { siteOf, leavesSite, metaRefreshTarget, matchesHost } from '../scripts/link-utils.mjs'

test('siteOf ramène un hôte à son domaine enregistrable', () => {
  assert.equal(siteOf('https://www.eslgold.com/grammar/'), 'eslgold.com')
  assert.equal(siteOf('https://learnenglish.britishcouncil.org/skills'), 'britishcouncil.org')
  assert.equal(siteOf('https://www.bbc.co.uk/learningenglish'), 'bbc.co.uk')
  assert.equal(siteOf('pas une url'), '')
})

test('détecte les domaines rachetés qui redirigent vers un autre site', () => {
  // site de jeux d'argent — affiché sur 5 niveaux avant retrait
  assert.ok(leavesSite('http://aj3000.com/wp/free-graded-readers/', 'https://www.feriatlaxcala.com/feria-tlaxcala-2025/'))
  assert.ok(leavesSite('http://waynefarleyaviation.com/', 'https://www.southcookinglake.com/about/history'))
})

test('ne signale pas les redirections internes à un même site', () => {
  assert.equal(leavesSite('http://www.eslgold.com/x', 'https://eslgold.com/x/'), false, 'http → https')
  assert.equal(leavesSite('https://bbc.co.uk/a', 'https://www.bbc.co.uk/b'), false)
  assert.equal(leavesSite('https://learnenglish.britishcouncil.org/a', 'https://www.britishcouncil.org/b'), false)
})

test('signale aussi un changement d’extension, même légitime, pour relecture humaine', () => {
  // esl-bits.net → esl-bits.eu était une vraie migration : le script la
  // signale, un humain tranche. C'est voulu.
  assert.ok(leavesSite('http://esl-bits.net/', 'https://esl-bits.eu/'))
})

test('suit les redirections HTML <meta http-equiv="refresh">', () => {
  const relative = '<meta http-equiv="refresh" content="0;URL=home.html" />'
  assert.equal(metaRefreshTarget(relative, 'https://esl-bits.eu/'), 'https://esl-bits.eu/home.html')

  const absolute = `<META HTTP-EQUIV='Refresh' CONTENT='5; url=https://casino.example/'>`
  assert.equal(metaRefreshTarget(absolute, 'https://site.org/'), 'https://casino.example/')

  assert.equal(metaRefreshTarget('<html><head><title>x</title></head></html>', 'https://a.com/'), null)
})

test('la liste anti-robot couvre les sous-domaines', () => {
  const hosts = ['britishcouncil.org']
  assert.ok(matchesHost('https://learnenglish.britishcouncil.org/x', hosts))
  assert.ok(matchesHost('https://www.britishcouncil.org/x', hosts))
  assert.equal(matchesHost('https://britishcouncil.org.evil.com/x', hosts), false)
})
