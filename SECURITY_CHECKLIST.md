# Security Checklist

Security is the first priority — never trade it for speed, simplicity or
"vibe". Follow this before writing code, while planning, and in every change
that touches code.

> **Provenance.** Adapted from the Vibe Coding Security Checklist used on
> Serendipity, an iOS/Firebase app. Commonplace has no Firebase, no Firestore,
> no ARKit and no location data, so rules naming those are not reproduced as if
> they applied — the intent behind each has been mapped onto this stack instead.
> [§ 6](#06--carried-over-but-not-applicable) lists every dropped rule and why,
> so nothing is silently lost. If Commonplace ever grows a Firebase backend,
> restore them from that section.

**Stack this covers.** `web/` — Next.js 16, React 19, Auth.js v5, Drizzle,
Postgres; the only part with a network, a database or credentials. `ios/` and
`android/` are offline portfolio builds: bundled seed data, no backend, no
network calls, no persistence, no secrets.

---

## 01 — Secrets & config

- Never hardcode secrets, tokens, API keys, passwords or credentials — use
  environment variables, documented in `web/.env.example`.
- Never log, print or return secrets in errors, logs or debug output. Upstream
  error bodies count: X's error shapes can echo the request, bearer token
  included.
- Never commit `.env`, `.env.local` or any file holding real values.
  `web/.gitignore` ignores `.env*` and re-includes only `.env.example`.
- `.env.example` documents every key the app needs and holds no real values —
  it is the one env file that must be committed.
- Client code must not contain server-only secrets. Provider tokens live in the
  Auth.js JWT and the `connections` table, and are never copied onto the
  session object, which is serialised to the browser.
- Scan dependencies (`npm audit`) and prefer well-maintained libraries. Record
  accepted risks in § 7 rather than leaving them to be rediscovered.
- No debug modes, dev tools or stray `console.log` / `print` in shipped code.
  `console.error` on a server route is operational logging, not debug output —
  it is the correct destination for detail that must not reach a response.

## 02 — Access & API

- Every route handler that reads or writes user data must require a session.
  There is no anonymous write path.
- Prevent IDOR: derive the subject from the session, never from a client-supplied
  id. `/api/sync` resolves its user from `session.xUserId` and accepts no body.
- Server-side checks are the authoritative layer. Client-side checks are
  advisory only.
- Auth failures must not leak more than the page already states. `/connect`
  publicly says access is limited to one account, so naming the allowlist in the
  refusal reveals nothing new — but never leak whether a given account exists.
- Rate-limit auth and public endpoints. For endpoints that cost money, a spend
  ceiling the environment cannot raise is part of this, not an alternative to it.
- Never expose stack traces, internal paths, upstream response bodies or
  database errors in a response. Log them; return a plain sentence.
- Return minimal data — never over-fetch or leak extra records. Use targeted
  `update` over blanket writes so server-authoritative fields are not clobbered.
- Require explicit confirmation for delete, disconnect and account-change
  actions before wiring them up.
- Guard privileged routes with a real allowlist check, never URL obscurity.
- State-changing POSTs need CSRF defence. `SameSite=Lax` on the session cookie
  is the baseline; an explicit same-origin check on top is cheap.

## 03 — User input

- Never trust user input — validate, sanitise and escape everywhere.
- Use Drizzle's typed query builder. No string-concatenated SQL, ever.
- Treat third-party API responses as untrusted input, not as data. Post text,
  handles and display names from X are attacker-influencable.
- Never render a third-party URL into an `href` without validating its scheme;
  `javascript:` in a link is XSS. Construct post URLs rather than echoing them.
- Validate anything client-supplied on the server before acting on it.
- Clamp numeric config and input to a valid range before use — including
  operator config, which is as capable of a typo as a user is.

## 04 — Platform rules

### Web

- Secrets stay server-side. A `'use client'` module must never import the auth
  config or the database client.
- Session cookies: `httpOnly`, `SameSite=Lax`, `Secure` in production. These are
  the Auth.js defaults; do not weaken them.
- Encrypt provider tokens at rest (`lib/db/crypto.ts`). This is no defence
  against a compromised server — it defends against the realistic leak, which is
  a database dump or console access without the app.
- Fail closed. An unset allowlist admits nobody; a missing encryption key stops
  the write rather than downgrading to plaintext.
- Redirect targets must be relative or same-origin. Never redirect to a
  client-supplied absolute URL.

### iOS and Android

Both are offline portfolio builds. The rules below are the ones that would bite
the moment either grows a backend — check them before adding one.

- No secrets in the bundle. Neither app has any today; both read only the
  committed `Seed.json`.
- If tokens or session data are ever stored: Keychain on iOS, EncryptedSharedPreferences
  on Android. Never `UserDefaults`, never plain `SharedPreferences`.
- Biometric unlock is a UI gate only — re-validate auth server-side behind it.
- Every declared permission, entitlement and background mode must be used by
  shipping code. Both apps currently declare none, which is the correct state
  for what they do.
- No PII in analytics; hash identifiers before logging. Neither app has
  analytics today.

## 05 — Hard rules

- Follow OWASP Top 10 and the OWASP Cheat Sheets by default.
- Secure defaults: HTTPS only, secure cookies, current crypto, no home-rolled
  primitives.
- Comment non-obvious security decisions in the code, explaining the *why* —
  e.g. why an error is logged rather than returned.
- If a task conflicts with this checklist, stop and ask before proceeding.
- After generating code, review it against this checklist and state any
  violations and their fixes.
- When planning features or architecture, propose designs that satisfy this
  checklist from the start.

> **One convention deliberately not carried over.** Serendipity begins every
> source file with a `// MARK: - SECURITY CHECKLIST COMPLIANCE` block. `// MARK:`
> is Swift, and a per-file boilerplate header across a codebase where most files
> are typography and layout would be noise that stops being read. The intent is
> kept as the § 5 rule: comment the non-obvious decisions, at the point of the
> decision. Say the word if you would rather have the headers.

---

## 06 — Carried over but not applicable

Kept verbatim in spirit so they can be restored if the stack changes.

| Original rule | Why it does not apply |
|---|---|
| Firebase Remote Config for secrets | No Firebase. Secrets come from the environment. |
| Firestore Security Rules as the enforcement layer | No Firestore. Route handlers plus Postgres constraints are the enforcement layer. |
| Firestore typed SDK, no string concatenation | Mapped to Drizzle's query builder in § 3. |
| `GoogleService-Info.plist` excluded from git | No Firebase config file exists. `ios/Commonplace/Info.plist` is the stock bundle plist and holds no secrets. |
| `updateData` not `setData` | Firestore-specific. The equivalent — never clobber server-authoritative fields — is in § 2. |
| Cloud Functions proxying, rate limits, XP grants, waitlist, referral rewards, trust score | Serendipity domain logic. No equivalent here. |
| `NearbyInteraction` discovery tokens | Not used. |
| `CLLocation` / geohash precision 7 | Commonplace stores no location data. |
| ARKit camera session teardown | No camera use. |
| `AnalyticsService` SHA256 UID hashing | No analytics in any of the three apps. |
| Alert caps, `revealProgress`, `balanceBoostMultiplier` clamping | Serendipity domain values. The general clamping rule is kept in § 3. |
| OTP endpoint rate limiting | No OTP flow. OAuth is the only auth path. |

## 07 — Accepted risks

- **`npm audit`: 4 moderate, esbuild ≤0.24.2 via `drizzle-kit`.** The advisory
  is that esbuild's *dev server* accepts cross-origin requests. It reaches us
  only through `drizzle-kit`, a devDependency that never ships and is run
  manually against a local shell. `npm audit fix --force` would downgrade
  drizzle-kit from 0.31 to 0.18 — a breaking change, for a vulnerability with no
  production reachability. Re-check when drizzle-kit updates its esbuild range.

## 08 — Open items

- **Refresh-token rotation is not implemented.** An expired connection returns
  409 and asks for a fresh sign-in. Acceptable while sync is manual and
  single-user; required before any scheduled sync.
- **No rate limit on `/api/sync` beyond the page ceiling.** One allowlisted
  account and a per-request page cap bound the exposure today. Add a real
  limiter before the allowlist widens.
- **`Disconnect` in Settings is inert** — no handler attached. When it is wired
  up it needs an explicit confirmation step and must revoke the X token, not
  just delete the row.
