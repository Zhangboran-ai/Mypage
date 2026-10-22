import { useRef, useState } from 'react'
import {
  Bold,
  Code2,
  Heading2,
  Italic,
  Link2,
  List,
  Quote,
  Table,
  Wand2,
} from 'lucide-react'
import type { ContentStatus } from '@shared'
import { Markdown } from '@/lib/markdown'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

export type PostFormState = {
  title: string
  slug: string
  summary: string
  content: string
  coverUrl: string
  status: ContentStatus
  pinned: boolean
  seoTitle: string
  seoDescription: string
  ogImage: string
  publishedAt: string
  tagIds: string[]
}

type PostEditorFieldsProps = {
  form: PostFormState
  errors: Record<string, string>
  onChange: <Key extends keyof PostFormState>(key: Key, value: PostFormState[Key]) => void
  onGenerateSlug: () => void
}

type Tool = { label: string; icon: typeof Bold; before: string; after: string; block?: boolean }

const tools: Tool[] = [
  { label: '二级标题', icon: Heading2, before: '\n## ', after: '\n' },
  { label: '加粗', icon: Bold, before: '**', after: '**' },
  { label: '斜体', icon: Italic, before: '*', after: '*' },
  { label: '链接', icon: Link2, before: '[', after: '](https://)' },
  { label: '行内代码', icon: Code2, before: '`', after: '`' },
  { label: '引用', icon: Quote, before: '\n> ', after: '\n' },
  { label: '列表', icon: List, before: '\n- ', after: '\n' },
  { label: '表格', icon: Table, before: '\n| 列 1 | 列 2 |\n| --- | --- |\n| ', after: ' |  |\n' },
]

export function PostEditorFields({ form, errors, onChange, onGenerateSlug }: PostEditorFieldsProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insert = (tool: Tool) => {
    const textarea = textareaRef.current
    const content = form.content

    if (!textarea) {
      onChange('content', content + tool.before + tool.after)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    if (start === end) {
      const next = content.slice(0, start) + tool.before + tool.after + content.slice(start)
      onChange('content', next)
      requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(start + tool.before.length, start + tool.before.length)
      })
      return
    }

    const selected = content.slice(start, end)
    const next = content.slice(0, start) + tool.before + selected + tool.after + content.slice(end)
    onChange('content', next)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + tool.before.length,
        start + tool.before.length + selected.length,
      )
    })
  }

  return (
    <div className="space-y-4">
      <Field label="标题" htmlFor="post-title" required error={errors.title}>
        <Input
          id="post-title"
          value={form.title}
          onChange={(event) => onChange('title', event.target.value)}
          placeholder="文章标题"
          className="h-12 text-base"
        />
      </Field>

      <Field
        label="slug"
        htmlFor="post-slug"
        error={errors.slug}
        hint="留空会根据标题自动生成；修改后旧链接会失效。"
      >
        <div className="flex items-center gap-2">
          <Input
            id="post-slug"
            value={form.slug}
            onChange={(event) => onChange('slug', event.target.value)}
            placeholder="my-post"
            className="font-mono text-[13px]"
          />
          <Button type="button" variant="secondary" size="sm" className="h-10" onClick={onGenerateSlug}>
            <Wand2 className="size-3.5" aria-hidden="true" />
            生成
          </Button>
        </div>
      </Field>

      <Field
        label="摘要"
        htmlFor="post-summary"
        required
        error={errors.summary}
        hint="显示在列表与搜索摘要中，最多 300 字。"
      >
        <Textarea
          id="post-summary"
          rows={2}
          value={form.summary}
          onChange={(event) => onChange('summary', event.target.value)}
        />
      </Field>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="post-content" className="text-sm font-medium text-text-secondary">
            正文（Markdown）
          </label>
          <div className="flex items-center gap-1" role="group" aria-label="编辑器模式">
            <button
              type="button"
              onClick={() => setMode('edit')}
              aria-pressed={mode === 'edit'}
              className={cn(
                'rounded-btn px-2.5 py-1 text-xs',
                mode === 'edit' ? 'bg-accent-soft text-accent-strong' : 'text-text-muted',
              )}
            >
              编辑
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              aria-pressed={mode === 'preview'}
              className={cn(
                'rounded-btn px-2.5 py-1 text-xs',
                mode === 'preview' ? 'bg-accent-soft text-accent-strong' : 'text-text-muted',
              )}
            >
              预览
            </button>
          </div>
        </div>

        <div className="mb-2 flex flex-wrap items-center gap-1">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <button
                key={tool.label}
                type="button"
                onClick={() => insert(tool)}
                aria-label={tool.label}
                title={tool.label}
                className="flex size-8 items-center justify-center rounded-btn border border-border-subtle text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
              >
                <Icon className="size-3.5" aria-hidden="true" />
              </button>
            )
          })}
          <span className="ml-auto text-xs text-text-muted">{form.content.length} 字</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Textarea
            id="post-content"
            ref={textareaRef}
            rows={22}
            value={form.content}
            onChange={(event) => onChange('content', event.target.value)}
            className={cn('min-h-[32rem] font-mono text-[13px] leading-6', mode === 'preview' && 'hidden lg:block')}
            placeholder="# 开始写作"
            aria-invalid={Boolean(errors.content)}
          />
          <div
            className={cn(
              'min-h-[32rem] overflow-auto rounded-btn border border-border-subtle bg-white/[0.02] p-5',
              mode === 'edit' && 'hidden lg:block',
            )}
          >
            {form.content.trim() ? (
              <Markdown content={form.content} />
            ) : (
              <p className="text-sm text-text-muted">预览区：开始输入后这里会实时渲染。</p>
            )}
          </div>
        </div>
        {errors.content ? (
          <p role="alert" className="mt-1 text-xs text-danger">
            {errors.content}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="SEO 标题" htmlFor="post-seo-title">
          <Input
            id="post-seo-title"
            value={form.seoTitle}
            onChange={(event) => onChange('seoTitle', event.target.value)}
          />
        </Field>
        <Field label="SEO 描述" htmlFor="post-seo-description">
          <Input
            id="post-seo-description"
            value={form.seoDescription}
            onChange={(event) => onChange('seoDescription', event.target.value)}
          />
        </Field>
        <Field label="OG 图片地址" htmlFor="post-og-image">
          <Input
            id="post-og-image"
            value={form.ogImage}
            onChange={(event) => onChange('ogImage', event.target.value)}
            placeholder="留空使用封面"
          />
        </Field>
      </div>
    </div>
  )
}
