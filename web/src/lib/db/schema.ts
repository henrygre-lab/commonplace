import {
  boolean,
  customType,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

/** pgvector — embeddings live next to the rows; no separate vector service. */
const vector = customType<{ data: number[]; driverData: string }>({
  dataType: (config) => `vector(${(config as { dimensions: number }).dimensions})`,
  toDriver: (v) => JSON.stringify(v),
  fromDriver: (v) => JSON.parse(v) as number[],
})

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  xUserId: text('x_user_id').unique(),
  handle: text('handle').notNull(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

/** One X account per user for now. */
export const connections = pgTable('connections', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token').notNull(), // encrypt at rest
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  scopes: text('scopes').array(),
  source: text('source').notNull(), // 'x-api' | 'archive-import' | 'paste'
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  nextToken: text('next_token'),
})

export const bookmarks = pgTable(
  'bookmarks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    postId: text('post_id').notNull(),
    authorName: text('author_name').notNull(),
    authorHandle: text('author_handle').notNull(),
    authorAvatar: text('author_avatar'),
    postedAt: timestamp('posted_at', { withTimezone: true }),
    savedAt: timestamp('saved_at', { withTimezone: true }).notNull(),
    original: text('original').notNull(), // full post text, \n\n preserved
    likes: integer('likes'),
    reposts: integer('reposts'),
    url: text('url'),

    // Extracted by the AI pass; null until processed.
    title: text('title'), // THE IDEA as a claim
    summary: text('summary'), // 2 sentences
    concepts: text('concepts').array(), // 2
    actions: text('actions').array(), // 2
    tags: text('tags').array(),
    embedding: vector('embedding', { dimensions: 1536 }),

    reviewed: boolean('reviewed').default(false),
    core: boolean('core').default(false),
    note: text('note').default(''),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (t) => [
    unique('bookmarks_user_post').on(t.userId, t.postId),
    index('bookmarks_user_saved_idx').on(t.userId, t.savedAt.desc()),
  ],
)

export const briefs = pgTable(
  'briefs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    no: integer('no').notNull(), // per-user sequence, 1-based
    forDate: date('for_date').notNull(),
    headline: text('headline').notNull(),
    lede: text('lede').notNull(),
    paras: text('paras').array().notNull(), // 2
    closer: text('closer').notNull(),
    /** The count word here MUST match itemIds.length. */
    sectionLabel: text('section_label').notNull(),
    itemIds: uuid('item_ids').array().notNull(),
    resurfacedId: uuid('resurfaced_id').references(() => bookmarks.id),
    resLabel: text('res_label'),
    promptQ: text('prompt_q'),
    promptA: text('prompt_a'),
    promptSrcId: uuid('prompt_src_id').references(() => bookmarks.id),
    readAt: timestamp('read_at', { withTimezone: true }),
    mins: integer('mins'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [unique('briefs_user_no').on(t.userId, t.no)],
)

/** Cached semantic links. A reason of "Related" or "Similar" never gets stored. */
export const connectionsGraph = pgTable(
  'connections_graph',
  {
    fromId: uuid('from_id')
      .notNull()
      .references(() => bookmarks.id, { onDelete: 'cascade' }),
    toId: uuid('to_id')
      .notNull()
      .references(() => bookmarks.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(), // "Argues the opposite"
    score: real('score'),
  },
  (t) => [primaryKey({ columns: [t.fromId, t.toId] })],
)

export const settings = pgTable('settings', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  deliveryTime: text('delivery_time').default('07:00'),
  timezone: text('timezone').default('Europe/London'),
  frequency: text('frequency').default('daily'), // daily | weekdays | weekly
  emailBrief: boolean('email_brief').default(true),
  pushBrief: boolean('push_brief').default(false),
  recallPrompt: boolean('recall_prompt').default(true),
})

/** History, and a cache. */
export const asks = pgTable('asks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  query: text('query').notNull(),
  label: text('label'),
  paras: text('paras').array(),
  sourceIds: uuid('source_ids').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
