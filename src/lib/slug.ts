/**
 * 前端只做轻量 slug 预览：ASCII 直接转写，中文标题留给服务端用拼音生成。
 * 这样避免把 pinyin-pro 打进访客与后台的构建产物。
 */
export function toClientSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
}
