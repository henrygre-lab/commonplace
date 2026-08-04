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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.commonplace.AskAnswer
import com.commonplace.Store
import com.commonplace.components.AvatarCircle
import com.commonplace.components.Eyebrow
import com.commonplace.components.Hairline
import com.commonplace.components.PulsingDot
import com.commonplace.components.tap
import com.commonplace.design.Palette
import com.commonplace.design.Type
import com.commonplace.design.serif
import com.commonplace.design.ui
import kotlinx.coroutines.delay

/** 01-design-spec.md § 3.7 — a question answered only from what you saved. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AskScreen(
    store: Store,
    onOpenIdea: (Int) -> Unit = {},
    modifier: Modifier = Modifier,
) {
    var query by remember { mutableStateOf("") }
    var pending by remember { mutableStateOf<String?>(null) }
    var answer by remember { mutableStateOf<AskAnswer?>(null) }
    var focused by remember { mutableStateOf(false) }

    // The 0.9s retrieval beat is the whole point of the thinking state.
    LaunchedEffect(pending) {
        val q = pending ?: return@LaunchedEffect
        answer = null
        delay(900)
        answer = store.answer(q)
        pending = null
    }

    val run: (String) -> Unit = { text ->
        val q = text.trim()
        if (q.isNotEmpty()) {
            query = q
            pending = q
        }
    }

    Column(
        modifier
            .fillMaxSize()
            .background(Palette.ground)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 22.dp)
            .padding(top = 18.dp, bottom = (46 + 56).dp),
    ) {
        Eyebrow("Ask your library")
        Spacer(Modifier.height(12.dp))
        BasicText(
            "Six years of saves. Ask it something.",
            style = serif(30.0, 1.15, -0.022, Palette.ink),
        )
        Spacer(Modifier.height(22.dp))

        Row(verticalAlignment = Alignment.CenterVertically) {
            val shape = RoundedCornerShape(10.dp)
            Box(
                Modifier
                    .weight(1f)
                    .background(Palette.surface, shape)
                    .border(1.dp, if (focused) Palette.ochreLine else Palette.line, shape)
                    .padding(horizontal = 14.dp, vertical = 12.dp),
            ) {
                if (query.isEmpty()) {
                    BasicText(
                        "What have I saved about…",
                        style = serif(18.0, color = Palette.fainter),
                    )
                }
                // Asking is writing — Newsreader in the field.
                BasicTextField(
                    value = query,
                    onValueChange = { query = it },
                    textStyle = serif(18.0, color = Palette.ink),
                    singleLine = true,
                    cursorBrush = SolidColor(Palette.ochre),
                    keyboardActions = KeyboardActions { run(query) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .onFocusChanged { focused = it.isFocused },
                )
            }
            Spacer(Modifier.width(10.dp))
            Box(
                Modifier
                    .background(Palette.ink, RoundedCornerShape(10.dp))
                    .tap { run(query) }
                    .padding(horizontal = 20.dp, vertical = 14.dp),
            ) {
                BasicText(
                    "Ask",
                    style = ui(14.0, color = Palette.onDark, weight = FontWeight.Medium),
                )
            }
        }
        Spacer(Modifier.height(14.dp))

        // With no model behind it, the chips are the primary path — all four
        // return a good answer.
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(7.dp),
            verticalArrangement = Arrangement.spacedBy(7.dp),
        ) {
            Store.askSuggestions.forEach { suggestion ->
                Box(
                    Modifier
                        .background(Palette.chip, CircleShape)
                        .tap { run(suggestion) }
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                ) {
                    BasicText(suggestion, style = ui(12.5, color = Palette.muted))
                }
            }
        }
        Spacer(Modifier.height(32.dp))

        // One slot, so the thinking state cannot overlap the answer while the
        // two transitions cross.
        if (pending != null) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                PulsingDot()
                Spacer(Modifier.width(11.dp))
                BasicText(
                    "Reading ${store.totalIdeas} summaries…",
                    style = ui(13.5, color = Palette.muted3),
                )
            }
        } else {
            AnimatedVisibility(answer != null, enter = fadeIn(), exit = fadeOut()) {
                answer?.let { Answer(store, it, onOpenIdea) }
            }
        }
    }
}

@Composable
private fun Answer(store: Store, answer: AskAnswer, onOpenIdea: (Int) -> Unit) {
    val sources = store.hydrate(answer.ids)

    Column {
        // The label wraps to two lines at this measure, so the hairline sits
        // beneath it rather than beside it.
        Eyebrow(answer.label, accent = true)
        Spacer(Modifier.height(10.dp))
        Hairline(Palette.line)
        Spacer(Modifier.height(16.dp))

        answer.paras.forEach { para ->
            BasicText(para, style = Type.askAnswer)
            Spacer(Modifier.height(16.dp))
        }

        if (sources.isNotEmpty()) {
            Spacer(Modifier.height(14.dp))
            Eyebrow("Drawn from ${sources.size} ${if (sources.size == 1) "idea" else "ideas"} you saved")
            Spacer(Modifier.height(10.dp))
            Hairline(Palette.line)

            sources.forEach { source ->
                Row(
                    Modifier
                        .fillMaxWidth()
                        .tap { onOpenIdea(source.id) }
                        .padding(vertical = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    AvatarCircle(source.initials, size = 26.dp)
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        BasicText(source.title, style = Type.connectionTitle)
                        BasicText(
                            "${source.author} · saved ${source.date}",
                            style = ui(12.5, color = Palette.faint),
                        )
                    }
                }
                Hairline()
            }
        }

        Spacer(Modifier.height(22.dp))
        BasicText(
            "Answers are drawn only from what you saved. Nothing here is invented.",
            style = ui(12.5, color = Palette.fainter),
        )
    }
}
