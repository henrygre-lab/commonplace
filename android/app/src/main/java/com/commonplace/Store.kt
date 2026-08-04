package com.commonplace

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.platform.LocalContext
import com.commonplace.design.Palette
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.int

/**
 * All state and all mutations — a port of ios/Commonplace/Store.swift.
 *
 * Briefs, connections and Ask answers all reference bookmarks BY ID and hydrate
 * at read time. Nothing is denormalised, so marking something reviewed in the
 * library updates it inside the brief too. Keep it that way.
 */
class Store(seed: SeedFile, private val scope: CoroutineScope) {

    // ── Corpus ─────────────────────────────────────────────────────────────

    var bookmarks by mutableStateOf(seed.bookmarks)
        private set

    val briefs: List<Brief> = seed.briefs
    val askCorpus: List<AskAnswer> = seed.askCorpus

    /**
     * A reason of "Related" or "Similar" is a failure — those rows are dropped
     * on load rather than rendered.
     */
    val relations: Map<Int, List<Relation>> = seed.relations.mapNotNull { (key, rows) ->
        val from = key.toIntOrNull() ?: return@mapNotNull null
        from to rows.mapNotNull { row ->
            val id = row.getOrNull(0)?.int ?: return@mapNotNull null
            val reason = row.getOrNull(1)?.content ?: return@mapNotNull null
            if (reason.lowercase() in setOf("related", "similar")) null
            else Relation(id, reason)
        }
    }.toMap()

    // ── UI state ───────────────────────────────────────────────────────────

    var query by mutableStateOf("")
    var filter by mutableStateOf(Filter.All)
    var activeTag by mutableStateOf<String?>(null)
    var groupBy by mutableStateOf(GroupBy.Date)
    var settings by mutableStateOf(AppSettings())
    var toast by mutableStateOf<String?>(null)
        private set

    private var readBriefs by mutableStateOf(setOf(141, 140, 139, 138))

    // ── Display constants — the prototype's theatre, kept deliberately ─────
    //
    // This is a portfolio build: it has to look like a product in real use, so
    // these are NOT computed from `bookmarks.size`. The web app does the
    // opposite and shows real counts. See 02-interactions-and-state.md § 2.

    val totalIdeas = "1,284"
    val briefCount = 142
    val archiveCount = 143
    val unreviewedCount = 89
    val connectionsTotal = "1,284"
    val syncedAgo = "6 min"
    val archiveSince = "4 March"

    private var toastJob: Job? = null

    // ── Lookup ─────────────────────────────────────────────────────────────

    fun bookmark(id: Int): Bookmark? = bookmarks.firstOrNull { it.id == id }

    fun hydrate(ids: List<Int>): List<Bookmark> = ids.mapNotNull { bookmark(it) }

    /**
     * The detail screen's ↑ ↓ buttons step through the WHOLE corpus with
     * wraparound, not the filtered subset — reading is browsing, and filters
     * are for finding.
     */
    fun step(id: Int, direction: Int): Int {
        if (bookmarks.isEmpty()) return id
        val i = bookmarks.indexOfFirst { it.id == id }
        if (i < 0) return id
        val n = bookmarks.size
        return bookmarks[((i + direction) % n + n) % n].id
    }

    fun related(id: Int): List<Pair<Relation, Bookmark>> =
        (relations[id] ?: emptyList()).mapNotNull { r ->
            bookmark(r.id)?.let { r to it }
        }

    // ── Mutations ──────────────────────────────────────────────────────────

    private fun update(id: Int, transform: (Bookmark) -> Bookmark) {
        bookmarks = bookmarks.map { if (it.id == id) transform(it) else it }
    }

    fun toggleReviewed(id: Int) {
        val next = bookmark(id)?.reviewed?.not() ?: return
        update(id) { it.copy(reviewed = next) }
        flash(if (next) "Marked reviewed" else "Moved back to unreviewed")
    }

    fun toggleCore(id: Int) {
        val next = bookmark(id)?.core?.not() ?: return
        update(id) { it.copy(core = next) }
        flash(if (next) "Added to core — resurfaces more often" else "Removed from core")
    }

    fun setNote(id: Int, note: String) = update(id) { it.copy(note = note) }

    fun addTag(id: Int, tag: String) {
        val t = tag.trim()
        if (t.isEmpty()) return
        val current = bookmark(id) ?: return
        if (current.tags.contains(t)) return
        update(id) { it.copy(tags = it.tags + t) }
    }

    fun removeTag(id: Int, tag: String) = update(id) { it.copy(tags = it.tags - tag) }

    fun toggleBriefRead(no: Int) {
        readBriefs = if (no in readBriefs) {
            readBriefs - no
        } else {
            // Toasts only when marking read, not when unmarking.
            flash("Brief marked read · next one at ${settings.time}")
            readBriefs + no
        }
    }

    fun isRead(no: Int): Boolean = no in readBriefs

    /** The toast auto-dismisses after 1.9s. */
    fun flash(message: String) {
        toastJob?.cancel()
        toast = message
        toastJob = scope.launch {
            delay(1900)
            toast = null
        }
    }

    // ── Derived ────────────────────────────────────────────────────────────

    /**
     * Filtered by filter, then activeTag, then a case-insensitive substring
     * match of query against title + summary + author + tags.
     */
    val visible: List<Bookmark> by derivedStateOf {
        val q = query.trim().lowercase()
        bookmarks.filter { b ->
            when {
                filter == Filter.Unreviewed && b.reviewed -> false
                filter == Filter.Core && !b.core -> false
                activeTag != null && !b.tags.contains(activeTag) -> false
                q.isEmpty() -> true
                else -> "${b.title} ${b.summary} ${b.author} ${b.tags.joinToString(" ")}"
                    .lowercase().contains(q)
            }
        }
    }

    data class Bucket(val label: String, val items: List<Bookmark>)

    /** Theme buckets sort by descending size; `None` yields one unlabelled bucket. */
    val buckets: List<Bucket> by derivedStateOf {
        val items = visible
        if (groupBy == GroupBy.None) {
            if (items.isEmpty()) emptyList() else listOf(Bucket("", items))
        } else {
            val grouped = LinkedHashMap<String, MutableList<Bookmark>>()
            for (b in items) {
                val key = if (groupBy == GroupBy.Date) monthGroup(b.date) else Palette.theme(b.tags)
                grouped.getOrPut(key) { mutableListOf() }.add(b)
            }
            val result = grouped.map { (label, items) -> Bucket(label, items) }
            if (groupBy == GroupBy.Theme) result.sortedByDescending { it.items.size } else result
        }
    }

    data class TagCount(val name: String, val count: Int)

    /**
     * Tags with counts, alphabetical — the desktop sidebar's tag list becomes a
     * horizontally scrolling row above the library.
     */
    val tagList: List<TagCount> by derivedStateOf {
        val counts = mutableMapOf<String, Int>()
        for (b in bookmarks) for (t in b.tags) counts[t] = (counts[t] ?: 0) + 1
        // Counts keep the prototype's scaling so the library looks lived-in.
        counts.keys.sorted().map { TagCount(it, counts.getValue(it) * 17 + 6) }
    }

    // ── Ask ────────────────────────────────────────────────────────────────
    //
    // There is no error state and no empty-result illustration. A miss is framed
    // as information about the library rather than about the question.

    fun answer(question: String): AskAnswer {
        val q = question.lowercase()

        askCorpus.firstOrNull { a -> a.keys.any { q.contains(it) } }?.let { return it }

        val needle = q.split(" ").firstOrNull { it.length > 3 } ?: q
        val matches = bookmarks.filter {
            "${it.title} ${it.summary} ${it.tags.joinToString(" ")}"
                .lowercase().contains(needle)
        }.take(3)

        if (matches.isNotEmpty()) {
            return AskAnswer(
                keys = emptyList(),
                label = "Across ${matches.size} loosely related saves",
                paras = listOf(
                    "Nothing in your library answers that directly. The closest saves are below — they touch the question without settling it.",
                    "If this is a live question for you, it is worth saving deliberately rather than waiting for it to turn up.",
                ),
                ids = matches.map { it.id },
            )
        }

        return AskAnswer(
            keys = emptyList(),
            label = "No matches",
            paras = listOf("Nothing you have saved speaks to that. That is useful information about the library rather than about the question."),
            ids = emptyList(),
        )
    }

    companion object {
        private val months = mapOf(
            "Jan" to "January", "Feb" to "February", "Mar" to "March", "Apr" to "April",
            "May" to "May", "Jun" to "June", "Jul" to "July", "Aug" to "August",
            "Sep" to "September", "Oct" to "October", "Nov" to "November", "Dec" to "December",
        )

        fun monthGroup(date: String): String {
            val parts = date.split(" ")
            val month = if (parts.size > 1) parts[1] else ""
            return "${months[month] ?: month} 2026"
        }

        val askSuggestions = listOf(
            "What have I saved about pricing strategy?",
            "What do my saves say about building in public?",
            "Everything on sleep and energy",
            "How do I decide faster?",
        )

        private val json = Json { ignoreUnknownKeys = true }

        /** Seed.json is bundled from ios/Commonplace/Resources — see app/build.gradle.kts. */
        fun loadSeed(context: Context): SeedFile =
            context.assets.open("Seed.json").bufferedReader().use {
                json.decodeFromString(SeedFile.serializer(), it.readText())
            }
    }
}

val LocalStore = staticCompositionLocalOf<Store> { error("No Store provided") }

@Composable
fun rememberStore(): Store {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    return remember { Store(Store.loadSeed(context), scope) }
}
