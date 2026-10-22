import type { SkillCategory } from '@shared'
import { cn } from '@/lib/cn'

type SkillGroupsProps = {
  categories: SkillCategory[]
  compact?: boolean
}

export function SkillGroups({ categories, compact = false }: SkillGroupsProps) {
  if (categories.length === 0) {
    return <p className="text-sm text-text-muted">还没有添加技能。</p>
  }

  return (
    <div className={cn('grid gap-6', compact ? 'sm:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2')}>
      {categories.map((category) => (
        <div key={category.id} className="glass-card p-5">
          <h3 className="text-sm font-semibold tracking-wide text-text-primary">{category.name}</h3>
          <ul className="mt-3 space-y-3">
            {category.skills.map((skill) => (
              <li key={skill.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">
                    {skill.icon ? <span className="mr-1.5">{skill.icon}</span> : null}
                    {skill.name}
                  </span>
                  <span className="text-xs text-text-muted">
                    {skill.levelLabel ?? `${skill.level}%`}
                  </span>
                </div>
                {!compact ? (
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-accent/80"
                      style={{ width: `${Math.min(100, Math.max(0, skill.level))}%` }}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
