import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useSiteSettings } from '@/features/public/use-public-data'
import { cn } from '@/lib/cn'

const navigation = [
  { to: '/', label: '首页', key: 'home' },
  { to: '/about', label: '关于', key: 'about' },
  { to: '/projects', label: '项目', key: 'projects' },
  { to: '/blog', label: '博客', key: 'blog' },
  { to: '/contact', label: '联系', key: 'contact' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { data: settings } = useSiteSettings()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open])

  const navConfig = settings?.navConfig ?? {}
  const visibleNav = navigation.filter((item) => {
    if (item.key === 'home') return true
    return navConfig[item.key] !== false
  })
  const siteName = settings?.siteName ?? '星屿 Astra'

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-colors duration-200',
        scrolled
          ? 'border-b border-border-subtle bg-bg-base/80 backdrop-blur-xl'
          : 'border-b border-transparent',
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-wide text-text-primary"
        >
          <span className="flex size-8 items-center justify-center rounded-lg border border-accent/30 bg-accent-soft text-accent-strong">
            ✦
          </span>
          <span className="max-w-[10rem] truncate sm:max-w-none">{siteName}</span>
        </Link>

        <nav aria-label="主导航" className="hidden items-center gap-1 sm:flex">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'rounded-btn px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent-soft text-accent-strong'
                    : 'text-text-secondary hover:bg-white/[0.05] hover:text-text-primary',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-btn border border-border-subtle text-text-secondary sm:hidden"
          aria-label={open ? '关闭菜单' : '打开菜单'}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          aria-label="移动端导航"
          className="border-t border-border-subtle bg-bg-base/95 sm:hidden"
        >
          <div className="container-page flex flex-col py-2">
            {visibleNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-btn px-3 py-3 text-sm',
                    isActive ? 'bg-accent-soft text-accent-strong' : 'text-text-secondary',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  )
}
