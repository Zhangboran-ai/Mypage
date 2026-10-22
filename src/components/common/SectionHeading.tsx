import type { ReactNode } from 'react'

type SectionHeadingProps = {
  title: string
  description?: string
  action?: ReactNode
  id?: string
}

export function SectionHeading({ title, description, action, id }: SectionHeadingProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id={id} className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
          {title}
        </h2>
        {description ? <p className="mt-2 text-sm text-text-secondary">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
