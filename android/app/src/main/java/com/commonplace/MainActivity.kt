package com.commonplace

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.rememberNavController
import com.commonplace.components.TabBar
import com.commonplace.components.ToastView
import com.commonplace.design.Palette
import com.commonplace.screens.OnboardingScreen

private const val KEY_ONBOARDED = "hasOnboarded"

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Light system bars, always. The theme disables force-dark; this makes
        // the bars themselves warm paper rather than the platform default.
        val ground = Palette.ground.toArgb()
        val sunk = Palette.groundSunk.toArgb()
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.light(ground, ground),
            navigationBarStyle = SystemBarStyle.light(sunk, sunk),
        )
        super.onCreate(savedInstanceState)

        setContent {
            val store = rememberStore()
            val density = LocalDensity.current
            CompositionLocalProvider(
                // The iPhone app clamps Dynamic Type at .large because this
                // design's optical sizes break at accessibility scales, and
                // portfolio screenshots are taken at default size. Same here.
                LocalDensity provides Density(density.density, fontScale = 1f),
                LocalStore provides store,
            ) {
                AppRoot(store)
            }
        }
    }
}

/**
 * The shell — the counterpart of `RootView` in CommonplaceApp.swift.
 *
 * Onboarding runs before the shell on first launch and can be replayed from
 * Settings, exactly as on iPhone. The tab bar overlays the content rather than
 * sitting beside it, which is why each screen carries its own bottom padding for
 * the 56dp the bar occupies.
 */
@Composable
private fun AppRoot(store: Store) {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("commonplace", Context.MODE_PRIVATE) }
    // The iPhone app persists this in @AppStorage; this is the same idea.
    var onboarded by remember { mutableStateOf(prefs.getBoolean(KEY_ONBOARDED, false)) }

    if (!onboarded) {
        OnboardingScreen(
            onFinish = {
                prefs.edit().putBoolean(KEY_ONBOARDED, true).apply()
                onboarded = true
            },
            modifier = Modifier.statusBarsPadding(),
        )
        return
    }

    val navController = rememberNavController()
    val tab = navController.currentTab()

    Box(
        Modifier
            .fillMaxSize()
            .background(Palette.ground),
    ) {
        CommonplaceNavHost(
            navController = navController,
            store = store,
            onReplayOnboarding = { onboarded = false },
            modifier = Modifier.fillMaxSize().statusBarsPadding(),
        )

        TabBar(
            selected = tab,
            modifier = Modifier.align(Alignment.BottomCenter),
            onSelect = navController::switchTab,
        )

        AnimatedVisibility(
            visible = store.toast != null,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier
                .align(Alignment.BottomCenter)
                // Clear of the 56dp bar, as on iPhone.
                .padding(bottom = 96.dp),
        ) {
            ToastView(store.toast.orEmpty())
        }
    }
}
