import { Github, Linkedin, Mail, Rss, Twitter, Link2 } from 'lucide-react'
import type { ComponentType } from 'react'

type IconProps = { className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }

export function socialIcon(platform: string): ComponentType<IconProps> {
  const key = platform.toLowerCase()

  if (key.includes('github')) return Github
  if (key.includes('twitter') || key === 'x' || key.includes(' x')) return Twitter
  if (key.includes('linkedin')) return Linkedin
  if (key.includes('mail') || key.includes('email')) return Mail
  if (key.includes('rss')) return Rss

  return Link2
}
