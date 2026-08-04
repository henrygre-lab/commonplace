package com.commonplace.design

import androidx.compose.ui.graphics.Color

/**
 * Every colour in the product, named — 01-design-spec.md § 1.1.
 *
 * Warm paper and ink. Every neutral carries a yellow-brown cast; there are no
 * cool greys and no pure white or black anywhere in this design.
 *
 * A direct port of ios/Commonplace/Design/Palette.swift — same names, same
 * order, same values. If one changes, change both.
 */
object Palette {

    // ── Surfaces ───────────────────────────────────────────────────────────

    val ground = Color(0xFFF5F1E9)         // page background, everywhere
    val groundSunk = Color(0xFFEFEADD)     // tab bar
    val surface = Color(0xFFFCFAF4)        // cards, panels, inputs
    val surfaceInset = Color(0xFFF5F1E7)   // inputs inside a surface card
    val rowHover = Color(0xFFFAF6EC)       // pressed / selected row fill
    val segmentTrack = Color(0xFFEDE7D9)   // segmented control trough
    val segmentActive = Color(0xFFFDFBF6)  // active pill
    val avatar = Color(0xFFE7DFCC)
    val avatarLarge = Color(0xFFDFD5BF)
    val chip = Color(0xFFEFE9DA)           // untagged / suggestion chip
    val chipHover = Color(0xFFE7DFC9)

    // ── Ink ────────────────────────────────────────────────────────────────

    val ink = Color(0xFF191713)       // headlines, primary text, dark buttons
    val inkSoft = Color(0xFF2E2921)   // brief prose, detail summary, row titles
    val inkBody = Color(0xFF3A342B)   // concepts, actionables
    val muted = Color(0xFF5C554A)     // secondary prose, row summary
    val muted2 = Color(0xFF6E6555)    // item summaries in brief, avatar initials
    val muted3 = Color(0xFF7C7466)    // descriptions, subheads, inactive segment
    val faint = Color(0xFF918879)     // eyebrows, metadata, dates
    val fainter = Color(0xFFA79E8A)   // counts, footnotes
    val faintest = Color(0xFFB3A992)  // timestamps, "No." numerals
    val onDark = Color(0xFFF7F3EA)    // text on ink buttons and the toast
    val onOchre = Color(0xFFFDFBF6)   // text on ochre buttons
    val reviewed = Color(0xFF8C8272)  // the "Reviewed" state label

    // ── Accent — ochre. The only accent in the product. ────────────────────

    val ochre = Color(0xFFA2731F)
    val ochreDeep = Color(0xFF7E570F)
    val ochreLine = Color(0xFFC9AE79)      // input focus border
    val ochreLineSoft = Color(0xFFDDCBA6)  // underline on inline links
    val ochreTint = Color(0xFFEFE3CB)      // active-state fill

    /**
     * Disagreement is visually distinct from agreement — any connection reason
     * containing "opposite" renders in this, never in ochre.
     */
    val disagree = Color(0xFF8A5441)

    // ── Lines — all 1dp ────────────────────────────────────────────────────

    val line = Color(0xFFE4DDCE)         // card borders, section rules
    val lineRow = Color(0xFFEAE3D4)      // row separators
    val lineFaint = Color(0xFFEFE9DC)    // separators inside cards
    val lineSidebar = Color(0xFFE2DACA)  // tab bar top hairline
    val lineStrong = Color(0xFFD8CEB8)   // brief header/footer, dashed border

    // ── Functional ─────────────────────────────────────────────────────────

    val starOff = Color(0xFFD5CCB8)    // ✦ when not core
    val toggleOff = Color(0xFFDDD5C2)
    val knob = Color(0xFFFDFBF6)
    val sync = Color(0xFF7A8B5A)       // the one green in the product
    val danger = Color(0xFF8C4A3A)
    val permDot = Color(0xFFC9BFA8)    // inactive onboarding permission dot

    // ── Tag palette — semantic, 5 families ─────────────────────────────────

    /** A tag's colour comes from its family, not from a hash. */
    fun tagHue(name: String): TagHue = when (name) {
        "Business", "Pricing", "Distribution", "Hiring" ->
            TagHue(Color(0xFFF1E7D3), Color(0xFF7C5710))   // Commerce
        "Health", "Sleep" ->
            TagHue(Color(0xFFE4EADA), Color(0xFF4E6137))   // Body
        "Psychology", "Decisions", "Self" ->
            TagHue(Color(0xFFE1E7ED), Color(0xFF456079))   // Mind
        "Writing", "Career", "Tools", "Attention" ->
            TagHue(Color(0xFFF2E4DD), Color(0xFF8A5441))   // Craft
        "Philosophy", "Leverage" ->
            TagHue(Color(0xFFEAE3EC), Color(0xFF6A5171))   // Meaning
        else ->
            TagHue(Color(0xFFEFE9DA), Color(0xFF6E6555))   // user-added
    }

    /** Library → Group by Theme. Maps from the same five families. */
    fun theme(tags: List<String>): String {
        for (tag in tags) {
            when (tag) {
                "Business", "Pricing", "Distribution", "Hiring" -> return "Business & pricing"
                "Health", "Sleep" -> return "Health"
                "Psychology", "Decisions", "Self" -> return "Psychology & decisions"
                "Writing", "Career", "Tools", "Attention" -> return "Craft & career"
                "Philosophy", "Leverage" -> return "Philosophy & leverage"
            }
        }
        return "Everything else"
    }
}

/** Chip fill and text for one tag family. */
data class TagHue(val bg: Color, val fg: Color)
