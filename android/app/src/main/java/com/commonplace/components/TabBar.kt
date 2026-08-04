package com.commonplace.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.commonplace.Tab
import com.commonplace.design.Palette
import com.commonplace.design.Type

/**
 * The bottom tab bar — 04-swift-ios-app.md § 3.
 *
 * Custom rather than a `NavigationBar`, for the same reason the iPhone app does
 * not use `TabView`'s chrome: the platform bar brings its own fill, elevation
 * and selection indicator, all of which are the wrong colour and the wrong idea
 * here. And no icons — the words are the design.
 *
 * Past briefs is deliberately not a tab; it is reached from the brief header.
 */
@Composable
fun TabBar(
    selected: Tab,
    modifier: Modifier = Modifier,
    onSelect: (Tab) -> Unit,
) {
    Column(modifier.fillMaxWidth().background(Palette.groundSunk)) {
        Hairline(Palette.lineSidebar)
        Row(Modifier.fillMaxWidth().navigationBarsPadding()) {
            Tab.entries.forEach { tab ->
                val on = tab == selected
                Box(
                    Modifier
                        .weight(1f)
                        .height(56.dp)
                        .tap { onSelect(tab) }
                        .semantics { this.selected = on },
                    contentAlignment = Alignment.Center,
                ) {
                    BasicText(
                        tab.label.uppercase(),
                        // 10.5 / 0.14em / uppercase — the same metrics as the
                        // eyebrow, which is why it reuses that style.
                        style = Type.eyebrow(if (on) Palette.ochre else Palette.muted3),
                    )
                }
            }
        }
    }
}
