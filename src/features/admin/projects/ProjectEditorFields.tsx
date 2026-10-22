import { useState } from 'react'
import { Plus, Trash2, Wand2 } from 'lucide-react'
import type { ContentStatus } from '@shared'
import { Markdown } from '@/lib/markdown'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { ImageField } from '../components/ImageField'

export type ProjectImageDraft = { url: string; alt: string }

export type ProjectFormState = {
  title: string
  slug: string
  summary: string
  content: string
  coverUrl: string
  repoUrl: string
  demoUrl: string
  role: string
  startDate: string
  endDate: string
  featured: boolean
  status: ContentStatus
  publishedAt: string
  seoTitle: string
  seoDescription: string
  techTagsText: string
  images: ProjectImageDraft[]
}

type ProjectEditorFieldsProps = {
  form: ProjectFormState
  errors: Record<string, string>
  techSuggestions: string[]
  onChange: <Key extends keyof ProjectFormState>(key: Key, value: ProjectFormState[Key]) => void
  onGenerateSlug: () => void
}

export function ProjectEditorFields({
  form,
  errors,
  techSuggestions,
  onChange,
  onGenerateSlug,
}: ProjectEditorFieldsProps) {
  const [preview, setPreview] = useState(false)

  const updateImage = (index: number, patch: Partial<ProjectImageDraft>) => {
    onChange(
      'images',
      form.images.map((image, current) =>
        current === index ? { ...image, ...patch } : image,
      ),
    )
  }

  const removeImage = (index: number) => {
    onChange(
      'images',
      form.images.filter((_, current) => current !== index),
    )
  }

  const addImage = () => {
    onChange('images', [...form.images, { url: '', alt: '' }])
  }

  return (
    <div className="space-y-4">
      <Field label="标题" htmlFor="project-title" required error={errors.title}>
        <Input
          id="project-title"
          value={form.title}
          onChange={(event) => onChange('title', event.target.value)}
          className="h-12 text-base"
          placeholder="项目名称"
        />
      </Field>

      <Field
        label="slug"
        htmlFor="project-slug"
        error={errors.slug}
        hint="留空由服务端按标题生成；修改后旧链接会失效。"
      >
        <div className="flex items-center gap-2">
          <Input
            id="project-slug"
            value={form.slug}
            onChange={(event) => onChange('slug', event.target.value)}
            placeholder="my-project"
            className="font-mono text-[13px]"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-10"
            onClick={onGenerateSlug}
          >
            <Wand2 className="size-3.5" aria-hidden="true" />
            生成
          </Button>
        </div>
      </Field>

      <Field
        label="一句话简介"
        htmlFor="project-summary"
        required
        error={errors.summary}
        hint="显示在项目卡片中，最多 300 字。"
      >
        <Textarea
          id="project-summary"
          rows={2}
          value={form.summary}
          onChange={(event) => onChange('summary', event.target.value)}
        />
      </Field>

      <Field
        label="技术栈"
        htmlFor="project-tech"
        hint="用逗号或顿号分隔，例如：React, TypeScript, Postgres。"
      >
        <Input
          id="project-tech"
          value={form.techTagsText}
          onChange={(event) => onChange('techTagsText', event.target.value)}
          list="project-tech-suggestions"
        />
        <datalist id="project-tech-suggestions">
          {techSuggestions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </Field>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="project-content" className="text-sm font-medium text-text-secondary">
            详细介绍（Markdown）
          </label>
          <button
            type="button"
            onClick={() => setPreview((value) => !value)}
            aria-pressed={preview}
            className="rounded-btn px-2.5 py-1 text-xs text-text-muted hover:text-text-primary"
          >
            {preview ? '继续编辑' : '预览'}
          </button>
        </div>

        {preview ? (
          <div className="min-h-64 rounded-btn border border-border-subtle bg-white/[0.02] p-4">
            {form.content.trim() ? (
              <Markdown content={form.content} />
            ) : (
              <p className="text-sm text-text-muted">暂无内容。</p>
            )}
          </div>
        ) : (
          <Textarea
            id="project-content"
            rows={16}
            value={form.content}
            onChange={(event) => onChange('content', event.target.value)}
            className="min-h-[20rem] font-mono text-[13px] leading-6"
            placeholder="## 项目背景&#10;&#10;解决了什么问题……"
          />
        )}
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-secondary">项目截图</h2>
          <Button type="button" variant="secondary" size="sm" onClick={addImage}>
            <Plus className="size-3.5" aria-hidden="true" />
            添加截图
          </Button>
        </div>

        {form.images.length === 0 ? (
          <p className="text-xs text-text-muted">最多 12 张，按添加顺序展示。</p>
        ) : (
          <ul className="space-y-3">
            {form.images.map((image, index) => (
              <li key={index} className="rounded-btn border border-border-subtle p-3">
                <ImageField
                  inputId={`project-image-${index}`}
                  label={`截图 ${index + 1}`}
                  value={image.url}
                  onChange={(url) => updateImage(index, { url })}
                />
                <div className="mt-2 flex items-end gap-2">
                  <Field
                    label="替代文本"
                    htmlFor={`project-image-alt-${index}`}
                    className="flex-1"
                  >
                    <Input
                      id={`project-image-alt-${index}`}
                      value={image.alt}
                      onChange={(event) => updateImage(index, { alt: event.target.value })}
                      placeholder="简要描述画面内容"
                    />
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeImage(index)}
                    aria-label={`删除截图 ${index + 1}`}
                    className="h-10"
                  >
                    <Trash2 className="size-3.5 text-danger" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
