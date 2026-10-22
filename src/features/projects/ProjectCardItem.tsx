import { Link } from 'react-router-dom'
import { ExternalLink, Star } from 'lucide-react'
import type { ProjectCard } from '@shared'
import { Badge } from '@/components/ui/Badge'
import { formatMonth } from '@/lib/format'

export function ProjectCardItem({ project }: { project: ProjectCard }) {
  return (
    <article className="group glass-card flex h-full flex-col overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:border-border-strong">
      <Link to={`/projects/${project.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-bg-elevated">
          {project.coverUrl ? (
            <img
              src={project.coverUrl}
              alt={`${project.title} 封面`}
              loading="lazy"
              width={640}
              height={400}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-accent/15 via-transparent to-star-warm/10 text-3xl font-semibold text-accent-strong">
              {project.title.slice(0, 1)}
            </div>
          )}
          {project.featured ? (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full border border-accent/30 bg-bg-base/80 px-2.5 py-0.5 text-xs text-accent-strong backdrop-blur">
              <Star className="size-3" aria-hidden="true" />
              精选
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-text-primary">
            <Link to={`/projects/${project.slug}`} className="hover:text-accent-strong">
              {project.title}
            </Link>
          </h3>
          {project.demoUrl || project.repoUrl ? (
            <a
              href={project.demoUrl ?? project.repoUrl ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`打开 ${project.title} 链接`}
              className="shrink-0 text-text-muted transition-colors hover:text-accent-strong"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          ) : null}
        </div>

        <p className="mt-2 line-clamp-2 flex-1 text-sm text-text-secondary">{project.summary}</p>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {project.techTags.slice(0, 4).map((tech) => (
            <Badge key={tech.id} tone="muted">
              {tech.name}
            </Badge>
          ))}
          {project.techTags.length > 4 ? (
            <span className="text-xs text-text-muted">+{project.techTags.length - 4}</span>
          ) : null}
        </div>

        <p className="mt-3 text-xs text-text-muted">
          {project.role ? `${project.role} · ` : ''}
          {formatMonth(project.startDate)} — {formatMonth(project.endDate)}
        </p>
      </div>
    </article>
  )
}
