package com.commonplace.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.commonplace.Store
import com.commonplace.components.AvatarCircle
import com.commonplace.components.CardSurface
import com.commonplace.components.Eyebrow
import com.commonplace.components.Hairline
import com.commonplace.components.OutlineButton
import com.commonplace.components.PaperToggle
import com.commonplace.components.PulsingDot
import com.commonplace.components.SegmentedPills
import com.commonplace.design.Palette
import com.commonplace.design.Type
import com.commonplace.design.serif
import com.commonplace.design.ui

/**
 * 01-design-spec.md § 3.8. Every control is optimistic and immediate — there is
 * no Save button anywhere in the product.
 */
@Composable
fun SettingsScreen(
    store: Store,
    onReplayOnboarding: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    Column(
        modifier
            .fillMaxSize()
            .background(Palette.ground)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 22.dp)
            .padding(top = 18.dp, bottom = (46 + 56).dp),
    ) {
        BasicText("Settings", style = Type.pageTitle)
        Spacer(Modifier.height(28.dp))

        // ── Daily brief ────────────────────────────────────────────────────
        SectionHeader("Daily brief")

        SettingsRow("Delivery time", "Your brief is written an hour before it arrives.", stacked = true) {
            SegmentedPills(
                options = listOf("06:00", "07:00", "08:00", "19:00").map { it to it },
                selection = store.settings.time,
                onSelect = { store.settings = store.settings.copy(time = it) },
            )
        }
        SettingsRow("Frequency", "Fewer briefs mean longer ones.", stacked = true) {
            SegmentedPills(
                options = listOf("Daily", "Weekdays", "Weekly").map { it to it },
                selection = store.settings.freq,
                onSelect = { store.settings = store.settings.copy(freq = it) },
            )
        }
        SettingsRow("Email the brief", "Arrives as plain text, no images, no tracking.") {
            PaperToggle(store.settings.email) { store.settings = store.settings.copy(email = it) }
        }
        SettingsRow("Push notification", "One a day, at delivery time only.") {
            PaperToggle(store.settings.push) { store.settings = store.settings.copy(push = it) }
        }
        SettingsRow(
            "Include a recall prompt",
            "One question per brief about something you saved earlier.",
            last = true,
        ) {
            PaperToggle(store.settings.spaced) { store.settings = store.settings.copy(spaced = it) }
        }

        // ── Connected account ──────────────────────────────────────────────
        Spacer(Modifier.height(34.dp))
        SectionHeader("Connected account")

        CardSurface(padding = 20.dp) {
            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    AvatarCircle("SR", size = 38.dp, large = true)
                    Spacer(Modifier.width(13.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        BasicText(
                            "@samrieber",
                            style = ui(14.5, color = Palette.ink, weight = FontWeight.Medium),
                        )
                        BasicText(
                            "X · read-only · connected 4 March",
                            style = ui(12.5, color = Palette.faint),
                        )
                    }
                    Spacer(Modifier.weight(1f))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        PulsingDot(color = Palette.sync, periodMillis = 2400)
                        Spacer(Modifier.width(7.dp))
                        BasicText("Syncing", style = ui(12.5, color = Palette.muted2))
                    }
                }
                Spacer(Modifier.height(18.dp))
                Hairline(Palette.lineFaint)
                Row(
                    Modifier.padding(top = 18.dp),
                    horizontalArrangement = Arrangement.spacedBy(26.dp),
                ) {
                    Stat("Bookmarks", store.totalIdeas)
                    Stat("Summarised", store.totalIdeas)
                    Stat("Last sync", store.syncedAgo)
                }
                Spacer(Modifier.height(16.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlineButton("Resync now") { store.flash("Resync queued") }
                    OutlineButton("Disconnect", danger = true) {}
                }
            }
        }

        // ── Your data ──────────────────────────────────────────────────────
        Spacer(Modifier.height(34.dp))
        SectionHeader("Your data")

        SettingsRow("Export summaries and notes", "Markdown, one file per idea. Yours to keep.") {
            OutlineButton("Export") { store.flash("Exported to Files") }
        }
        SettingsRow(
            "Replay onboarding",
            "For walking someone through the setup flow.",
            last = true,
        ) {
            OutlineButton("Replay", onClick = onReplayOnboarding)
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Eyebrow(title)
        Hairline(Palette.line)
    }
}

/**
 * A wide control (the segmented pills) drops beneath the label rather than
 * squeezing beside it — at phone width there is no room for both.
 */
@Composable
private fun SettingsRow(
    title: String,
    description: String,
    last: Boolean = false,
    stacked: Boolean = false,
    control: @Composable () -> Unit,
) {
    Column {
        if (stacked) {
            Column(
                Modifier.padding(vertical = 18.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                RowLabel(title, description)
                Row(Modifier.horizontalScroll(rememberScrollState())) { control() }
            }
        } else {
            Row(
                Modifier.fillMaxWidth().padding(vertical = 18.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f)) { RowLabel(title, description) }
                Spacer(Modifier.width(18.dp))
                control()
            }
        }
        if (!last) Hairline(Palette.lineFaint)
    }
}

@Composable
private fun RowLabel(title: String, description: String) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        BasicText(title, style = Type.settingsTitle)
        BasicText(description, style = ui(13.0, 1.5, color = Palette.muted3))
    }
}

@Composable
private fun Stat(label: String, value: String) {
    Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
        BasicText(label.uppercase(), style = ui(10.5, tracking = 0.12, color = Palette.fainter))
        BasicText(value, style = serif(21.0, color = Palette.ink))
    }
}
