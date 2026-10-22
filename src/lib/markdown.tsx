import type { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

type HastNode = {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

const markdownSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), 'className'],
    span: [...(defaultSchema.attributes?.span ?? []), 'className'],
    pre: [...(defaultSchema.attributes?.pre ?? []), 'className'],
    h2: [...(defaultSchema.attributes?.h2 ?? []), 'id'],
    h3: [...(defaultSchema.attributes?.h3 ?? []), 'id'],
    h4: [...(defaultSchema.attributes?.h4 ?? []), 'id'],
    a: [...(defaultSchema.attributes?.a ?? []), 'target', 'rel'],
    img: [...(defaultSchema.attributes?.img ?? []), 'loading', 'decoding', 'width', 'height'],
  },
}

function textOf(node: HastNode): string {
  if (node.type === 'text') return node.value ?? ''
  return (node.children ?? []).map(textOf).join('')
}

function slugifyHeading(text: string): string {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return slug || 'section'
}

function uniqueId(base: string, used: Map<string, number>): string {
  const count = used.get(base) ?? 0
  used.set(base, count + 1)
  return count === 0 ? base : `${base}-${count + 1}`
}

function walkHeadings(node: HastNode, used: Map<string, number>): void {
  if (node.type === 'element' && node.tagName && /^h[2-4]$/.test(node.tagName)) {
    const id = uniqueId(slugifyHeading(textOf(node)), used)
    node.properties = { ...(node.properties ?? {}), id }
  }

  for (const child of node.children ?? []) walkHeadings(child, used)
}

function rehypeHeadingIds() {
  return (tree: unknown) => {
    walkHeadings(tree as HastNode, new Map())
  }
}

export type TocItem = { id: string; text: string; level: number }

export function extractToc(markdown: string): TocItem[] {
  const cleaned = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '')
    .replace(/`[^`]*`/g, '')

  const used = new Map<string, number>()
  const items: TocItem[] = []

  for (const line of cleaned.split('\n')) {
    const match = /^(#{2,4})\s+(.+?)\s*#*\s*$/.exec(line)
    if (!match) continue

    const level = match[1].length
    const text = match[2]
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[*_~`]/g, '')
      .trim()

    if (!text) continue

    const id = uniqueId(slugifyHeading(text), used)
    if (level <= 3) items.push({ id, text, level })
  }

  return items
}

type MarkdownProps = { content: string; className?: string }

function MarkdownAnchor({ href, children }: { href?: string; children?: ReactNode }) {
  const isExternal = Boolean(href && /^https?:\/\//.test(href))

  return (
    <a
      href={href}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  )
}

export function Markdown({ content, className = '' }: MarkdownProps) {
  return (
    <div className={`prose-astra ${className}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHeadingIds, [rehypeSanitize, markdownSchema], rehypeHighlight]}
        components={{
          a: ({ node, href, children }) => {
            void node
            return <MarkdownAnchor href={href}>{children}</MarkdownAnchor>
          },
          img: ({ node, alt, ...props }) => {
            void node
            return <img alt={alt ?? ''} loading="lazy" decoding="async" {...props} />
          },
          table: ({ node, children }) => {
            void node
            return (
              <div className="table-scroll">
                <table>{children}</table>
              </div>
            )
          },
          input: ({ node, ...props }) => {
            void node
            return <input {...props} disabled />
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
