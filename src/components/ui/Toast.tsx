import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/lib/cn'

type ToastVariant = 'success' | 'error' | 'info'
type ToastItem = { id: number; message: string; variant: ToastVariant }

type ToastContextValue = { push: (message: string, variant?: ToastVariant) => void }

const ToastContext = createContext<ToastContextValue | null>(null)

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const tones: Record<ToastVariant, string> = {
  success: 'border-success/30 text-success',
  error: 'border-danger/40 text-danger',
  info: 'border-accent/30 text-accent-strong',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<number[]>([])

  useEffect(() => {
    const list = timers.current
    return () => {
      for (const timer of list) window.clearTimeout(timer)
    }
  }, [])

  const push = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, variant }])

    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 3200)

    timers.current.push(timer)
  }, [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2"
      >
        {toasts.map((toast) => {
          const Icon = icons[toast.variant]
          return (
            <div
              key={toast.id}
              className={cn(
                'animate-fade-up pointer-events-auto flex items-center gap-2 rounded-btn border bg-bg-elevated/95 px-4 py-2.5 text-sm shadow-glow backdrop-blur',
                tones[toast.variant],
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="text-text-primary">{toast.message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue['push'] {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast 必须在 ToastProvider 内使用')
  return context.push
}
