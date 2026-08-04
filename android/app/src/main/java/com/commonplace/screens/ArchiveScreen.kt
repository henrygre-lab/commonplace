package com.commonplace.screens

import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.commonplace.Store
import com.commonplace.components.Hairline
import com.commonplace.components.TopBar
import com.commonplace.components.rise
import com.commonplace.components.tap
import com.commonplace.design.Palette
import com.commonplace.design.Type
import com.commonplace.design.serif
import com.commonplace.design.ui

/**
 * 01-design-spec.md § 3.6. Reached from the brief's "All briefs" link and pushed
 * onto the Brief stack — Past briefs is not a tab.
 */
@Composable
fun ArchiveScreen(
    store: Store,
    onOpenBrief: (Int) -> Unit = {},
    onBack: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    Column(
        modifier
            .fillMaxSize()
            .background(Palette.ground)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 22.dp)
            .padding(top = 4.dp, bottom = (46 + 56).dp)
            // The spec calls for the archive to fade in as one block.
            .rise(shown = true, delayMillis = 0),
    ) {
        TopBar("Brief", onBack)
        Spacer(Modifier.height(10.dp))

        BasicText("Past briefs", style = Type.pageTitle)
        Spacer(Modifier.height(6.dp))
        BasicText(
            "${store.archiveCount} briefs since ${store.archiveSince} · " +
                "${store.totalIdeas} ideas passed through them",
            style = ui(13.5, color = Palette.muted3),
        )
        Spacer(Modifier.height(26.dp))

        store.briefs.forEachIndexed { index, brief ->
            val read = store.isRead(brief.no)
            val current = index == 0
            Column(
                Modifier
                    .fillMaxWidth()
                    // The current brief's row is filled.
                    .background(if (current) Palette.rowHover else Color.Transparent)
                    .tap { onOpenBrief(brief.no) }
                    .padding(vertical = 20.dp, horizontal = if (current) 12.dp else 0.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    BasicText(brief.dateShort, style = serif(17.0, color = Palette.inkSoft))
                    Spacer(Modifier.width(8.dp))
                    BasicText("No. ${brief.no}", style = ui(11.5, color = Palette.faintest))
                    Spacer(Modifier.weight(1f))
                    BasicText(
                        if (read) "READ" else "UNREAD",
                        style = Type.stateLabel(if (read) Palette.fainter else Palette.ochre),
                    )
                }
                Spacer(Modifier.height(8.dp))
                BasicText(
                    brief.headline,
                    style = serif(19.0, 1.34, color = if (read) Palette.muted else Palette.ink),
                )
                Spacer(Modifier.height(6.dp))
                BasicText(brief.lede, style = ui(13.5, 1.56, color = Palette.muted3))
                Spacer(Modifier.height(6.dp))
                BasicText(
                    "${brief.itemIds.size + 1} ideas",
                    style = ui(11.5, color = Palette.faintest),
                )
            }
            Hairline()
        }

        Spacer(Modifier.height(26.dp))
        BasicText(
            "Briefs older than ninety days are summarised into your monthly digest.",
            style = ui(12.5, color = Palette.fainter),
        )
    }
}
