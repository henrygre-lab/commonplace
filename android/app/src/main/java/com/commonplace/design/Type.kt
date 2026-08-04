package com.commonplace.design

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.PlatformTextStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.commonplace.R

/**
 * Two typefaces. Newsreader for anything editorial, Instrument Sans for UI.
 * Never a third.
 *
 * Android resolves fonts by resource name, so unlike the iPhone app there are no
 * PostScript names to chase — `Newsreader16pt16pt-Regular` there is simply
 * R.font.newsreader_regular here.
 */
val Newsreader = FontFamily(
    Font(R.font.newsreader_regular, FontWeight.Normal),
    Font(R.font.newsreader_italic, FontWeight.Normal, FontStyle.Italic),
)

val InstrumentSans = FontFamily(
    Font(R.font.instrument_sans_regular, FontWeight.Normal),
    Font(R.font.instrument_sans_medium, FontWeight.Medium),
    Font(R.font.instrument_sans_semibold, FontWeight.SemiBold),
)

/**
 * The two corrections that make Compose measure text the way the design is
 * written, and without which nothing lines up with 01-design-spec.md:
 *
 *  - `includeFontPadding = false` drops the legacy padding Android adds above
 *    the ascender and below the descender.
 *  - `LineHeightStyle(Center, None)` distributes leading evenly, so `lineHeight`
 *    behaves like CSS `line-height` — the units the spec is written in.
 *
 * This is where Compose is *easier* than SwiftUI: iOS has to convert to a gap
 * between lines (`lineSpacing = size * (multiple - 1)`), and here the multiple
 * applies directly. `letterSpacing` likewise takes em, so the spec's `-0.02em`
 * is written as-is rather than pre-multiplied into points.
 */
private fun style(
    family: FontFamily,
    size: Double,
    lineHeight: Double?,
    tracking: Double,
    color: Color,
    weight: FontWeight = FontWeight.Normal,
    italic: Boolean = false,
) = TextStyle(
    fontFamily = family,
    fontWeight = weight,
    fontStyle = if (italic) FontStyle.Italic else FontStyle.Normal,
    fontSize = size.sp,
    lineHeight = lineHeight?.let { (size * it).sp } ?: TextUnit.Unspecified,
    letterSpacing = tracking.em,
    color = color,
    platformStyle = PlatformTextStyle(includeFontPadding = false),
    lineHeightStyle = LineHeightStyle(
        alignment = LineHeightStyle.Alignment.Center,
        trim = LineHeightStyle.Trim.None,
    ),
)

/**
 * These two are public on purpose. A screen that needs a one-off size must build
 * it here rather than constructing a `TextStyle` directly — a raw one would miss
 * the padding and line-height corrections above and sit a pixel or two off
 * everything around it.
 */
fun serif(
    size: Double,
    lineHeight: Double? = null,
    tracking: Double = 0.0,
    color: Color,
    italic: Boolean = false,
) = style(Newsreader, size, lineHeight, tracking, color, italic = italic)

fun ui(
    size: Double,
    lineHeight: Double? = null,
    tracking: Double = 0.0,
    color: Color,
    weight: FontWeight = FontWeight.Normal,
) = style(InstrumentSans, size, lineHeight, tracking, color, weight = weight)

/**
 * Every number in the type scale appears exactly once, here. Base is the iPhone
 * scale in 01-design-spec.md § 1.2, extended with the phone values in
 * 04-swift-ios-app.md § 2 for screens the prototype only shows on desktop.
 */
object Type {

    // ── Editorial — Newsreader ─────────────────────────────────────────────

    /** Brief headline: 31 / 1.16 / -0.02em */
    val briefHeadline = serif(31.0, 1.16, -0.02, Palette.ink)

    /** Brief body prose: 17.5 / 1.68 */
    val briefBody = serif(17.5, 1.68, color = Palette.inkBody)

    /** The closing line, italic. */
    val briefCloser = serif(17.5, 1.68, color = Palette.muted, italic = true)

    /** Brief item title: 18 / 1.32 / -0.01em */
    val itemTitle = serif(18.0, 1.32, -0.01, Palette.ink)

    /** Resurfaced + recall-prompt titles: 17–18 / 1.34–1.45 */
    fun cardTitle(size: Double = 18.0) = serif(size, 1.4, color = Palette.ink)

    /** Page title — Library, Past briefs, Ask, Settings: 30 / -0.022em */
    val pageTitle = serif(30.0, tracking = -0.022, color = Palette.ink)

    /** Detail h1: 29 / 1.16 / -0.022em */
    val detailTitle = serif(29.0, 1.16, -0.022, Palette.ink)

    /** Detail summary: 18 / 1.62 */
    val detailSummary = serif(18.0, 1.62, color = Palette.inkSoft)

    /** Library row title: 17 / 1.34 */
    val rowTitle = serif(17.0, 1.34, color = Palette.inkSoft)

    /** Connection title: 16 / 1.34 */
    val connectionTitle = serif(16.0, 1.34, color = Palette.inkSoft)

    /** Ask answer paragraph: 18 / 1.68 */
    val askAnswer = serif(18.0, 1.68, color = Palette.inkSoft)

    // ── UI — Instrument Sans ───────────────────────────────────────────────

    /**
     * The workhorse label of this design, used ~30×: 10.5 / 0.14em / uppercase,
     * faint — or ochre when the section deserves emphasis (The idea,
     * Connections, Resurfaced, Ask answer). Callers uppercase the string.
     */
    fun eyebrow(color: Color = Palette.faint) = ui(10.5, tracking = 0.14, color = color)

    /**
     * Library row summary: 14 / 1.55. Deliberately close in weight to the
     * title — you scan the idea, not the headline.
     */
    val rowSummary = ui(14.0, 1.55, color = Palette.muted)

    /** Brief item summary: 13.5 / 1.55 */
    val itemSummary = ui(13.5, 1.55, color = Palette.muted2)

    /** Body copy inside cards: 13.5 / 1.55 */
    fun cardBody(color: Color = Palette.inkBody) = ui(13.5, 1.55, color = color)

    /** Metadata: 12–12.5 */
    fun meta(color: Color = Palette.faint) = ui(12.5, color = color)

    /** Settings row title: 15, medium */
    val settingsTitle = ui(15.0, color = Palette.ink, weight = FontWeight.Medium)

    /** The state label on a row — New / Reviewed / Read / Unread. */
    fun stateLabel(color: Color) = ui(10.5, tracking = 0.1, color = color)
}
