import type { AuthUser } from '../shared'

export type AppEnv = {
  Variables: {
    user: AuthUser
    sessionToken: string
  }
}
