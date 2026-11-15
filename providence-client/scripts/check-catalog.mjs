#!/usr/bin/env node
/**
 * Vérificateur du catalogue de ressources (lib/resources.ts).
 *
 *   npm run catalog:check            contrôles statiques + test de chaque lien
 *   npm run catalog:check -- --offline   contrôles statiques uniquement (rapide, sans réseau)
 *   npm run catalog:check -- --write     applique les passages http → https sûrs
 *
 * Contrôles statiques (bloquants) :
 *   - même URL listée deux fois dans un même niveau (vrai doublon)
 *   - collision d'identifiants (deux URLs différentes, un même resource_id)
 *   - identifiant trop long pour la colonne SQL (> 200 caractères)
 *   - URL mal formée
 *
 * Contrôles réseau :
 *   - lien mort (404, 410, domaine introuvable)                → bloquant
 *   - redirection vers un AUTRE site (domaine racheté)         → bloquant
 *   - lien en erreur temporaire (5xx, délai dépassé)           → à revérifier
 *   - hôte qui bloque les robots (403/429 attendus)            → non vérifiable ici
 *   - lien http:// dont la version https:// mène au même endroit → upgradable
 *
 * Limite connue : une redirection faite en JavaScript (location.href = …) n'est
 * pas suivie. Seules les redirections HTTP et <meta http-equiv="refresh"> le sont.
 *
 * Code de sortie : 1 si un problème bloquant est trouvé, 0 sinon.
 * Prérequis : Node ≥ 22.6 (import natif du TypeScript). Aucune dépendance.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { siteOf, metaRefreshTarget, matchesHost } from './link-utils.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CATALOG_FILE = path.join(ROOT, 'lib', 'resources.ts')

const args = new Set(process.argv.slice(2))
const OFFLINE = args.has('--offline')
const WRITE = args.has('--write')

/**
 * Hôtes connus pour refuser les requêtes automatisées (pare-feu anti-robot).
 * Un 403/429/échec réseau sur ces hôtes ne signifie PAS que le lien est mort :
 * un étudiant y accède normalement depuis son navigateur.
 */
const BOT_BLOCKING_HOSTS = [
  // « Access Denied » même dans Chrome headless ; accessible à un humain
  'learnenglish.britishcouncil.org',
  'britishcouncil.org',
  // 403 aux requêtes automatisées, page rendue normalement dans un navigateur
  'englishclub.com',
  'usingenglish.com',
  'icao.int',
  'businessenglishpod.com',
  // défi Cloudflare (« Un instant… ») qu'un navigateur humain franchit
  'liveatc.net',
  'test-english.com',
  'idpielts.me',
  // refusent le client HTTP de Node (socket coupé / 502), OK dans Chrome
  'speakspeak.com',
  'airplanegeeks.com',
]

const TIMEOUT_MS = 15_000
const CONCURRENCY = 8
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'

// ─── Chargement du catalogue (le vrai code, pas une copie) ──────────────────
const catalog = await import(CATALOG_FILE)
const { levelData, resourceId, normalizeUrl } = catalog

/** @type {{level: string, category: string, title: string, url: string, id: string}[]} */
const placements = []
for (const [level, entry] of Object.entries(levelData)) {
  for (const cat of entry.categories) {
    for (const link of cat.links) {
      placements.push({ level, category: cat.label, title: link.title, url: link.url, id: resourceId(link.url) })
    }
  }
}
const uniqueUrls = [...new Set(placements.map(p => p.url))]

const blocking = []
const warnings = []
const line = (s = '') => console.log(s)
const isBotBlocking = url => matchesHost(url, BOT_BLOCKING_HOSTS)


line(`Catalogue : ${Object.keys(levelData).length} niveaux, ${placements.length} emplacements, ${uniqueUrls.length} URLs distinctes`)
line()

// ─── 1. Contrôles statiques ─────────────────────────────────────────────────
line('■ Contrôles statiques')

// 1a. URL mal formée
for (const p of placements) {
  try {
    const u = new URL(p.url)
    if (!['http:', 'https:'].includes(u.protocol)) throw new Error('protocole')
  } catch {
    blocking.push(`URL invalide : ${p.url} (${p.level} / ${p.category})`)
  }
}

// 1b. Doublon dans un même niveau
const perLevel = new Map()
for (const p of placements) {
  const key = `${p.level}::${p.id}`
  perLevel.set(key, [...(perLevel.get(key) ?? []), p])
}
for (const list of perLevel.values()) {
  if (list.length > 1) {
    blocking.push(
      `Doublon dans le niveau « ${list[0].level} » : ${list[0].url}\n` +
        list.map(p => `      - [${p.category}] ${p.title}`).join('\n'),
    )
  }
}

// 1c. Collision d'identifiants (deux URLs canoniques différentes, même id)
const byId = new Map()
for (const url of uniqueUrls) {
  const id = resourceId(url)
  const canonical = normalizeUrl(url)
  const seen = byId.get(id)
  if (seen && seen !== canonical) blocking.push(`Collision d'identifiant ${id} : ${seen} ≠ ${canonical}`)
  byId.set(id, canonical)
}

// 1d. Longueur compatible avec la contrainte SQL
for (const id of byId.keys()) {
  if (id.length > 200) blocking.push(`Identifiant > 200 caractères : ${id}`)
}

// 1e. Information : ressources partagées entre niveaux (légitime, non bloquant)
const levelsByUrl = new Map()
for (const p of placements) levelsByUrl.set(p.id, new Set([...(levelsByUrl.get(p.id) ?? []), p.level]))
const shared = [...levelsByUrl.values()].filter(s => s.size > 1).length

line(`  URLs valides, sans doublon intra-niveau, identifiants uniques : ${blocking.length === 0 ? 'oui ✓' : 'NON ✘'}`)
line(`  Ressources partagées entre plusieurs niveaux : ${shared} (normal — une seule case « terminé » chacune)`)
line(`  Liens en http:// non chiffré : ${uniqueUrls.filter(u => u.startsWith('http://')).length}`)
line()

// ─── 2. Contrôles réseau ────────────────────────────────────────────────────
const upgradable = []

async function probe(url) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,*/*' },
    })
    let finalUrl = res.url
    // fetch suit les redirections HTTP mais pas les redirections HTML
    // (<meta http-equiv="refresh">). Un domaine racheté peut s'en servir pour
    // renvoyer vers un autre site : on lit le début de la page pour la suivre.
    const type = res.headers.get('content-type') ?? ''
    if (res.ok && type.includes('html') && res.body) {
      const head = await readHead(res.body, 64 * 1024)
      finalUrl = metaRefreshTarget(head, res.url) ?? res.url
    } else {
      res.body?.cancel().catch(() => {})
    }
    return { status: res.status, finalUrl }
  } catch (e) {
    const code = e?.cause?.code ?? e?.name ?? 'ERREUR'
    return { status: 0, finalUrl: url, error: code }
  }
}

/** Lit au plus `limit` octets du corps puis coupe la connexion. */
async function readHead(body, limit) {
  const reader = body.getReader()
  const chunks = []
  let size = 0
  try {
    while (size < limit) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      size += value.length
    }
  } finally {
    reader.cancel().catch(() => {})
  }
  return new TextDecoder().decode(Buffer.concat(chunks.map(c => Buffer.from(c))))
}

async function pool(items, worker) {
  const results = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (next < items.length) {
        const i = next++
        results[i] = await worker(items[i], i)
        if (process.stdout.isTTY) process.stdout.write(`\r  … ${i + 1}/${items.length}`)
      }
    }),
  )
  if (process.stdout.isTTY) process.stdout.write('\r' + ' '.repeat(30) + '\r')
  return results
}

if (!OFFLINE) {
  line(`■ Test des ${uniqueUrls.length} liens (délai ${TIMEOUT_MS / 1000}s, ${CONCURRENCY} en parallèle)`)

  const results = await pool(uniqueUrls, async url => {
    const r = await probe(url)
    let https = null
    if (url.startsWith('http://')) {
      const httpsUrl = 'https://' + url.slice('http://'.length)
      const sameSite = siteOf(r.finalUrl) === siteOf(url)
      // Déjà redirigé vers https par le site lui-même (et pas vers un autre site) ?
      if (r.finalUrl.startsWith('https://') && r.status >= 200 && r.status < 400 && sameSite) {
        https = { ok: true, target: httpsUrl }
      } else if (sameSite) {
        const h = await probe(httpsUrl)
        const sameDestination = normalizeUrl(h.finalUrl) === normalizeUrl(r.finalUrl)
        https = { ok: h.status >= 200 && h.status < 400 && sameDestination, target: httpsUrl }
      } else {
        // Redirigé ailleurs : jamais d'upgrade automatique, le lien est signalé plus bas.
        https = { ok: false, target: httpsUrl }
      }
    }
    return { url, ...r, https }
  })

  const where = url => {
    const p = placements.filter(x => x.url === url)
    return [...new Set(p.map(x => x.level))].join(', ')
  }

  const ok = [], dead = [], flaky = [], blocked = [], hijacked = []
  for (const r of results) {
    if (r.https?.ok) upgradable.push(r.url)
    const reachable = r.status >= 200 && r.status < 400
    if (reachable && siteOf(r.finalUrl) !== siteOf(r.url)) hijacked.push(r)
    else if (reachable) ok.push(r)
    else if (isBotBlocking(r.url)) blocked.push(r)
    else if (r.status === 404 || r.status === 410 || r.error === 'ENOTFOUND') dead.push(r)
    else flaky.push(r)
  }

  line(`  ✓ accessibles                    : ${ok.length}`)
  line(`  ⊘ non vérifiables (anti-robot)   : ${blocked.length}  — ${BOT_BLOCKING_HOSTS.join(', ')}`)
  line(`  ⚠ à revérifier (5xx, délai, 403) : ${flaky.length}`)
  line(`  ✘ morts (404, 410, domaine)      : ${dead.length}`)
  line(`  ✘ redirigés vers un autre site   : ${hijacked.length}`)
  line(`  ↑ http:// upgradables en https   : ${upgradable.length}`)
  line()

  for (const r of dead) blocking.push(`Lien mort [${r.status || r.error}] ${r.url}  (niveaux : ${where(r.url)})`)
  for (const r of hijacked)
    blocking.push(`Redirige vers un autre site : ${r.url} → ${r.finalUrl}  (niveaux : ${where(r.url)})`)
  for (const r of flaky) warnings.push(`À revérifier [${r.status || r.error}] ${r.url}  (niveaux : ${where(r.url)})`)
}

// ─── 3. Réécriture http → https (optionnelle) ───────────────────────────────
if (WRITE) {
  if (OFFLINE) {
    line('--write nécessite le test réseau (incompatible avec --offline) : rien n’est modifié.')
  } else if (upgradable.length === 0) {
    line('Aucun lien à passer en https.')
  } else {
    let source = await readFile(CATALOG_FILE, 'utf8')
    let count = 0
    for (const url of upgradable) {
      const https = 'https://' + url.slice('http://'.length)
      const needle = `url: '${url}'`
      const occurrences = source.split(needle).length - 1
      if (occurrences > 0) {
        source = source.split(needle).join(`url: '${https}'`)
        count += occurrences
      }
    }
    await writeFile(CATALOG_FILE, source)
    line(`✓ ${upgradable.length} URLs passées en https (${count} emplacements réécrits dans lib/resources.ts).`)
    line('  Les identifiants de progression sont inchangés : le protocole est ignoré par resourceId().')
  }
  line()
}

// ─── Rapport ────────────────────────────────────────────────────────────────
if (warnings.length) {
  line('■ Avertissements')
  warnings.forEach(w => line('  ' + w))
  line()
}
if (blocking.length) {
  line('■ Problèmes bloquants')
  blocking.forEach(b => line('  ✘ ' + b))
  line()
  process.exit(1)
}
line(OFFLINE ? 'Contrôles statiques OK.' : 'Catalogue OK.')
