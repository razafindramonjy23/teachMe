'use client'

/**
 * teachMe — éléments de marque.
 * Charte : navy #1B2A4A · corail #E8735A · terracotta #C2553E · crème #F7F5F0
 *
 * <LogoMark />      la bulle + le livre (icône seule)
 * <Wordmark />      "teachMe" typographique
 * <Logo />          icône + nom (+ baseline optionnelle)
 */

export type BrandTone = 'auto' | 'light' | 'dark'

type MarkProps = {
  /** 'light' = fond clair (bulle navy) · 'dark' = fond sombre (bulle crème) · 'auto' = suit le thème */
  tone?: BrandTone
  size?: number
  className?: string
}

function MarkSolid({ size, className }: { size: number; className?: string }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <path
        d="M15 6h90a11 11 0 0 1 11 11v64a11 11 0 0 1-11 11H52L26 114V92h-11A11 11 0 0 1 4 81V17A11 11 0 0 1 15 6Z"
        fill="#1b2a4a"
      />
      <path d="M17 31c10-6 28-6 40 0v44c-12-6-30-6-40 0V31Z" fill="#f7f5f0" />
      <path d="M103 31c-10-6-28-6-40 0v44c12-6 30-6 40 0V31Z" fill="#e8735a" />
      <rect x="24" y="40" width="26" height="5" rx="2.5" fill="#1b2a4a" />
      <rect x="24" y="50" width="26" height="5" rx="2.5" fill="#1b2a4a" />
      <rect x="24" y="60" width="18" height="5" rx="2.5" fill="#1b2a4a" />
    </svg>
  )
}

function MarkInverse({ size, className }: { size: number; className?: string }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <path
        d="M15 6h90a11 11 0 0 1 11 11v64a11 11 0 0 1-11 11H52L26 114V92h-11A11 11 0 0 1 4 81V17A11 11 0 0 1 15 6Z"
        fill="none"
        stroke="#f7f5f0"
        strokeWidth={9}
        strokeLinejoin="round"
      />
      <path d="M17 31c10-6 28-6 40 0v44c-12-6-30-6-40 0V31Z" fill="#f7f5f0" />
      <path d="M103 31c-10-6-28-6-40 0v44c12-6 30-6 40 0V31Z" fill="#e8735a" />
      <rect x="24" y="40" width="26" height="5" rx="2.5" fill="#1b2a4a" />
      <rect x="24" y="50" width="26" height="5" rx="2.5" fill="#1b2a4a" />
      <rect x="24" y="60" width="18" height="5" rx="2.5" fill="#1b2a4a" />
    </svg>
  )
}

export function LogoMark({ tone = 'auto', size = 36, className = '' }: MarkProps) {
  if (tone === 'light') return <MarkSolid size={size} className={className} />
  if (tone === 'dark') return <MarkInverse size={size} className={className} />
  // auto : bulle navy en thème clair, bulle crème en thème sombre
  return (
    <span className={`inline-flex ${className}`} style={{ lineHeight: 0 }}>
      <MarkSolid size={size} className="block dark:hidden" />
      <MarkInverse size={size} className="hidden dark:block" />
    </span>
  )
}

export function Wordmark({
  tone = 'auto',
  className = '',
}: {
  tone?: BrandTone
  className?: string
}) {
  return (
    <span className={`brand-wordmark ${tone === 'dark' ? 'on-dark' : ''} ${className}`}>
      teach<span className="brand-accent">Me</span>
    </span>
  )
}

export function Logo({
  tone = 'auto',
  size = 36,
  tagline = false,
  className = '',
  wordmarkClassName = 'text-xl',
}: {
  tone?: BrandTone
  size?: number
  tagline?: boolean
  className?: string
  wordmarkClassName?: string
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark tone={tone} size={size} className="flex-shrink-0" />
      <span className="flex flex-col leading-none">
        <Wordmark tone={tone} className={wordmarkClassName} />
        {tagline && (
          <span className={`brand-tagline mt-1 text-[10px] ${tone === 'dark' ? 'text-cream/60' : ''}`}>
            Learn English Online
          </span>
        )}
      </span>
    </span>
  )
}

export const BRAND = {
  name: 'teachMe',
  tagline: 'Learn English Online',
  colors: {
    navy: '#1b2a4a',
    coral: '#e8735a',
    terracotta: '#c2553e',
    cream: '#f7f5f0',
    slate: '#4a5468',
  },
} as const
