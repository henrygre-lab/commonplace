package com.commonplace.screens

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.commonplace.Bookmark
import com.commonplace.Filter
import com.commonplace.GroupBy
import com.commonplace.Store
import com.commonplace.components.AvatarCircle
import com.commonplace.components.CoreStar
import com.commonplace.components.Hairline
import com.commonplace.components.PaperTextField
import com.commonplace.components.SegmentedPills
import com.commonplace.components.TagChip
import com.commonplace.components.tap
import com.commonplace.design.Palette
import com.commonplace.design.Type
import com.commonplace.design.serif
import com.commonplace.design.ui
import kotlin.math.abs
import kotlinx.coroutines.launch

/**
 * The library — 01-design-spec.md § 3.4, the desktop three-column grid collapsed
 * into a single scannable stack.
 */
@Composable
fun LibraryScreen(
    store: Store,
    onOpenIdea: (Int) -> Unit = {},
    modifier: Modifier = Modifier,
) {
    // `buckets` re-runs the filter, the grouping and (for themes) the sort.
    // Bind it once per render rather than touching it in both the empty check
    // and the loop.
    val buckets = store.buckets

    LazyColumn(
        modifier
            .fillMaxSize()
            .background(Palette.ground),
        contentPadding = PaddingValues(
            start = 22.dp,
            end = 22.dp,
            top = 18.dp,
            bottom = (46 + 56).dp,
        ),
    ) {
        item {
            BasicText("Library", style = Type.pageTitle)
            Spacer(Modifier.height(6.dp))
            // Display constants, deliberately — this is a portfolio build and
            // the library has to look lived-in.
            BasicText(
                "${store.totalIdeas} ideas · ${store.unreviewedCount} unreviewed · " +
                    "synced ${store.syncedAgo} ago",
                style = ui(13.5, color = Palette.muted3),
            )
            Spacer(Modifier.height(20.dp))

            PaperTextField(
                value = store.query,
                placeholder = "Search ideas",
                onValueChange = { store.query = it },
            )
            Spacer(Modifier.height(12.dp))

            Row(
                Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                SegmentedPills(
                    options = Filter.entries.map { it to it.label },
                    selection = store.filter,
                    onSelect = { store.filter = it },
                )
                SegmentedPills(
                    options = GroupBy.entries.map { it to it.label },
                    selection = store.groupBy,
                    onSelect = { store.groupBy = it },
                )
            }
            Spacer(Modifier.height(12.dp))

            TagRow(store)
            Spacer(Modifier.height(4.dp))
        }

        if (buckets.isEmpty()) {
            item { EmptyLibrary() }
        } else {
            buckets.forEach { bucket ->
                if (store.groupBy != GroupBy.None) {
                    item(key = "h-${bucket.label}") { BucketHeader(bucket) }
                }
                items(bucket.items, key = { it.id }) { item ->
                    BookmarkRow(store, item) { onOpenIdea(item.id) }
                    Hairline()
                }
            }
        }
    }
}

/** The desktop sidebar's tag list becomes a horizontally scrolling row. */
@Composable
private fun TagRow(store: Store) {
    Row(
        Modifier.horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(7.dp),
    ) {
        store.tagList.forEach { tag ->
            val on = store.activeTag == tag.name
            Row(
                Modifier
                    .background(if (on) Palette.ochreTint else Palette.chip, CircleShape)
                    // Tapping an active tag clears it — toggle, not radio.
                    .tap { store.activeTag = if (on) null else tag.name }
                    .padding(horizontal = 11.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(Modifier.size(5.dp).background(Palette.tagHue(tag.name).fg, CircleShape))
                BasicText(
                    tag.name,
                    style = ui(13.0, color = if (on) Palette.ochreDeep else Palette.muted),
                )
                BasicText("${tag.count}", style = ui(11.5, color = Palette.faintest))
            }
        }
    }
}

@Composable
private fun BucketHeader(bucket: Store.Bucket) {
    Row(
        Modifier.fillMaxWidth().padding(top = 30.dp, bottom = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        BasicText(bucket.label, style = serif(15.0, color = Palette.inkBody))
        Spacer(Modifier.width(12.dp))
        Box(Modifier.weight(1f)) { Hairline() }
        Spacer(Modifier.width(12.dp))
        BasicText(
            "${bucket.items.size} ${if (bucket.items.size == 1) "idea" else "ideas"}",
            style = ui(11.5, color = Palette.faintest),
        )
    }
}

@Composable
private fun EmptyLibrary() {
    Column(
        Modifier.fillMaxWidth().padding(vertical = 70.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        BasicText("Nothing here yet.", style = serif(22.0, color = Palette.ink))
        BasicText(
            "Try a broader search, or clear the filters.",
            style = ui(13.5, color = Palette.muted3),
        )
    }
}

/**
 * A library row, with the swipe actions that the desktop `e` and `f` keyboard
 * shortcuts become on a phone: swipe right to review, left to mark core.
 */
@Composable
private fun BookmarkRow(store: Store, item: Bookmark, onClick: () -> Unit) {
    val scope = rememberCoroutineScope()
    val offsetX = remember { Animatable(0f) }
    val threshold = with(LocalDensity.current) { 78.dp.toPx() }
    val limit = with(LocalDensity.current) { 120.dp.toPx() }
    val x = offsetX.value

    Box(Modifier.fillMaxWidth()) {
        // The action revealed behind the row, coloured by swipe direction.
        if (x != 0f) {
            Row(
                Modifier
                    .matchParentSize()
                    .background(if (x > 0) Palette.ochre else Palette.ochreTint)
                    .padding(horizontal = 18.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                if (x > 0) {
                    BasicText(
                        if (item.reviewed) "Unreview" else "Mark reviewed",
                        style = ui(12.5, color = Palette.onOchre, weight = FontWeight.Medium),
                    )
                } else {
                    Spacer(Modifier.weight(1f))
                    BasicText(
                        if (item.core) "✦ Remove core" else "✦ Core",
                        style = ui(12.5, color = Palette.ochreDeep, weight = FontWeight.Medium),
                    )
                }
            }
        }

        Column(
            Modifier
                .fillMaxWidth()
                .graphicsLayer { translationX = x }
                .background(Palette.ground)
                .tap(onClick = onClick)
                .pointerInputSwipe(
                    onDrag = { delta ->
                        scope.launch {
                            offsetX.snapTo((offsetX.value + delta).coerceIn(-limit, limit))
                        }
                    },
                    onEnd = {
                        val settled = offsetX.value
                        scope.launch {
                            offsetX.animateTo(0f, tween(180))
                            if (abs(settled) >= threshold) {
                                if (settled > 0) store.toggleReviewed(item.id)
                                else store.toggleCore(item.id)
                            }
                        }
                    },
                )
                .padding(vertical = 20.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                AvatarCircle(item.initials, size = 26.dp)
                Spacer(Modifier.width(8.dp))
                BasicText(
                    item.author,
                    style = ui(12.5, color = Palette.ink, weight = FontWeight.Medium),
                )
                Spacer(Modifier.width(6.dp))
                BasicText("· ${item.date}", style = ui(12.0, color = Palette.faint))
                Spacer(Modifier.weight(1f))
                BasicText(
                    if (item.reviewed) "REVIEWED" else "NEW",
                    style = Type.stateLabel(if (item.reviewed) Palette.reviewed else Palette.ochre),
                )
                Spacer(Modifier.width(6.dp))
                CoreStar(item.core)
            }
            Spacer(Modifier.height(9.dp))
            BasicText(item.title, style = Type.rowTitle)
            Spacer(Modifier.height(6.dp))
            BasicText(item.summary, style = Type.rowSummary)
            Spacer(Modifier.height(10.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                item.tags.forEach { TagChip(it) }
            }
        }
    }
}

private fun Modifier.pointerInputSwipe(
    onDrag: (Float) -> Unit,
    onEnd: () -> Unit,
) = this.then(
    Modifier.pointerInput(Unit) {
        detectHorizontalDragGestures(
            onDragEnd = onEnd,
            onDragCancel = onEnd,
            onHorizontalDrag = { change, delta ->
                change.consume()
                onDrag(delta)
            },
        )
    },
)
