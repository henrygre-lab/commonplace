package com.commonplace.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.commonplace.components.CardSurface
import com.commonplace.components.Eyebrow
import com.commonplace.components.Hairline
import com.commonplace.components.TagChip
import com.commonplace.components.tap
import com.commonplace.design.Palette
import com.commonplace.design.serif
import com.commonplace.design.ui
import kotlin.random.Random
import kotlinx.coroutines.delay

/**
 * 01-design-spec.md § 3.1 — three full-screen steps, no chrome beyond the
 * wordmark. The OAuth is faked with a 0.9s delay and the backfill runs on a
 * timer, because this app never talks to a server.
 */
@Composable
fun OnboardingScreen(onFinish: () -> Unit, modifier: Modifier = Modifier) {
    var step by remember { mutableIntStateOf(0) }
    var connecting by remember { mutableStateOf(false) }
    var progress by remember { mutableFloatStateOf(0f) }

    LaunchedEffect(connecting) {
        if (!connecting) return@LaunchedEffect
        delay(900)
        connecting = false
        step = 2
    }

    LaunchedEffect(step) {
        if (step != 2) return@LaunchedEffect
        progress = 0f
        while (progress < 100f) {
            delay(220)
            progress = minOf(100f, progress + 4f + Random.nextFloat() * 5f)
        }
    }

    Box(modifier.fillMaxSize().background(Palette.ground)) {
        Row(
            Modifier.align(Alignment.TopCenter).padding(top = 40.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(Modifier.size(7.dp).background(Palette.ochre, CircleShape))
            Spacer(Modifier.width(9.dp))
            BasicText("Commonplace", style = serif(19.0, color = Palette.ink))
        }

        Box(Modifier.fillMaxSize().padding(horizontal = 24.dp)) {
            when (step) {
                0 -> Pitch { step = 1 }
                1 -> Consent(connecting) { connecting = true }
                else -> Backfill(progress, onFinish)
            }
        }
    }
}

@Composable
private fun Pitch(onNext: () -> Unit) {
    Centred {
        Eyebrow("A second brain for your X bookmarks")
        Spacer(Modifier.height(20.dp))
        BasicText(
            "Your bookmarks are a library nobody ever catalogued.",
            style = serif(36.0, 1.12, -0.022, Palette.ink).copy(textAlign = TextAlign.Center),
        )
        Spacer(Modifier.height(18.dp))
        BasicText(
            "Commonplace reads everything you save on X, extracts the idea inside it, " +
                "and brings the right ones back to you each morning.",
            style = serif(17.0, 1.62, color = Palette.muted).copy(textAlign = TextAlign.Center),
        )
        Spacer(Modifier.height(34.dp))
        Box(
            Modifier
                .clip(CircleShape)
                .background(Palette.ochre)
                .tap(onClick = onNext)
                .padding(horizontal = 30.dp, vertical = 14.dp),
        ) {
            BasicText(
                "Get started",
                style = ui(15.0, color = Palette.onOchre, weight = FontWeight.Medium),
            )
        }
    }
}

private val PERMISSIONS = listOf(
    "Read your bookmarks" to "Including your full history, backfilled once on setup.",
    "Never post, follow, or message" to "We ask for no write access at all.",
    "Summaries stay yours" to "Export or delete everything in one click.",
)

@Composable
private fun Consent(connecting: Boolean, onConnect: () -> Unit) {
    Centred {
        BasicText(
            "Connect your X account",
            style = serif(30.0, 1.18, -0.02, Palette.ink).copy(textAlign = TextAlign.Center),
        )
        Spacer(Modifier.height(8.dp))
        BasicText(
            "One connection. Read-only. Revoke it whenever you like.",
            style = ui(14.0, 1.6, color = Palette.muted).copy(textAlign = TextAlign.Center),
        )
        Spacer(Modifier.height(24.dp))

        CardSurface(padding = 20.dp) {
            Column {
                PERMISSIONS.forEachIndexed { i, (title, desc) ->
                    Row(
                        Modifier.padding(vertical = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        Box(
                            Modifier
                                .padding(top = 7.dp)
                                .size(6.dp)
                                .background(
                                    if (i == 0) Palette.ochre else Palette.permDot,
                                    CircleShape,
                                ),
                        )
                        Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                            BasicText(
                                title,
                                style = ui(14.0, color = Palette.ink, weight = FontWeight.Medium),
                            )
                            BasicText(desc, style = ui(13.0, 1.5, color = Palette.muted3))
                        }
                    }
                    if (i < PERMISSIONS.lastIndex) Hairline(Palette.lineFaint)
                }
            }
        }
        Spacer(Modifier.height(22.dp))

        Box(
            Modifier
                .fillMaxWidth()
                .background(Palette.ink, RoundedCornerShape(10.dp))
                .tap(enabled = !connecting, onClick = onConnect)
                .padding(vertical = 15.dp),
            contentAlignment = Alignment.Center,
        ) {
            BasicText(
                if (connecting) "Authorising…" else "Connect X account",
                style = ui(15.0, color = Palette.onDark, weight = FontWeight.Medium),
            )
        }
        Spacer(Modifier.height(14.dp))
        BasicText("Signed in as @samrieber", style = ui(12.5, color = Palette.faint))
    }
}

private val THEME_CHIPS = listOf(
    "Business", "Leverage", "Health", "Psychology", "Writing", "Pricing", "Attention", "Career",
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun Backfill(progress: Float, onFinish: () -> Unit) {
    val busy = progress < 100f
    val width by animateFloatAsState(minOf(1f, progress / 100f), tween(350), label = "backfill")

    Centred {
        Eyebrow("Backfilling your archive")
        Spacer(Modifier.height(12.dp))
        BasicText(
            if (busy) "1,284 bookmarks found. Reading them now." else "Your library is ready.",
            style = serif(32.0, 1.15, -0.02, Palette.ink).copy(textAlign = TextAlign.Center),
        )
        Spacer(Modifier.height(28.dp))

        Box(
            Modifier
                .fillMaxWidth()
                .height(4.dp)
                .clip(CircleShape)
                .background(Palette.line),
        ) {
            Box(
                Modifier
                    .fillMaxHeight()
                    .fillMaxWidth(width)
                    .background(Palette.ochre),
            )
        }
        Spacer(Modifier.height(12.dp))

        Row(Modifier.fillMaxWidth()) {
            BasicText(
                if (busy) {
                    "Summarising ${((progress / 100f) * 1284).toInt()} of 1,284"
                } else {
                    "All 1,284 bookmarks summarised"
                },
                style = ui(13.0, color = Palette.muted3),
            )
            Spacer(Modifier.weight(1f))
            BasicText(
                "${minOf(100f, progress).toInt()}%",
                style = ui(13.0, color = Palette.muted3),
            )
        }
        Spacer(Modifier.height(28.dp))

        CardSurface {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Eyebrow("Emerging themes")
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(7.dp),
                    verticalArrangement = Arrangement.spacedBy(7.dp),
                ) {
                    THEME_CHIPS.forEach { TagChip(it, size = 12.5) }
                }
            }
        }
        Spacer(Modifier.height(24.dp))

        Box(
            Modifier
                .fillMaxWidth()
                .background(
                    if (busy) Palette.line else Palette.ochre,
                    RoundedCornerShape(10.dp),
                )
                .tap(enabled = !busy, onClick = onFinish)
                .padding(vertical = 15.dp),
            contentAlignment = Alignment.Center,
        ) {
            BasicText(
                if (busy) "Processing…" else "Enter your library",
                style = ui(
                    15.0,
                    color = if (busy) Palette.fainter else Palette.onOchre,
                    weight = FontWeight.Medium,
                ),
            )
        }
    }
}

/** Each step is centred in the screen with the wordmark floating above it. */
@Composable
private fun Centred(content: @Composable ColumnScope.() -> Unit) {
    Column(
        Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
        content = content,
    )
}
