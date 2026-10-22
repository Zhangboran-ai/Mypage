import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react'
import type { ProjectCard } from '@shared'
import { formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ConfirmDialog } from '../components/ConfirmDialog'

type ProjectTableProps = {
  projects: ProjectCard[]
  canReorder: boolean
  onMove: (index: number, direction: -1 | 1) => void
  onDelete: (id: string) => Promise<void>
}

export function ProjectTable({ projects, canReorder, onMove, onDelete }: ProjectTableProps) {
  return (
    <div className="overflow-x-auto rounded-card border border-border-subtle">
      <table className="w-full min-w-[52rem] text-sm">
        <thead className="bg-white/[0.03] text-left text-xs text-text-muted">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">项目</th>
            <th scope="col" className="px-4 py-3 font-medium">技术栈</th>
            <th scope="col" className="px-4 py-3 font-medium">状态</th>
            <th scope="col" className="px-4 py-3 font-medium">更新时间</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {projects.map((project, index) => (
            <tr key={project.id}>
              <td className="max-w-xs px-4 py-3">
                <div className="flex items-center gap-2">
                  {project.coverUrl ? (
                    <img
                      src={project.coverUrl}
                      alt=""
                      width={48}
                      height={32}
                      loading="lazy"
                      className="h-8 w-12 shrink-0 rounded object-cover"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <Link
                      to={`/admin/projects/${project.id}/edit`}
                      className="block truncate text-text-primary hover:text-accent-strong"
                    >
                      {project.title}
                    </Link>
                    <p className="truncate text-xs text-text-muted">/{project.slug}</p>
                  </div>
                  {project.featured ? <Badge tone="accent">精选</Badge> : null}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {project.techTags.slice(0, 3).map((tech) => (
                    <Badge key={tech.id} tone="muted">
                      {tech.name}
                    </Badge>
                  ))}
                  {project.techTags.length > 3 ? (
                    <span className="text-xs text-text-muted">
                      +{project.techTags.length - 3}
                    </span>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={project.status} />
              </td>
              <td className="px-4 py-3 text-xs whitespace-nowrap text-text-muted">
                {formatDateTime(project.updatedAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  {canReorder ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={index === 0}
                        onClick={() => onMove(index, -1)}
                        aria-label={`上移 ${project.title}`}
                      >
                        <ArrowUp className="size-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={index === projects.length - 1}
                        onClick={() => onMove(index, 1)}
                        aria-label={`下移 ${project.title}`}
                      >
                        <ArrowDown className="size-3.5" aria-hidden="true" />
                      </Button>
                    </>
                  ) : null}
                  <Link
                    to={`/admin/projects/${project.id}/edit`}
                    aria-label={`编辑 ${project.title}`}
                    className="inline-flex size-9 items-center justify-center rounded-btn text-text-secondary transition-colors hover:bg-white/[0.06] hover:text-text-primary"
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                  </Link>
                  <ConfirmDialog
                    title="删除项目"
                    description={`确定删除「${project.title}」吗？删除后前台不再展示。`}
                    trigger={
                      <Button variant="ghost" size="sm" aria-label={`删除 ${project.title}`}>
                        <Trash2 className="size-3.5 text-danger" aria-hidden="true" />
                      </Button>
                    }
                    onConfirm={() => onDelete(project.id)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
