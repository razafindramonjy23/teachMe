/**
 * Lecture complète d'une table, page par page.
 *
 * Supabase plafonne chaque réponse (réglage « Max rows », 1 000 par défaut) :
 * une requête simple renverrait silencieusement une liste tronquée.
 *
 * On avance du nombre de lignes RÉELLEMENT reçues, et on s'arrête sur une page
 * vide : si le plafond du serveur est plus bas que `pageSize`, rien n'est
 * sauté pour autant. La requête doit être triée sur une clé unique pour que
 * les pages soient stables.
 */
export async function fetchPaged<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000,
  maxPages = 1000,
): Promise<T[]> {
  const all: T[] = []
  let from = 0
  for (let i = 0; i < maxPages; i++) {
    const { data, error } = await page(from, from + pageSize - 1)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) return all
    all.push(...data)
    from += data.length
  }
  throw new Error(`Lecture interrompue après ${maxPages} pages`)
}
