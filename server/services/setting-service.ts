import { eq } from 'drizzle-orm'
import type { SettingsInput, SiteSettings } from '../../shared'
import { SITE_NAME_FALLBACK } from '../../shared/constants'
import { siteSettings } from '../../db/schema'
import { db } from '../lib/db'
import { mapSettings } from '../lib/mappers'

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: SITE_NAME_FALLBACK,
  siteDescription: '一个记录作品、文章与思考的个人空间。',
  logoUrl: null,
  faviconUrl: null,
  defaultOgImage: null,
  footerText: null,
  icpRecord: null,
  socialShareText: null,
  navConfig: { about: true, projects: true, blog: true },
}

export async function getSettings(): Promise<SiteSettings> {
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, 'singleton'))
    .limit(1)

  return row ? mapSettings(row) : DEFAULT_SETTINGS
}

export async function updateSettings(input: SettingsInput): Promise<SiteSettings> {
  const values = {
    siteName: input.siteName,
    siteDescription: input.siteDescription,
    logoUrl: input.logoUrl ?? null,
    faviconUrl: input.faviconUrl ?? null,
    defaultOgImage: input.defaultOgImage ?? null,
    footerText: input.footerText ?? null,
    icpRecord: input.icpRecord ?? null,
    socialShareText: input.socialShareText ?? null,
    navConfig: input.navConfig,
    updatedAt: new Date(),
  }

  const [row] = await db
    .insert(siteSettings)
    .values({ id: 'singleton', ...values })
    .onConflictDoUpdate({ target: siteSettings.id, set: values })
    .returning()

  return mapSettings(row)
}
