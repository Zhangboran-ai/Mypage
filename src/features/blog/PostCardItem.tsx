import { Link } from 'react-router-dom'
import { Clock, Pin } from 'lucide-react'
import type { PostListItem } from '@shared'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/format'

export function PostCardItem({ post }: { post: PostListItem }) {
  return (
    <article className="group flex flex-col gap-3 rounded-card border border-border-subtle bg-white/[0.02] p-5 transition-colors hover:border-border-strong hover:bg-white/[0.04]">
      <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
        <time dateTime={post.publishedAt ?? post.updatedAt}>{formatDate(post.publishedAt)}</time>
        <span aria-hidden="true">·</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3" aria-hidden="true" />
          {post.readingTime} 分钟
        </span>
        {post.pinned ? (
          <span className="inline-flex items-center gap-1 text-accent-strong">
            <Pin className="size-3" aria-hidden="true" />
            置顶
          </span>
        ) : null}
      </div>

      <h3 className="text-lg font-semibold text-text-primary">
        <Link to={`/blog/${post.slug}`} className="transition-colors hover:text-accent-strong">
          {post.title}
        </Link>
      </h3>

      <p className="line-clamp-2 text-sm text-text-secondary">{post.summary}</p>

      {post.tags.length > 0 ? (
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {post.tags.map((tag) => (
            <Link key={tag.id} to={`/blog?tag=${tag.slug}`}>
              <Badge tone="accent">#{tag.name}</Badge>
            </Link>
          ))}
        </div>
      ) : null}
    </article>
  )
}
