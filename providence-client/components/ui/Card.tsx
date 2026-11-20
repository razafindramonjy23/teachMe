'use client'

/**
 * Surfaces de base : tout ce qui est posé sur le fond de page passe par ici.
 *
 * `Surface` est la carte nue ; `SectionCard` ajoute l'en-tête titre / sous-titre
 * / action que l'on retrouve sur chaque bloc de l'accueil et des statistiques.
 * Les styles vivent dans globals.css (.surface) : une seule définition du
 * rayon, de la bordure et de l'ombre pour toute l'application.
 *
 * `Surface` est polymorphe : `as={Link}` en fait un lien, avec les props du
 * composant cible vérifiées par TypeScript.
 */

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'
import clsx from 'clsx'

type SurfaceOwnProps = {
  children: ReactNode
  className?: string
  /** Soulèvement au survol — à réserver aux surfaces réellement cliquables. */
  interactive?: boolean
}

type SurfaceProps<T extends ElementType> = SurfaceOwnProps & {
  as?: T
} & Omit<ComponentPropsWithoutRef<T>, keyof SurfaceOwnProps | 'as'>

export function Surface<T extends ElementType = 'div'>({
  children,
  className,
  interactive = false,
  as,
  ...rest
}: SurfaceProps<T>) {
  const Tag = (as ?? 'div') as ElementType
  return (
    <Tag className={clsx('surface', interactive && 'surface-interactive', className)} {...rest}>
      {children}
    </Tag>
  )
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string
  subtitle?: string
  /** Contrôle aligné à droite du titre : onglets, bascule, lien « voir tout ». */
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <Surface className={clsx('p-5', className)}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h2 className="font-semibold text-base leading-tight" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      <div className={bodyClassName}>{children}</div>
    </Surface>
  )
}
