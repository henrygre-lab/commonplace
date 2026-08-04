package com.commonplace.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.commonplace.Bookmark
import com.commonplace.Store
import com.commonplace.components.AvatarCircle
import com.commonplace.components.CardSurface
import com.commonplace.components.ChevronDirection
import com.commonplace.components.Eyebrow
import com.commonplace.components.Hairline
import com.commonplace.components.SectionRule
import com.commonplace.components.SquareNavIcon
import com.commonplace.components.TagChip
import com.commonplace.components.TopBar
import com.commonplace.components.tap
import com.commonplace.design.Palette
import com.commonplace.design.Type
import com.commonplace.design.serif
import com.commonplace.design.ui
import kotlinx.coroutines.delay

/** 01-design-spec.md § 3.5, stacked into a single column for the phone. */
@Composable
fun DetailScreen(
    store: Store,
    id: Int,
    onOpenIdea: (Int) -> Unit = {},
    onBack: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val item = store.bookmark(id)

    Box(modifier.fillMaxSize().background(Palette.ground)) {
        if (item == null) {
            BasicText(
                "That idea is not in your library.",
                style = Type.cardTitle(),
                modifier = Modifier.padding(24.dp),
            )
        } else {
            DetailContent(store, item, onOpenIdea, onBack)
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun DetailContent(
    store: Store,
    item: Bookmark,
    onOpenIdea: (Int) -> Unit,
    onBack: () -> Unit,
) {
    // All of this resets every time a new item opens.
    var origOpen by remember(item.id) { mutableStateOf(false) }
    var noteDraft by remember(item.id) { mutableStateOf(item.note) }
    var noteStatus by remember(item.id) { mutableStateOf("Saved automatically") }
    var tagDraft by remember(item.id) { mutableStateOf("") }

    // Every keystroke sets Saving…; a 600ms debounce then writes and settles to
    // Saved just now. There is never a Save button.
    LaunchedEffect(noteDraft, item.id) {
        if (noteDraft == item.note) return@LaunchedEffect
        noteStatus = "Saving…"
        delay(600)
        store.setNote(item.id, noteDraft)
        noteStatus = "Saved just now"
    }

    val related = store.related(item.id)

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 22.dp)
            .padding(top = 4.dp, bottom = (46 + 56).dp),
    ) {
        // ↑ ↓ step through the WHOLE corpus with wraparound, not the filtered
        // subset. Reading is browsing; filters are for finding.
        TopBar("Library", onBack) {
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                SquareNavIcon(ChevronDirection.Up) { onOpenIdea(store.step(item.id, -1)) }
                SquareNavIcon(ChevronDirection.Down) { onOpenIdea(store.step(item.id, 1)) }
            }
        }
        Spacer(Modifier.height(18.dp))

        SectionRule("The idea", accent = true) {
            BasicText("Saved ${item.date}", style = ui(12.0, color = Palette.faint))
        }
        Spacer(Modifier.height(16.dp))

        BasicText(item.title, style = Type.detailTitle)
        Spacer(Modifier.height(16.dp))
        BasicText(item.summary, style = Type.detailSummary)
        Spacer(Modifier.height(34.dp))

        // ── Key concepts, then Actionable — stacked, not side by side ──────
        Eyebrow("Key concepts")
        Spacer(Modifier.height(12.dp))
        Column(verticalArrangement = Arrangement.spacedBy(9.dp)) {
            item.concepts.forEach { concept ->
                Row(horizontalArrangement = Arrangement.spacedBy(9.dp)) {
                    BasicText("—", style = ui(14.0, color = Palette.ochreLine))
                    BasicText(concept, style = ui(14.0, 1.45, color = Palette.inkBody))
                }
            }
        }
        Spacer(Modifier.height(28.dp))

        Eyebrow("Actionable")
        Spacer(Modifier.height(12.dp))
        Column(verticalArrangement = Arrangement.spacedBy(11.dp)) {
            item.actions.forEachIndexed { i, action ->
                Row(horizontalArrangement = Arrangement.spacedBy(11.dp)) {
                    BasicText(
                        "${i + 1}",
                        style = serif(13.0, color = Palette.ochre),
                        modifier = Modifier.width(12.dp),
                    )
                    BasicText(action, style = ui(14.0, 1.5, color = Palette.inkBody))
                }
            }
        }
        Spacer(Modifier.height(28.dp))

        // ── The original post ──────────────────────────────────────────────
        Hairline(Palette.line)
        Row(
            Modifier
                .fillMaxWidth()
                .tap { origOpen = !origOpen }
                .padding(vertical = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(9.dp),
        ) {
            BasicText(if (origOpen) "▾" else "▸", style = ui(13.0, color = Palette.muted3))
            BasicText("Show the original post", style = ui(13.0, color = Palette.muted3))
        }

        AnimatedVisibility(origOpen, enter = fadeIn(), exit = fadeOut()) {
            Column {
                CardSurface {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            AvatarCircle(item.initials, size = 34.dp)
                            Spacer(Modifier.width(12.dp))
                            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                BasicText(
                                    item.author,
                                    style = ui(13.0, color = Palette.ink, weight = FontWeight.Medium),
                                )
                                BasicText(item.handle, style = ui(12.0, color = Palette.faint))
                            }
                        }
                        Spacer(Modifier.height(14.dp))
                        BasicText(item.original, style = ui(15.0, 1.68, color = Palette.inkSoft))
                        Spacer(Modifier.height(16.dp))
                        Hairline(Palette.lineFaint)
                        Row(
                            Modifier.fillMaxWidth().padding(top = 14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            BasicText(
                                "${item.likes} likes · ${item.reposts} reposts",
                                style = ui(12.5, color = Palette.faint),
                            )
                            Spacer(Modifier.weight(1f))
                            BasicText(
                                "Open on X",
                                style = ui(12.5, color = Palette.ochre, weight = FontWeight.Medium),
                            )
                        }
                    }
                }
                Spacer(Modifier.height(8.dp))
            }
        }

        // ── Connections — the reason is the product ────────────────────────
        if (related.isNotEmpty()) {
            Spacer(Modifier.height(34.dp))
            SectionRule("Connections", accent = true) {
                BasicText(
                    "${related.size} of ${store.connectionsTotal} ideas",
                    style = ui(12.0, color = Palette.faint),
                )
            }
            Spacer(Modifier.height(4.dp))

            related.forEach { (relation, bookmark) ->
                Column(
                    Modifier
                        .fillMaxWidth()
                        .tap { onOpenIdea(bookmark.id) }
                        .padding(vertical = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    // The 150px reason column does not fit on a phone, so the
                    // reason sits above the title.
                    Eyebrow(
                        relation.reason,
                        color = if (relation.disagrees) Palette.disagree else Palette.ochre,
                    )
                    BasicText(bookmark.title, style = Type.connectionTitle)
                    BasicText(
                        "${bookmark.author} · saved ${bookmark.date}",
                        style = ui(12.5, color = Palette.faint),
                    )
                }
                Hairline()
            }
        }

        // ── Tags ───────────────────────────────────────────────────────────
        Spacer(Modifier.height(28.dp))
        CardSurface {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Eyebrow("Tags")
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    item.tags.forEach { tag ->
                        TagChip(tag, size = 12.5, onRemove = { store.removeTag(item.id, tag) })
                    }
                }
                InsetField(
                    value = tagDraft,
                    placeholder = "Add a tag ⏎",
                    onValueChange = { tagDraft = it },
                    onSubmit = {
                        store.addTag(item.id, tagDraft)
                        tagDraft = ""
                    },
                )
            }
        }
        Spacer(Modifier.height(16.dp))

        // ── Your note ──────────────────────────────────────────────────────
        CardSurface {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Eyebrow("Your note")
                Box(
                    Modifier
                        .fillMaxWidth()
                        .background(Palette.surfaceInset, RoundedCornerShape(7.dp))
                        .padding(horizontal = 10.dp, vertical = 8.dp),
                ) {
                    if (noteDraft.isEmpty()) {
                        BasicText(
                            "What does this change for you?",
                            style = serif(14.0, color = Palette.fainter),
                        )
                    }
                    // Newsreader here — writing should feel like writing.
                    BasicTextField(
                        value = noteDraft,
                        onValueChange = { noteDraft = it },
                        textStyle = serif(14.0, 1.5, color = Palette.ink),
                        cursorBrush = SolidColor(Palette.ochre),
                        modifier = Modifier.fillMaxWidth().heightIn(min = 96.dp),
                    )
                }
                BasicText(noteStatus, style = ui(11.5, color = Palette.fainter))
            }
        }
        Spacer(Modifier.height(16.dp))

        // ── The two buttons ────────────────────────────────────────────────
        WideButton(
            label = if (item.reviewed) "Reviewed ✓" else "Mark as reviewed",
            fill = if (item.reviewed) Palette.ochreTint else Palette.ochre,
            textColor = if (item.reviewed) Palette.ochreDeep else Palette.onOchre,
            onClick = { store.toggleReviewed(item.id) },
        )
        Spacer(Modifier.height(8.dp))
        WideButton(
            label = if (item.core) "✦ Core idea" else "Mark as core",
            fill = Palette.surface,
            textColor = if (item.core) Palette.ochre else Palette.muted,
            bordered = true,
            onClick = { store.toggleCore(item.id) },
        )
    }
}

/** A field sunk into a card — one shade darker than the card it sits on. */
@Composable
private fun InsetField(
    value: String,
    placeholder: String,
    onValueChange: (String) -> Unit,
    onSubmit: () -> Unit,
) {
    val shape = RoundedCornerShape(7.dp)
    Box(
        Modifier
            .fillMaxWidth()
            .background(Palette.surfaceInset, shape)
            .border(1.dp, Palette.line, shape)
            .padding(horizontal = 11.dp, vertical = 8.dp),
    ) {
        if (value.isEmpty()) {
            BasicText(placeholder, style = ui(13.0, color = Palette.fainter))
        }
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            textStyle = ui(13.0, color = Palette.ink),
            singleLine = true,
            cursorBrush = SolidColor(Palette.ochre),
            keyboardActions = androidx.compose.foundation.text.KeyboardActions { onSubmit() },
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun WideButton(
    label: String,
    fill: androidx.compose.ui.graphics.Color,
    textColor: androidx.compose.ui.graphics.Color,
    bordered: Boolean = false,
    onClick: () -> Unit,
) {
    val shape = RoundedCornerShape(9.dp)
    Box(
        Modifier
            .fillMaxWidth()
            .background(fill, shape)
            .then(if (bordered) Modifier.border(1.dp, Palette.line, shape) else Modifier)
            .tap(onClick = onClick)
            .padding(vertical = 13.dp),
        contentAlignment = Alignment.Center,
    ) {
        BasicText(label, style = ui(14.0, color = textColor, weight = FontWeight.Medium))
    }
}
