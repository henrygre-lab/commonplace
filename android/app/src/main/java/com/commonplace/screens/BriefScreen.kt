package com.commonplace.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.commonplace.Bookmark
import com.commonplace.Brief
import com.commonplace.Store
import com.commonplace.components.AvatarCircle
import com.commonplace.components.CardSurface
import com.commonplace.components.Eyebrow
import com.commonplace.components.Hairline
import com.commonplace.components.PrimaryPillButton
import com.commonplace.components.TextLink
import com.commonplace.components.TopBar
import com.commonplace.components.rise
import com.commonplace.components.tap
import com.commonplace.design.Palette
import com.commonplace.design.Type
import com.commonplace.design.serif
import com.commonplace.design.ui

/**
 * The hero screen — 01-design-spec.md § 3.9, a port of ios/…/Screens/BriefView.swift.
 *
 * It arrives as staggered blocks so it reads as a letter being set down rather
 * than a dashboard painting in. That entrance is the one piece of ceremony in
 * the product, and it is what makes a screen recording feel like a product.
 *
 * @param no `null` is today's brief; a number is a past one opened from the archive.
 */
@Composable
fun BriefScreen(
    store: Store,
    no: Int? = null,
    onOpenIdea: (Int) -> Unit = {},
    onOpenArchive: () -> Unit = {},
    onBack: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val brief = remember(no, store.briefs) {
        if (no == null) store.briefs.firstOrNull() else store.briefs.firstOrNull { it.no == no }
    }

    var shown by remember { mutableStateOf(false) }
    // Arriving at a brief always closes the recall question.
    var promptOpen by remember(brief?.no) { mutableStateOf(false) }
    LaunchedEffect(brief?.no) { shown = true }

    Box(modifier.fillMaxSize().background(Palette.ground)) {
        if (brief == null) {
            BasicText(
                "There is no brief with that number.",
                style = Type.cardTitle(),
                modifier = Modifier.padding(24.dp),
            )
        } else {
            BriefContent(store, brief, no, shown, promptOpen, { promptOpen = true }, onOpenIdea, onOpenArchive, onBack)
        }
    }
}

@Composable
private fun BriefContent(
    store: Store,
    brief: Brief,
    no: Int?,
    shown: Boolean,
    promptOpen: Boolean,
    onRevealPrompt: () -> Unit,
    onOpenIdea: (Int) -> Unit,
    onOpenArchive: () -> Unit,
    onBack: () -> Unit,
) {
    val items = store.hydrate(brief.itemIds)
    val resurfaced = store.bookmark(brief.resId)
    val read = store.isRead(brief.no)

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 22.dp)
            .padding(top = if (no == null) 20.dp else 4.dp)
            // 46 of page bottom, plus the 56 the tab bar will occupy.
            .padding(bottom = (46 + 56).dp),
    ) {
        if (no != null) {
            TopBar("All briefs", onBack)
            Spacer(Modifier.height(10.dp))
        }

        // ── 1 · header rule ────────────────────────────────────────────────
        Row(
            Modifier.fillMaxWidth().rise(shown, delayMillis = 0),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(Modifier.size(6.dp).background(Palette.ochre, CircleShape))
            Spacer(Modifier.width(7.dp))
            Eyebrow(brief.shortDateLine)
            Spacer(Modifier.weight(1f))
            BasicText(
                brief.shortMins.uppercase(),
                style = Type.stateLabel(Palette.faintest),
            )
            // Past briefs is not a tab — it is reached from here and pushed onto
            // the Brief stack, exactly as on desktop.
            if (no == null) {
                Spacer(Modifier.width(12.dp))
                TextLink("All briefs", size = 12.5, onClick = onOpenArchive)
            }
        }
        Spacer(Modifier.height(26.dp))

        // ── 2 · headline ───────────────────────────────────────────────────
        BasicText(
            brief.headline,
            style = Type.briefHeadline,
            modifier = Modifier.rise(shown, delayMillis = 60),
        )
        Spacer(Modifier.height(20.dp))

        // ── 3 · prose ──────────────────────────────────────────────────────
        Column(
            Modifier.rise(shown, delayMillis = 140),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            brief.paras.forEach { BasicText(it, style = Type.briefBody) }
            BasicText(brief.closer, style = Type.briefCloser)
        }
        Spacer(Modifier.height(30.dp))

        // ── 4 · the grouped saves ──────────────────────────────────────────
        Column(Modifier.rise(shown, delayMillis = 220)) {
            Eyebrow(brief.sectionLabel)
            Spacer(Modifier.height(10.dp))
            Hairline(Palette.line)

            items.forEach { item ->
                BriefItem(item) { onOpenIdea(item.id) }
                Hairline(Palette.lineFaint)
            }
        }

        // ── 5 · resurfaced, 6 · recall, 7 · footer ─────────────────────────
        Column(Modifier.rise(shown, delayMillis = 300)) {
            if (resurfaced != null) {
                Spacer(Modifier.height(30.dp))
                CardSurface {
                    Column {
                        Eyebrow(brief.resLabelShort, accent = true)
                        Spacer(Modifier.height(10.dp))
                        BasicText(resurfaced.title, style = Type.cardTitle())
                        Spacer(Modifier.height(8.dp))
                        BasicText(resurfaced.summary, style = Type.itemSummary)
                        Spacer(Modifier.height(14.dp))
                        TextLink("Read the summary") { onOpenIdea(resurfaced.id) }
                    }
                }
            }

            if (store.settings.spaced) {
                Spacer(Modifier.height(26.dp))
                // The only dashed edge in the product: not content, an exercise.
                CardSurface(dashed = true) {
                    Column {
                        Eyebrow("One question before you go")
                        Spacer(Modifier.height(10.dp))
                        BasicText(
                            brief.promptQ,
                            style = serif(17.0, 1.45, color = Palette.ink),
                        )
                        Spacer(Modifier.height(14.dp))
                        if (promptOpen) {
                            BasicText(brief.promptA, style = Type.cardBody())
                        } else {
                            TextLink("Show me", onClick = onRevealPrompt)
                        }
                    }
                }
            }

            Spacer(Modifier.height(30.dp))
            PrimaryPillButton(
                title = if (read) "Brief read ✓" else "Mark brief as read",
                filled = !read,
            ) {
                store.toggleBriefRead(brief.no)
            }
            Spacer(Modifier.height(12.dp))
            BasicText(
                "Next brief tomorrow at ${store.settings.time}",
                style = ui(12.0, color = Palette.faint),
                modifier = Modifier.align(Alignment.CenterHorizontally),
            )
        }
    }
}

@Composable
private fun BriefItem(item: Bookmark, onClick: () -> Unit) {
    Column(
        Modifier
            .fillMaxWidth()
            .tap(onClick = onClick)
            .padding(vertical = 18.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            AvatarCircle(item.initials, size = 22.dp)
            Spacer(Modifier.width(8.dp))
            BasicText(item.author, style = ui(12.5, color = Palette.muted))
            Spacer(Modifier.width(8.dp))
            BasicText(item.date, style = ui(12.0, color = Palette.faintest))
        }
        Spacer(Modifier.height(8.dp))
        BasicText(item.title, style = Type.itemTitle)
        Spacer(Modifier.height(6.dp))
        BasicText(item.summary, style = Type.itemSummary)
    }
}

