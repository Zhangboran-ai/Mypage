import type { SocialLink } from '@shared'
import { socialIcon } from './social-icon'

export function SocialLinks({ links }: { links: SocialLink[] }) {
  if (links.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-3">
      {links.map((link) => {
        const Icon = socialIcon(link.platform)
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            title={link.label}
            className="flex size-10 items-center justify-center rounded-full border border-border-subtle bg-white/[0.03] text-text-secondary transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:text-accent-strong"
          >
            <Icon className="size-4" aria-hidden="true" />
          </a>
        )
      })}
    </div>
  )
}
