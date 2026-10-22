import {
  CONTENT_STATUSES,
  CONTENT_STATUS_LABELS,
  type ContentStatus,
} from '@shared'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ImageField } from '../components/ImageField'
import type { ProjectFormState } from './ProjectEditorFields'

type ProjectEditorSidebarProps = {
  form: ProjectFormState
  errors: Record<string, string>
  onChange: <Key extends keyof ProjectFormState>(key: Key, value: ProjectFormState[Key]) => void
}

export function ProjectEditorSidebar({ form, errors, onChange }: ProjectEditorSidebarProps) {
  return (
    <aside className="space-y-4">
      <section className="glass-card space-y-3 p-5">
        <h2 className="text-sm font-semibold text-text-primary">发布</h2>
        <Field label="状态" htmlFor="project-status">
          <Select
            id="project-status"
            value={form.status}
            onChange={(event) => onChange('status', event.target.value as ContentStatus)}
          >
            {CONTENT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {CONTENT_STATUS_LABELS[item]}
              </option>
            ))}
          </Select>
        </Field>

        {form.status === 'SCHEDULED' ? (
          <Field
            label="发布时间"
            htmlFor="project-published-at"
            required
            error={errors.publishedAt}
          >
            <Input
              id="project-published-at"
              type="datetime-local"
              value={form.publishedAt}
              onChange={(event) => onChange('publishedAt', event.target.value)}
            />
          </Field>
        ) : null}

        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(event) => onChange('featured', event.target.checked)}
            className="size-4 accent-[var(--accent)]"
          />
          在首页精选展示
        </label>
      </section>

      <section className="glass-card space-y-4 p-5">
        <ImageField
          inputId="project-cover"
          label="封面图"
          value={form.coverUrl}
          onChange={(url) => onChange('coverUrl', url)}
        />
        <Field label="GitHub 地址" htmlFor="project-repo" error={errors.repoUrl}>
          <Input
            id="project-repo"
            value={form.repoUrl}
            onChange={(event) => onChange('repoUrl', event.target.value)}
            placeholder="https://github.com/..."
          />
        </Field>
        <Field label="在线地址" htmlFor="project-demo" error={errors.demoUrl}>
          <Input
            id="project-demo"
            value={form.demoUrl}
            onChange={(event) => onChange('demoUrl', event.target.value)}
            placeholder="https://..."
          />
        </Field>
        <Field label="担任角色" htmlFor="project-role">
          <Input
            id="project-role"
            value={form.role}
            onChange={(event) => onChange('role', event.target.value)}
            placeholder="例如：独立开发"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="开始时间" htmlFor="project-start">
            <Input
              id="project-start"
              type="date"
              value={form.startDate}
              onChange={(event) => onChange('startDate', event.target.value)}
            />
          </Field>
          <Field label="结束时间" htmlFor="project-end" hint="留空表示进行中。">
            <Input
              id="project-end"
              type="date"
              value={form.endDate}
              onChange={(event) => onChange('endDate', event.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="glass-card space-y-3 p-5">
        <h2 className="text-sm font-semibold text-text-primary">SEO</h2>
        <Field label="SEO 标题" htmlFor="project-seo-title">
          <Input
            id="project-seo-title"
            value={form.seoTitle}
            onChange={(event) => onChange('seoTitle', event.target.value)}
          />
        </Field>
        <Field label="SEO 描述" htmlFor="project-seo-description">
          <Input
            id="project-seo-description"
            value={form.seoDescription}
            onChange={(event) => onChange('seoDescription', event.target.value)}
          />
        </Field>
      </section>
    </aside>
  )
}
