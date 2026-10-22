import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { PublicLayout } from './layouts/PublicLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { RequireAuth } from '@/features/admin/auth/RequireAuth'
import { RouteErrorPage } from '@/features/error/RouteErrorPage'

const HomePage = lazy(() =>
  import('@/features/home/HomePage').then((module) => ({ default: module.HomePage })),
)
const AboutPage = lazy(() =>
  import('@/features/about/AboutPage').then((module) => ({ default: module.AboutPage })),
)
const ProjectsPage = lazy(() =>
  import('@/features/projects/ProjectsPage').then((module) => ({ default: module.ProjectsPage })),
)
const ProjectDetailPage = lazy(() =>
  import('@/features/projects/ProjectDetailPage').then((module) => ({
    default: module.ProjectDetailPage,
  })),
)
const BlogPage = lazy(() =>
  import('@/features/blog/BlogPage').then((module) => ({ default: module.BlogPage })),
)
const BlogPostPage = lazy(() =>
  import('@/features/blog/BlogPostPage').then((module) => ({ default: module.BlogPostPage })),
)
const ContactPage = lazy(() =>
  import('@/features/contact/ContactPage').then((module) => ({ default: module.ContactPage })),
)
const NotFoundPage = lazy(() =>
  import('@/features/not-found/NotFoundPage').then((module) => ({
    default: module.NotFoundPage,
  })),
)

const LoginPage = lazy(() =>
  import('@/features/admin/auth/LoginPage').then((module) => ({ default: module.LoginPage })),
)
const DashboardPage = lazy(() =>
  import('@/features/admin/dashboard/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
)
const ProfilePage = lazy(() =>
  import('@/features/admin/profile/ProfilePage').then((module) => ({
    default: module.ProfilePage,
  })),
)
const SkillsPage = lazy(() =>
  import('@/features/admin/skills/SkillsPage').then((module) => ({
    default: module.SkillsPage,
  })),
)
const TagsPage = lazy(() =>
  import('@/features/admin/tags/TagsPage').then((module) => ({ default: module.TagsPage })),
)
const PostsPage = lazy(() =>
  import('@/features/admin/posts/PostsPage').then((module) => ({ default: module.PostsPage })),
)
const PostEditorPage = lazy(() =>
  import('@/features/admin/posts/PostEditorPage').then((module) => ({
    default: module.PostEditorPage,
  })),
)
const AdminProjectsPage = lazy(() =>
  import('@/features/admin/projects/ProjectsPage').then((module) => ({
    default: module.ProjectsPage,
  })),
)
const ProjectEditorPage = lazy(() =>
  import('@/features/admin/projects/ProjectEditorPage').then((module) => ({
    default: module.ProjectEditorPage,
  })),
)
const MediaPage = lazy(() =>
  import('@/features/admin/media/MediaPage').then((module) => ({ default: module.MediaPage })),
)
const MessagesPage = lazy(() =>
  import('@/features/admin/messages/MessagesPage').then((module) => ({
    default: module.MessagesPage,
  })),
)
const SettingsPage = lazy(() =>
  import('@/features/admin/settings/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  })),
)
const AccountPage = lazy(() =>
  import('@/features/admin/account/AccountPage').then((module) => ({
    default: module.AccountPage,
  })),
)

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:slug', element: <ProjectDetailPage /> },
      { path: 'blog', element: <BlogPage /> },
      { path: 'blog/:slug', element: <BlogPostPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/admin/login',
    element: <LoginPage />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/admin',
    element: (
      <RequireAuth>
        <AdminLayout />
      </RequireAuth>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'skills', element: <SkillsPage /> },
      { path: 'tags', element: <TagsPage /> },
      { path: 'posts', element: <PostsPage /> },
      { path: 'posts/new', element: <PostEditorPage /> },
      { path: 'posts/:id/edit', element: <PostEditorPage /> },
      { path: 'projects', element: <AdminProjectsPage /> },
      { path: 'projects/new', element: <ProjectEditorPage /> },
      { path: 'projects/:id/edit', element: <ProjectEditorPage /> },
      { path: 'media', element: <MediaPage /> },
      { path: 'messages', element: <MessagesPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'account', element: <AccountPage /> },
    ],
  },
])
