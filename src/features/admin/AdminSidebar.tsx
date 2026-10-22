import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText,
  FolderKanban,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  ShieldCheck,
  Tags,
  UserRound,
  Wrench,
  X,
} from 'lucide-react'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { cn } from '@/lib/cn'
import { useMe } from './auth/use-auth'

const links = [
  { to: '/admin', label: '仪表盘', icon: LayoutDashboard, end: true },
  { to: '/admin/posts', label: '文章', icon: FileText },
  { to: '/admin/projects', label: '项目', icon: FolderKanban },
  { to: '/admin/profile', label: '个人信息', icon: UserRound },
  { to: '/admin/skills', label: '技能', icon: Wrench },
  { to: '/admin/tags', label: '标签', icon: Tags },
  { to: '/admin/media', label: '媒体库', icon: ImageIcon },
  { to: '/admin/messages', label: '留言', icon: MessageSquare },
  { to: '/admin/settings', label: '站点设置', icon: Settings },
  { to: '/admin/account', label: '账号', icon: ShieldCheck },
]

export function AdminSidebar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data } = useMe()
  const user = data?.user

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  const logout = useMutation({
    mutationFn: () => api.post<{ ok: boolean }>('/api/auth/logout'),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.admin.me, undefined)
      navigate('/admin/login', { replace: true })
    },
  })

  const nav = (
    <nav aria-label="后台导航" className="flex flex-col gap-0.5">
      {links.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-btn px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-accent-soft text-accent-strong'
                  : 'text-text-secondary hover:bg-white/[0.05] hover:text-text-primary',
              )
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )

  return (
    <>
      <div className="flex h-14 items-center justify-between border-b border-border-subtle px-4 lg:hidden">
        <Link to="/admin" className="text-sm font-semibold text-text-primary">
          后台管理
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="打开后台菜单"
          className="flex size-9 items-center justify-center rounded-btn border border-border-subtle text-text-secondary"
        >
          <Menu className="size-4" aria-hidden="true" />
        </button>
      </div>

      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border-subtle bg-bg-elevated/40 px-3 py-5 lg:flex">
        <div className="px-3">
          <Link to="/admin" className="text-sm font-semibold text-text-primary">
            ✦ 星屿后台
          </Link>
          <p className="mt-1 truncate text-xs text-text-muted">{user?.email ?? '—'}</p>
        </div>

        <div className="mt-6 flex-1 overflow-y-auto">{nav}</div>

        <div className="space-y-1 border-t border-border-subtle pt-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-btn px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-white/[0.05] hover:text-text-primary"
          >
            查看前台
          </Link>
          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="flex w-full items-center gap-2.5 rounded-btn px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-60"
          >
            <LogOut className="size-4" aria-hidden="true" />
            退出登录
          </button>
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            role="presentation"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex h-full w-64 flex-col border-r border-border-subtle bg-bg-base px-3 py-5">
            <div className="flex items-center justify-between px-2">
              <p className="text-sm font-semibold text-text-primary">✦ 后台管理</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="关闭后台菜单"
                className="rounded p-1 text-text-muted hover:text-text-primary"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-1 truncate px-2 text-xs text-text-muted">{user?.email ?? '—'}</p>
            <div className="mt-5 flex-1 overflow-y-auto">{nav}</div>
            <div className="space-y-1 border-t border-border-subtle pt-3">
              <Link
                to="/"
                className="block rounded-btn px-3 py-2 text-sm text-text-secondary hover:text-text-primary"
              >
                查看前台
              </Link>
              <button
                type="button"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="w-full rounded-btn px-3 py-2 text-left text-sm text-danger disabled:opacity-60"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
