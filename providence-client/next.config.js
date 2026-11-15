/** @type {import('next').NextConfig} */
const nextConfig = {
  // `next dev` et `next build` écrivent par défaut dans le même dossier `.next`.
  // Lancer un build pendant qu'un serveur de dev tourne écrase ses chunks et
  // casse toutes les routes (« Cannot find module './xxx.js' ») jusqu'au
  // redémarrage. Définir NEXT_DIST_DIR permet de builder à côté :
  //
  //   NEXT_DIST_DIR=.next-prod npx next build
  //   NEXT_DIST_DIR=.next-prod npx next start
  //
  // Sans la variable, le comportement par défaut est inchangé.
  distDir: process.env.NEXT_DIST_DIR || '.next',
}

module.exports = nextConfig
