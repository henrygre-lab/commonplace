import NextAuth, { type DefaultSession } from 'next-auth'
import Twitter, { type TwitterProfile } from 'next-auth/providers/twitter'

/**
 * Real X sign-in, deliberately allowlisted.
 *
 * Signing in costs nothing. Reading bookmarks bills per resource, so the
 * `signIn` callback refuses every X account except the one named in
 * `X_ALLOWLIST_USER_ID`. That allowlist is the spend guard: without it, anyone
 * who found the public deployment could run a backfill against our key.
 *
 * Session strategy is `jwt` with no adapter, so this file works before a
 * database exists. The provider tokens ride in the encrypted JWT and move to
 * the `connections` table when the sync route lands.
 */

declare module 'next-auth' {
  interface User {
    /** X handle without the leading @. The stock provider throws this away. */
    username?: string
  }
  interface Session {
    /** The X user id — `user.id` is a random UUID and is not it. */
    xUserId?: string
    user: { username?: string } & DefaultSession['user']
  }
}

// Augmenting `@auth/core/jwt`, not `next-auth/jwt`: the latter is a bare
// re-export, and TypeScript cannot augment a module that only re-exports.
declare module '@auth/core/jwt' {
  interface JWT {
    xUserId?: string
    username?: string
    /** Never surfaced to the client; the session callback does not copy these. */
    accessToken?: string
    refreshToken?: string
    /** Seconds since epoch, as X returns it. */
    expiresAt?: number
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  // A refusal lands back on /connect rather than Auth.js's own error page, so
  // the explanation is written in our voice.
  pages: { signIn: '/connect', error: '/connect' },
  providers: [
    Twitter({
      // Kept as the built-in `twitter` id, which fixes the callback URL at
      // /api/auth/callback/twitter. Re-iding it to `x` would read better but
      // `ProviderId` is a closed union of built-in ids, so signIn('x') would
      // not type-check. Credentials are passed explicitly because env
      // inference keys off that same built-in id and would look for
      // AUTH_TWITTER_ID rather than the AUTH_X_ID this repo documents.
      clientId: process.env.AUTH_X_ID,
      clientSecret: process.env.AUTH_X_SECRET,
      // `bookmark.read` is the addition; the rest are the provider defaults.
      // Left as a string because the default is a string, and the options
      // merge in @auth/core does not reconcile a string with an object.
      authorization:
        'https://x.com/i/oauth2/authorize?scope=users.read tweet.read bookmark.read offline.access',
      // The stock profile() drops `username`, which is the only identifier the
      // interface ever shows. Everything else here matches the default.
      profile({ data }: TwitterProfile) {
        return {
          id: data.id,
          name: data.name,
          email: data.email ?? null,
          image: data.profile_image_url ?? null,
          username: data.username,
        }
      },
    }),
  ],
  callbacks: {
    signIn({ account }) {
      const allowed = process.env.X_ALLOWLIST_USER_ID
      // Fails closed. An unset allowlist admits nobody rather than everybody.
      if (!allowed) return false
      return account?.providerAccountId === allowed
    },
    jwt({ token, account, user }) {
      // `account` is present only on the sign-in call, never on refreshes.
      if (account) {
        token.xUserId = account.providerAccountId
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }
      if (user?.username) token.username = user.username
      return token
    },
    session({ session, token }) {
      session.xUserId = token.xUserId
      session.user.username = token.username
      return session
    },
  },
  events: {
    // Mirror the provider tokens into `connections` so ingest does not depend
    // on someone having a live browser session. Skipped when DATABASE_URL is
    // unset, which is what lets sign-in work before the database exists.
    async signIn({ account, user }) {
      if (!process.env.DATABASE_URL || !account?.access_token) return
      // `handle` is notNull in the schema; our profile() above always sets it.
      const handle = user.username
      if (!handle) return

      const { upsertConnection } = await import('@/lib/db/connections')
      await upsertConnection({
        xUserId: account.providerAccountId,
        handle,
        displayName: user.name,
        avatarUrl: user.image,
        accessToken: account.access_token,
        refreshToken: account.refresh_token,
        expiresAt: account.expires_at,
        scopes: account.scope?.split(' '),
      })
    },
  },
})
