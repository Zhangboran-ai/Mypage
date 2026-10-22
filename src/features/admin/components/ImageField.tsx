import { useId, useRef, useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { uploadImage } from '@/lib/upload'

type ImageFieldProps = {
  value: string
  onChange: (url: string) => void
  label?: string
  hint?: string
  maxEdge?: number
  inputId?: string
}

export function ImageField({
  value,
  onChange,
  label = '图片地址',
  hint = '上传前会自动压缩为 WebP。',
  maxEdge,
  inputId,
}: ImageFieldProps) {
  const push = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const autoId = useId()
  const fieldId = inputId ?? autoId
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)

    try {
      const media = await uploadImage(file, { maxEdge })
      onChange(media.url)
      push('图片上传成功')
    } catch (error) {
      push(error instanceof Error ? error.message : '上传失败，请重试', 'error')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-text-secondary">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id={fieldId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://..."
          className="min-w-0 flex-1"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-10"
          loading={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="size-3.5" aria-hidden="true" />
          )}
          上传
        </Button>
      </div>
      {hint ? <p className="mt-1 text-xs text-text-muted">{hint}</p> : null}

      {value ? (
        <div className="mt-2 flex items-center gap-3">
          <img
            src={value}
            alt="图片预览"
            className="h-16 w-24 rounded-btn border border-border-subtle object-cover"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-text-muted hover:text-danger"
          >
            移除
          </button>
        </div>
      ) : null}
    </div>
  )
}
