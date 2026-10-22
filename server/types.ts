import type { AuthUser } from '../shared/index.js'

export type AppEnv = {
  Variables: {
    user: AuthUser
    sessionToken: string
  }
}
