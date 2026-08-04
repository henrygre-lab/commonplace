package com.commonplace

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonPrimitive

// Data shapes — 01-design-spec.md § 2. A port of ios/Commonplace/Models.swift.

@Serializable
data class Bookmark(
    val id: Int,
    val author: String,
    val handle: String,
    /** Kept as the display string. There is no date maths in this app. */
    val date: String,
    val tags: List<String> = emptyList(),
    /** THE EXTRACTED IDEA, as a claim. */
    val title: String,
    /** 2 sentences, ~40 words, the argument in the reader's own voice. */
    val summary: String,
    val concepts: List<String> = emptyList(),
    val actions: List<String> = emptyList(),
    /** The raw post, \n\n between paragraphs. */
    val original: String,
    val likes: String,
    val reposts: String,
    val reviewed: Boolean = false,
    /** Starred; resurfaces more often, never expires. */
    val core: Boolean = false,
    val note: String = "",
) {
    /** Derived, not stored — first letter of the first two words of `author`. */
    val initials: String
        get() = author.split(" ").take(2).mapNotNull { it.firstOrNull() }.joinToString("")
}

@Serializable
data class Brief(
    val no: Int,
    val dateLine: String,
    val shortDateLine: String,
    val dateShort: String,
    val mins: String,
    val shortMins: String,
    val headline: String,
    val lede: String,
    val paras: List<String>,
    val closer: String,
    /** The count word here must match `itemIds.size`. */
    val sectionLabel: String,
    val itemIds: List<Int>,
    val resId: Int,
    val resLabel: String,
    val resLabelShort: String,
    val promptQ: String,
    val promptA: String,
    val promptSourceId: Int,
    val promptSource: String,
)

/**
 * The reason is the product: it names WHY two saves connect. "Related" is a
 * failure; "Argues the opposite" is the feature.
 */
data class Relation(val id: Int, val reason: String) {
    /** Disagreement is visually distinct from agreement. */
    val disagrees: Boolean get() = reason.lowercase().contains("opposite")
}

@Serializable
data class AskAnswer(
    /** Trigger keywords. */
    val keys: List<String> = emptyList(),
    val label: String,
    /** 2 paragraphs; the 2nd names a GAP in the library. */
    val paras: List<String>,
    /** Cited sources. */
    val ids: List<Int> = emptyList(),
)

enum class Filter(val label: String) {
    All("All"),
    Unreviewed("Unreviewed"),
    Core("Core"),
}

enum class GroupBy(val label: String) {
    Date("Date"),
    Theme("Theme"),
    None("None"),
}

data class AppSettings(
    val time: String = "07:00",
    val freq: String = "Daily",
    val email: Boolean = true,
    val push: Boolean = false,
    /** "Include a recall prompt". */
    val spaced: Boolean = true,
)

/**
 * Seed.json — the same file the iPhone app bundles, read straight from assets.
 *
 * `relations` is a JSON object whose values are mixed arrays,
 * `[12, "Argues the opposite"]`, so it decodes as primitives and is rebuilt into
 * `Map<Int, List<Relation>>` on load. This is what Swift's `RelationField` enum
 * does at ios/Commonplace/Models.swift.
 */
@Serializable
data class SeedFile(
    val bookmarks: List<Bookmark>,
    val briefs: List<Brief>,
    val relations: Map<String, List<List<JsonPrimitive>>>,
    val askCorpus: List<AskAnswer>,
)
