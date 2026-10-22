import { env } from '../env'

/**
 * 发布内容后触发一次静态重建（可选）。失败不影响主流程。
 */
export async function triggerDeployHook(): Promise<void> {
  if (!env.DEPLOY_HOOK_URL) return

  try {
    const response = await fetch(env.DEPLOY_HOOK_URL, { method: 'POST' })
    if (!response.ok) {
      console.error('[deploy-hook] 触发失败', response.status)
    }
  } catch (error) {
    console.error('[deploy-hook] 请求异常', error)
  }
}
