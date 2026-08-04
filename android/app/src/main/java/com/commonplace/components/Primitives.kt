package com.commonplace.components

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.commonplace.design.Palette
import com.commonplace.design.Type
import com.commonplace.design.ui
import kotlin.math.max

/**
 * Tap with no ripple.
 *
 * Material's default indication is a ripple, and this design has none — pressed
 * state is a `rowHover` fill where it exists at all. Every clickable in the app
 * goes through here so a ripple can never creep back in.
 */
@Composable
fun Modifier.tap(enabled: Boolean = true, onClick: () -> Unit): Modifier {
    val interaction = remember { MutableInteractionSource() }
    return clickable(
        interactionSource = interaction,
        indication = null,
        enabled = enabled,
        onClick = onClick,
    )
}

// ── Eyebrow ────────────────────────────────────────────────────────────────

/**
 * The workhorse label of this design — used ~30×. Uppercase, 10.5 / 0.14em,
 * faint; or ochre when the section deserves emphasis.
 */
@Composable
fun Eyebrow(
    text: String,
    accent: Boolean = false,
    color: Color? = null,
    modifier: Modifier = Modifier,
) {
    BasicText(
        text = text.uppercase(),
        style = Type.eyebrow(color ?: if (accent) Palette.ochre else Palette.faint),
        modifier = modifier,
    )
}

/** Eyebrow + a hairline that takes the remaining width, with optional trailing. */
@Composable
fun SectionRule(
    label: String,
    accent: Boolean = false,
    modifier: Modifier = Modifier,
    trailing: @Composable () -> Unit = {},
) {
    Row(modifier, verticalAlignment = Alignment.CenterVertically) {
        Eyebrow(label, accent = accent)
        Spacer(Modifier.width(12.dp))
        Spacer(
            Modifier
                .weight(1f)
                .height(1.dp)
                .background(Palette.lineRow),
        )
        Spacer(Modifier.width(12.dp))
        trailing()
    }
}

// ── Hairline ───────────────────────────────────────────────────────────────

@Composable
fun Hairline(color: Color = Palette.lineRow, modifier: Modifier = Modifier) {
    Spacer(
        modifier
            .fillMaxWidth()
            .height(1.dp)
            .background(color),
    )
}

// ── AvatarCircle ───────────────────────────────────────────────────────────

@Composable
fun AvatarCircle(
    initials: String,
    size: Dp = 26.dp,
    large: Boolean = false,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier
            .size(size)
            .background(if (large) Palette.avatarLarge else Palette.avatar, CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        BasicText(
            text = initials,
            style = ui(
                size = max(9.0, size.value * 0.38),
                color = Palette.muted2,
                weight = FontWeight.SemiBold,
            ),
        )
    }
}

// ── TagChip ────────────────────────────────────────────────────────────────

@Composable
fun TagChip(
    name: String,
    size: Double = 11.5,
    onRemove: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    val hue = Palette.tagHue(name)
    Row(
        modifier
            .clip(CircleShape)
            .background(hue.bg)
            .then(if (onRemove != null) Modifier.tap { onRemove() } else Modifier)
            .padding(horizontal = 9.dp, vertical = 3.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        BasicText(name, style = ui(size, color = hue.fg))
        if (onRemove != null) {
            BasicText("×", style = ui(size, color = hue.fg.copy(alpha = 0.45f)))
        }
    }
}

// ── CardSurface — #FCFAF4 + 1dp #E4DDCE ────────────────────────────────────

/**
 * @param dashed the recall prompt is the only dashed edge in the product; it
 *   signals "not content, an exercise". Dashed cards have no fill.
 */
@Composable
fun CardSurface(
    modifier: Modifier = Modifier,
    radius: Dp = 14.dp,
    padding: Dp = 20.dp,
    dashed: Boolean = false,
    content: @Composable () -> Unit,
) {
    val shape = RoundedCornerShape(radius)
    Box(
        modifier
            .fillMaxWidth()
            .then(
                if (dashed) {
                    Modifier.drawBehind {
                        drawRoundRect(
                            color = Palette.lineStrong,
                            cornerRadius = CornerRadius(radius.toPx()),
                            style = Stroke(
                                width = 1.dp.toPx(),
                                pathEffect = PathEffect.dashPathEffect(
                                    floatArrayOf(4.dp.toPx(), 4.dp.toPx()),
                                ),
                            ),
                        )
                    }
                } else {
                    Modifier
                        .background(Palette.surface, shape)
                        .border(1.dp, Palette.line, shape)
                },
            )
            .padding(padding),
    ) {
        content()
    }
}

// ── Pill buttons ───────────────────────────────────────────────────────────

@Composable
fun PrimaryPillButton(
    title: String,
    filled: Boolean = true,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    Box(
        modifier
            .fillMaxWidth()
            .clip(CircleShape)
            .background(if (filled) Palette.ink else Palette.ochreTint)
            .tap(onClick = onClick)
            .padding(vertical = 14.dp),
        contentAlignment = Alignment.Center,
    ) {
        BasicText(
            title,
            style = ui(
                14.5,
                color = if (filled) Palette.onDark else Palette.ochreDeep,
                weight = FontWeight.Medium,
            ),
        )
    }
}

@Composable
fun OutlineButton(
    title: String,
    danger: Boolean = false,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    val shape = RoundedCornerShape(8.dp)
    Box(
        modifier
            .clip(shape)
            .border(1.dp, Palette.line, shape)
            .tap(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 9.dp),
    ) {
        BasicText(title, style = ui(13.0, color = if (danger) Palette.danger else Palette.muted))
    }
}

/** An inline ochre text link — "Read the summary", "Show me", "All briefs". */
@Composable
fun TextLink(
    title: String,
    size: Double = 13.0,
    weight: FontWeight = FontWeight.Medium,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    BasicText(
        title,
        style = ui(size, color = Palette.ochre, weight = weight),
        // Never below a 44dp hit target.
        modifier = modifier
            .tap(onClick = onClick)
            .heightIn(min = 44.dp)
            .wrapContentHeight(Alignment.CenterVertically),
    )
}

// ── SegmentedPills — custom, not a Material tab row ────────────────────────

/**
 * The active pill carries the one shadow this design permits besides the toast.
 */
@Composable
fun <T> SegmentedPills(
    options: List<Pair<T, String>>,
    selection: T,
    modifier: Modifier = Modifier,
    onSelect: (T) -> Unit,
) {
    Row(
        modifier
            .clip(RoundedCornerShape(9.dp))
            .background(Palette.segmentTrack)
            .padding(3.dp),
        horizontalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        options.forEach { (value, label) ->
            val on = value == selection
            Box(
                Modifier
                    .then(
                        if (on) {
                            Modifier.shadow(1.dp, RoundedCornerShape(7.dp), clip = false)
                        } else {
                            Modifier
                        },
                    )
                    .background(
                        if (on) Palette.segmentActive else Color.Transparent,
                        RoundedCornerShape(7.dp),
                    )
                    .tap { onSelect(value) }
                    .padding(horizontal = 12.dp, vertical = 6.dp),
            ) {
                BasicText(
                    label,
                    style = ui(13.0, color = if (on) Palette.ink else Palette.muted3),
                    // A pill label must never wrap — "07:00" broken across four
                    // lines is the fastest way to look unfinished.
                    maxLines = 1,
                    softWrap = false,
                )
            }
        }
    }
}

// ── Text fields ────────────────────────────────────────────────────────────

/**
 * One-line input on paper. Focus is an ochre border, matching the focus rail the
 * web app uses — every interactive element needs a visible focus state.
 */
@Composable
fun PaperTextField(
    value: String,
    placeholder: String,
    modifier: Modifier = Modifier,
    fill: Color = Palette.surface,
    radius: Dp = 8.dp,
    textStyle: TextStyle = ui(13.5, color = Palette.ink),
    onImeAction: () -> Unit = {},
    onValueChange: (String) -> Unit,
) {
    var focused by remember { mutableStateOf(false) }
    val shape = RoundedCornerShape(radius)
    BasicTextField(
        value = value,
        onValueChange = onValueChange,
        textStyle = textStyle,
        singleLine = true,
        cursorBrush = SolidColor(Palette.ochre),
        keyboardActions = KeyboardActions { onImeAction() },
        modifier = modifier
            .fillMaxWidth()
            .background(fill, shape)
            .border(1.dp, if (focused) Palette.ochreLine else Palette.line, shape)
            .padding(horizontal = 12.dp, vertical = 9.dp)
            .onFocusChanged { focused = it.isFocused },
        decorationBox = { inner ->
            if (value.isEmpty()) {
                BasicText(placeholder, style = textStyle.copy(color = Palette.fainter))
            }
            inner()
        },
    )
}

// ── SquareNavIcon — the 30dp step buttons on detail ────────────────────────

enum class ChevronDirection { Up, Down }

@Composable
fun SquareNavIcon(direction: ChevronDirection, modifier: Modifier = Modifier, onClick: () -> Unit) {
    val shape = RoundedCornerShape(7.dp)
    Box(
        modifier
            // Never below a 44dp hit target, though the face is 30.
            .size(44.dp)
            .tap(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Box(
            Modifier
                .size(30.dp)
                .background(Palette.surface, shape)
                .border(1.dp, Palette.line, shape),
            contentAlignment = Alignment.Center,
        ) {
            Canvas(Modifier.size(11.dp)) {
                val w = size.width
                val h = size.height * 0.55f
                val top = (size.height - h) / 2
                val path = Path().apply {
                    if (direction == ChevronDirection.Up) {
                        moveTo(0f, top + h); lineTo(w / 2, top); lineTo(w, top + h)
                    } else {
                        moveTo(0f, top); lineTo(w / 2, top + h); lineTo(w, top)
                    }
                }
                drawPath(
                    path,
                    color = Palette.muted3,
                    style = Stroke(width = 1.6.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round),
                )
            }
        }
    }
}

// ── TopBar ─────────────────────────────────────────────────────────────────

/**
 * The prototype's `← Library` row, drawn inline at the top of the scroll content
 * exactly as on desktop (01 § 3.5), rather than as a platform app bar — those
 * bring their own background and elevation, neither of which belongs here.
 */
@Composable
fun TopBar(
    backLabel: String,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
    trailing: @Composable () -> Unit = {},
) {
    Row(
        modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Row(
            Modifier
                // Never below a 44dp hit target.
                .height(44.dp)
                .tap(onClick = onBack),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BasicText("‹", style = ui(17.0, color = Palette.muted3))
            Spacer(Modifier.width(5.dp))
            BasicText(backLabel, style = ui(13.0, color = Palette.muted3))
        }
        Spacer(Modifier.weight(1f))
        trailing()
    }
}

// ── PaperToggle — 42×25 track ──────────────────────────────────────────────
//
// The platform Switch is Material green and would be the only wrong colour in
// the app.

@Composable
fun PaperToggle(isOn: Boolean, modifier: Modifier = Modifier, onToggle: (Boolean) -> Unit) {
    val knobOffset by animateDpAsState(if (isOn) 20.dp else 3.dp, tween(180), label = "knob")
    Box(
        modifier
            .size(width = 42.dp, height = 25.dp)
            .clip(CircleShape)
            .background(if (isOn) Palette.ochre else Palette.toggleOff)
            .tap { onToggle(!isOn) },
        contentAlignment = Alignment.CenterStart,
    ) {
        Box(
            Modifier
                .padding(start = knobOffset)
                .size(19.dp)
                .background(Palette.knob, CircleShape),
        )
    }
}

// ── Toast ──────────────────────────────────────────────────────────────────

@Composable
fun ToastView(message: String, modifier: Modifier = Modifier) {
    Box(
        modifier
            .clip(CircleShape)
            .background(Palette.ink)
            .padding(horizontal = 20.dp, vertical = 11.dp),
    ) {
        BasicText(message, style = ui(13.0, color = Palette.onDark))
    }
}

// ── PulsingDot — cpPulse, 1.1s, ease-in-out, infinite ──────────────────────

@Composable
fun PulsingDot(
    color: Color = Palette.ochre,
    size: Dp = 6.dp,
    periodMillis: Int = 1100,
    modifier: Modifier = Modifier,
) {
    val transition = rememberInfiniteTransition(label = "pulse")
    val alpha by transition.animateFloat(
        initialValue = 1f,
        targetValue = 0.35f,
        animationSpec = infiniteRepeatable(tween(periodMillis / 2), RepeatMode.Reverse),
        label = "pulseAlpha",
    )
    Box(
        modifier
            .size(size)
            .graphicsLayer { this.alpha = alpha }
            .background(color, CircleShape),
    )
}

// ── CoreStar — the ✦ core marker ───────────────────────────────────────────

@Composable
fun CoreStar(on: Boolean, modifier: Modifier = Modifier) {
    BasicText(
        "✦",
        style = ui(15.0, color = if (on) Palette.ochre else Palette.starOff),
        modifier = modifier,
    )
}

// ── The staggered entrance ─────────────────────────────────────────────────

/**
 * Fade and rise, used by the brief's five blocks at 0 / 60 / 140 / 220 / 300ms.
 *
 * This is the one piece of ceremony in the product: the brief should read as a
 * letter being set down, not a dashboard painting in. `04 § 4.1` calls it the
 * single most valuable twenty minutes in the app, because it is what makes a
 * screen recording feel like a product rather than a mockup.
 */
@Composable
fun Modifier.rise(shown: Boolean, delayMillis: Int): Modifier {
    val spec = tween<Float>(durationMillis = 550, delayMillis = delayMillis)
    val alpha by animateFloatAsState(if (shown) 1f else 0f, spec, label = "riseAlpha")
    val offsetY by animateDpAsState(
        targetValue = if (shown) 0.dp else 14.dp,
        animationSpec = tween(durationMillis = 550, delayMillis = delayMillis),
        label = "riseOffset",
    )
    return this.graphicsLayer {
        this.alpha = alpha
        this.translationY = offsetY.toPx()
    }
}
