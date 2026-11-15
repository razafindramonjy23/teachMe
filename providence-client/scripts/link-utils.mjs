/**
 * Fonctions pures du vérificateur de catalogue — sans réseau, donc testables.
 * Utilisées par scripts/check-catalog.mjs et par tests/link-utils.test.ts.
 */

/** Hôte sans « www. », en minuscules. Chaîne vide si l'URL est illisible. */
export function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

/**
 * Domaine « enregistrable » approximatif : bbc.co.uk, elllo.org, eslgold.com…
 * Sert à repérer un domaine racheté qui redirige vers un site sans rapport
 * (cas réels trouvés dans ce catalogue : aj3000.com → site de jeux d'argent,
 * waynefarleyaviation.com → southcookinglake.com).
 */
export function siteOf(url) {
  const labels = hostOf(url).split('.').filter(Boolean)
  if (labels.length <= 2) return labels.join('.')
  const [sld, tld] = labels.slice(-2)
  const compoundSuffix = tld.length === 2 && ['co', 'com', 'org', 'net', 'ac', 'gov', 'edu'].includes(sld)
  return labels.slice(compoundSuffix ? -3 : -2).join('.')
}

/** Vrai si l'URL finale appartient à un autre site que l'URL de départ. */
export function leavesSite(fromUrl, toUrl) {
  return siteOf(fromUrl) !== siteOf(toUrl)
}

/**
 * Cible d'une redirection HTML <meta http-equiv="refresh" content="0;URL=…">,
 * résolue par rapport à `baseUrl`. `null` s'il n'y en a pas.
 */
export function metaRefreshTarget(html, baseUrl) {
  const match = html.match(
    /<meta[^>]+http-equiv=["']?refresh["']?[^>]*content=["']?\s*\d+\s*;\s*url=([^"'>\s]+)/i,
  )
  if (!match) return null
  try {
    return new URL(match[1], baseUrl).href
  } catch {
    return null
  }
}

/** Vrai si l'hôte de l'URL figure dans la liste (ou en est un sous-domaine). */
export function matchesHost(url, hosts) {
  const host = hostOf(url)
  return hosts.some(h => host === h || host.endsWith('.' + h))
}
