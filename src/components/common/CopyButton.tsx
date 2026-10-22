import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/Button'

type CopyButtonProps = {
  value: string
  label?: string
  copiedLabel?: string
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
}

export function CopyButton({
  value,
  label = '复制',
  copiedLabel = '已复制',
  variant = 'secondary',
  size = 'sm',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      const input = document.createElement('textarea')
      input.value = value
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      input.remove()
    }

    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <Button variant={variant} size={size} onClick={handleCopy} aria-live="polite">
      {copied ? (
        <Check className="size-3.5" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" aria-hidden="true" />
      )}
      {copied ? copiedLabel : label}
    </Button>
  )
}
