import { Link } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import { usePublicProfile, useSiteSettings } from '@/features/public/use-public-data'
import { formatYear } from '@/lib/format'
import { SocialLinks } from '@/components/common/SocialLinks'

export function Footer() {
  const { data: settings } = useSiteSettings()
  const { data: profile } = usePublicProfile()

  const year = formatYear(new Date())
  const siteName = settings?.siteName ?? '星屿 Astra'

  return (
    <footer className="relative z-10 mt-24 border-t border-border-subtle bg-bg-elevated/40">
      <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary">{siteName}</p>
          <p className="mt-1 text-xs text-text-muted">
            © {year} {settings?.footerText ?? '保留所有权利'}
            {settings?.icpRecord ? ` · ${settings.icpRecord}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <SocialLinks links={profile?.socialLinks ?? []} />

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-1.5 rounded-btn border border-border-subtle px-3 py-2 text-xs text-text-secondary transition-colors hover:text-text-primary"
          >
            <ArrowUp className="size-3.5" aria-hidden="true" />
            返回顶部
          </button>

          <Link
            to="/admin"
            className="text-xs text-text-muted/70 transition-colors hover:text-text-secondary"
          >
            后台
          </Link>
        </div>
      </div>
    </footer>
  )
}
