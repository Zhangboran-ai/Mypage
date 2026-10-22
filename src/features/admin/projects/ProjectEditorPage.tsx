import { Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Save, Send } from 'lucide-react'
import { useSeo } from '@/hooks/use-seo'
import { toClientSlug } from '@/lib/slug'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { ProjectEditorFields } from './ProjectEditorFields'
import { ProjectEditorSidebar } from './ProjectEditorSidebar'
import { useProjectEditor } from './use-project-editor'

export function ProjectEditorPage() {
  const {
    isEditing,
    form,
    errors,
    isDirty,
    update,
    handleSave,
    isSaving,
    blocker,
    project,
    isLoading,
    isError,
    refetch,
    techSuggestions,
  } = useProjectEditor()

  useSeo({ title: isEditing ? '编辑项目' : '新增项目', noindex: true })

  if (isEditing && isLoading) {
    return (
      <>
        <AdminPageHeader title="编辑项目" />
        <Skeleton className="h-[36rem] w-full" />
      </>
    )
  }

  if (isEditing && isError) {
    return (
      <>
        <AdminPageHeader title="编辑项目" />
        <ErrorState message="项目加载失败。" onRetry={() => void refetch()} />
      </>
    )
  }

  return (
    <>
      <AdminPageHeader
        title={isEditing ? '编辑项目' : '新增项目'}
        description={isDirty ? '有未保存的修改' : '所有修改已保存'}
        actions={
          <>
            <Link
              to="/admin/projects"
              className="inline-flex h-9 items-center gap-1.5 rounded-btn border border-border-subtle px-3 text-sm text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              返回
            </Link>
            {isEditing && project?.status === 'PUBLISHED' ? (
              <Link
                to={`/projects/${project.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-btn border border-border-subtle px-3 text-sm text-text-secondary hover:text-text-primary"
              >
                <ExternalLink className="size-3.5" aria-hidden="true" />
                查看前台
              </Link>
            ) : null}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSave('DRAFT')}
              loading={isSaving}
            >
              <Save className="size-3.5" aria-hidden="true" />
              保存草稿
            </Button>
            <Button size="sm" onClick={() => handleSave('PUBLISHED')} loading={isSaving}>
              <Send className="size-3.5" aria-hidden="true" />
              发布
            </Button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="glass-card p-5 sm:p-6">
          <ProjectEditorFields
            form={form}
            errors={errors}
            techSuggestions={techSuggestions}
            onChange={update}
            onGenerateSlug={() => update('slug', toClientSlug(form.title))}
          />
        </div>

        <ProjectEditorSidebar form={form} errors={errors} onChange={update} />
      </div>

      <Dialog
        open={blocker.state === 'blocked'}
        title="离开编辑器？"
        onClose={() => blocker.reset?.()}
      >
        <p className="text-sm text-text-secondary">
          当前修改还没有保存，离开后这些修改会丢失。
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => blocker.reset?.()}>
            继续编辑
          </Button>
          <Button variant="danger" size="sm" onClick={() => blocker.proceed?.()}>
            放弃修改
          </Button>
        </div>
      </Dialog>
    </>
  )
}
