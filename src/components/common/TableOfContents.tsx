import { useEffect, useState } from 'react'
import { List } from 'lucide-react'
import type { TocItem } from '@/lib/markdown'
import { cn } from '@/lib/cn'

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? '')

  useEffect(() => {
    if (items.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting)
        if (visibleEntry?.target.id) setActiveId(visibleEntry.target.id)
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: [0, 1] },
    )

    for (const item of items) {
      const element = document.getElementById(item.id)
      if (element) observer.observe(element)
    }

    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null

  const links = items.map((item) => (
    <a
      key={item.id}
      href={`#${item.id}`}
      className={cn(
        'block border-l border-border-subtle py-1.5 pl-3 text-sm transition-colors hover:text-text-primary',
        item.level === 3 && 'pl-6',
        activeId === item.id ? 'border-accent text-accent-strong' : 'text-text-muted',
      )}
    >
      {item.text}
    </a>
  ))

  return (
    <>
      <nav aria-label="文章目录" className="sticky top-24 hidden max-h-[70vh] overflow-y-auto lg:block">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-medium tracking-wide text-text-muted uppercase">
          <List className="size-3.5" aria-hidden="true" />
          目录
        </p>
        {links}
      </nav>

      <details className="glass-card mb-6 p-4 lg:hidden">
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-text-primary">
          <List className="size-4" aria-hidden="true" />
          文章目录
        </summary>
        <div className="mt-3">{links}</div>
      </details>
    </>
  )
}
