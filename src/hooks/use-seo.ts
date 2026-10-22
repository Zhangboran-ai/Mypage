import { useEffect } from 'react'
import { SITE_NAME_FALLBACK } from '@shared/constants'

type SeoInput = {
  title?: string
  siteName?: string
  description?: string
  image?: string | null
  type?: 'website' | 'article'
  jsonLd?: Record<string, unknown> | null
  noindex?: boolean
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string): void {
  if (!content) return
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function removeMeta(attribute: 'name' | 'property', key: string): void {
  document.head.querySelector(`meta[${attribute}="${key}"]`)?.remove()
}

function upsertLink(rel: string, href: string): void {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }

  element.setAttribute('href', href)
}

export function useSeo({
  title,
  siteName,
  description,
  image,
  type = 'website',
  jsonLd,
  noindex,
}: SeoInput) {
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : ''

  useEffect(() => {
    const name = siteName ?? SITE_NAME_FALLBACK
    const fullTitle = !title || title === name ? name : `${title} · ${name}`
    document.title = fullTitle

    if (description) upsertMeta('name', 'description', description)
    else removeMeta('name', 'description')

    upsertMeta('property', 'og:title', fullTitle)
    if (description) upsertMeta('property', 'og:description', description)
    else removeMeta('property', 'og:description')

    upsertMeta('property', 'og:type', type)
    upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')

    if (image) {
      upsertMeta('property', 'og:image', image)
      upsertMeta('name', 'twitter:image', image)
    } else {
      removeMeta('property', 'og:image')
      removeMeta('name', 'twitter:image')
    }

    const canonical = `${window.location.origin}${window.location.pathname}`
    upsertLink('canonical', canonical)
    upsertMeta('property', 'og:url', canonical)

    if (noindex) {
      upsertMeta('name', 'robots', 'noindex,nofollow')
    } else {
      removeMeta('name', 'robots')
    }

    const existing = document.getElementById('seo-jsonld')
    existing?.remove()

    if (jsonLdString) {
      const script = document.createElement('script')
      script.id = 'seo-jsonld'
      script.type = 'application/ld+json'
      script.textContent = jsonLdString
      document.head.appendChild(script)
    }

    return () => {
      document.getElementById('seo-jsonld')?.remove()
    }
  }, [title, siteName, description, image, type, noindex, jsonLdString])
}
