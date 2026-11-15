'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, Monitor, Clock, Volume2, Users, AlertTriangle, Info } from 'lucide-react'

const rules = [
  {
    icon: ShieldCheck,
    title: 'Accès Self-Access',
    accent: 'coral',
    items: [
      'Connectez-vous avec vos identifiants personnels.',
      'Ne partagez jamais vos informations de connexion.',
      'Déconnectez-vous après chaque session.',
    ],
  },
  {
    icon: Monitor,
    title: 'Utilisation des ordinateurs',
    accent: 'coral',
    items: [
      'Utilisez les ordinateurs uniquement pour apprendre l\'anglais.',
      'Aucune installation de logiciels non autorisés.',
      'Signalez tout dysfonctionnement au responsable.',
    ],
  },
  {
    icon: Clock,
    title: 'Temps de session',
    accent: 'coral',
    items: [
      'La durée maximale par session est de 90 minutes.',
      'Libérez le poste si d\'autres étudiants attendent.',
      'Les sessions ne sont pas réservables à l\'avance.',
    ],
  },
  {
    icon: Volume2,
    title: 'Comportement en salle',
    accent: 'coral',
    items: [
      'Maintenez un environnement calme et studieux.',
      'Utilisez des écouteurs pour les exercices audio.',
      'Évitez les conversations prolongées.',
    ],
  },
  {
    icon: Users,
    title: 'Respect mutuel',
    accent: 'coral',
    items: [
      'Respectez les autres apprenants et le personnel.',
      'Ne dérangez pas les personnes en cours d\'exercice.',
      'Aidez les nouveaux apprenants si possible.',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Sanctions',
    accent: 'red',
    items: [
      'Le non-respect des règles peut entraîner une suspension.',
      'Tout comportement inapproprié sera signalé.',
      'L\'accès peut être révoqué sans préavis.',
    ],
  },
]

export default function RulesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--coral-text)' }}>Règlement</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Règles du Self-Access
        </h1>
        <p className="text-lg mb-10" style={{ color: 'var(--text-secondary)' }}>
          Pour garantir un environnement d'apprentissage agréable et efficace pour tous, veuillez lire et respecter ces règles.
        </p>
      </motion.div>

      <div className="coral-divider mb-10" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rules.map((rule, i) => (
          <motion.div
            key={rule.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card-glow rounded-xl p-5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `var(--acc-${rule.accent}-soft)`, border: `1px solid var(--acc-${rule.accent}-line)` }}
              >
                <rule.icon size={18} style={{ color: `var(--acc-${rule.accent})` }} />
              </div>
              <h3 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>{rule.title}</h3>
            </div>
            <ul className="flex flex-col gap-2">
              {rule.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: `var(--acc-${rule.accent})` }} />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* Information sur le suivi de progression (données personnelles) */}
      <div className="mt-12 rounded-xl p-5"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-start gap-3">
          <Info size={18} aria-hidden="true" className="flex-shrink-0 mt-0.5" style={{ color: 'var(--coral-text)' }} />
          <div>
            <h2 className="font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Suivi de votre progression
            </h2>
            <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text-secondary)' }}>
              Pour vous permettre de reprendre où vous en étiez, teachMe enregistre la date à
              laquelle vous ouvrez une ressource et celles que vous marquez comme terminées.
              Aucun contenu de votre travail sur les sites externes n&apos;est collecté.
            </p>
            <ul className="text-sm leading-relaxed list-disc pl-5" style={{ color: 'var(--text-secondary)' }}>
              <li>Vous seul et les encadrants de votre site voyez votre progression.</li>
              <li>Les ressources seulement ouvertes et jamais terminées sont effacées après 12 mois.</li>
              <li>Vous pouvez décocher une ressource à tout moment pour retirer son marquage.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
