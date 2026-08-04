import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

/**
 * Envelope encryption for the X provider tokens held in `connections`.
 *
 * Be clear about what this does and does not buy. The key sits in the same
 * environment as DATABASE_URL, so it is no defence against an attacker who has
 * the running server. It defends against the database being read *without* the
 * app: a leaked backup or snapshot, Neon console access, a misplaced dump. Those
 * are the realistic ways a row leaks, and a bearer token in one is a live key to
 * someone's X account until they revoke it.
 *
 * AES-256-GCM, so the ciphertext is authenticated: a tampered row fails to
 * decrypt rather than silently yielding a different token.
 */

const ALGORITHM = 'aes-256-gcm'
const VERSION = 'v1'
const KEY_BYTES = 32
const IV_BYTES = 12

function key(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY
  // Fails closed. A missing key must stop a token being written, not quietly
  // downgrade it to plaintext — the failure has to be loud at deploy time.
  if (!raw) {
    throw new Error(
      'TOKEN_ENCRYPTION_KEY is not set; refusing to store provider tokens in plaintext',
    )
  }
  const parsed = Buffer.from(raw, 'base64')
  if (parsed.length !== KEY_BYTES) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY must decode to ${KEY_BYTES} bytes; got ${parsed.length}`,
    )
  }
  return parsed
}

/** `v1.<iv>.<tag>.<ciphertext>`, each part base64. */
export function encryptToken(plaintext: string): string {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, key(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return [
    VERSION,
    iv.toString('base64'),
    cipher.getAuthTag().toString('base64'),
    ciphertext.toString('base64'),
  ].join('.')
}

export function decryptToken(stored: string): string {
  const [version, iv, tag, ciphertext] = stored.split('.')
  // The version prefix is what will let a future key rotation tell old rows
  // from new ones without guessing at the format.
  if (version !== VERSION || !iv || !tag || !ciphertext) {
    throw new Error('Stored token is not in the expected encrypted format')
  }
  const decipher = createDecipheriv(ALGORITHM, key(), Buffer.from(iv, 'base64'))
  decipher.setAuthTag(Buffer.from(tag, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}
