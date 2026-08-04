import { handlers } from '@/lib/auth'

// Auth.js owns every route under /api/auth: sign-in, the X callback, session
// and CSRF. There is no proxy.ts — the routes that need a session check it
// themselves, so nothing here runs on requests that do not touch auth.
export const { GET, POST } = handlers
