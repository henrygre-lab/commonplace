package com.commonplace

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavController
import androidx.navigation.NavDestination.Companion.hasRoute
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.navigation
import androidx.navigation.toRoute
import com.commonplace.screens.ArchiveScreen
import com.commonplace.screens.AskScreen
import com.commonplace.screens.BriefScreen
import com.commonplace.screens.DetailScreen
import com.commonplace.screens.LibraryScreen
import com.commonplace.screens.SettingsScreen
import kotlinx.serialization.Serializable

/**
 * Navigation — the Compose counterpart of `Route` and `RootView` in
 * ios/Commonplace/CommonplaceApp.swift.
 *
 * Routes are type-safe rather than strings: each is a `@Serializable` object or
 * data class, so an argument that changes shape is a compile error instead of a
 * malformed URL discovered at runtime.
 */

// ── Tab graphs — one per tab, each owning its own back stack ───────────────

@Serializable object BriefGraph
@Serializable object LibraryGraph
@Serializable object AskGraph
@Serializable object SettingsGraph

// ── Destinations ───────────────────────────────────────────────────────────

@Serializable object BriefHome
@Serializable object LibraryHome
@Serializable object AskHome
@Serializable object SettingsHome

/** A past brief, pushed onto the Brief stack from the archive. */
@Serializable data class PastBrief(val no: Int)

/** Past briefs is not a tab — it is reached from the brief header. */
@Serializable object Archive

@Serializable data class Idea(val id: Int)

enum class Tab(val label: String, val graph: Any) {
    Brief("Brief", BriefGraph),
    Library("Library", LibraryGraph),
    Ask("Ask", AskGraph),
    Settings("Settings", SettingsGraph),
}

/**
 * Switching tabs saves the outgoing stack and restores the incoming one, so
 * leaving Library mid-scroll and coming back does not lose your place. This is
 * what the iPhone app gets from holding every `NavigationStack` alive at once.
 */
fun NavController.switchTab(tab: Tab) {
    navigate(tab.graph) {
        popUpTo(graph.findStartDestination().id) { saveState = true }
        launchSingleTop = true
        restoreState = true
    }
}

/** Which tab the current destination belongs to, whatever depth it is at. */
@Composable
fun NavHostController.currentTab(): Tab {
    val entry by currentBackStackEntryAsState()
    return Tab.entries.firstOrNull { tab ->
        entry?.destination?.hierarchy?.any { it.hasRoute(tab.graph::class) } == true
    } ?: Tab.Brief
}

@Composable
fun CommonplaceNavHost(
    navController: NavHostController,
    store: Store,
    onReplayOnboarding: () -> Unit,
    modifier: Modifier = Modifier,
) {
    NavHost(navController, startDestination = BriefGraph, modifier = modifier) {

        navigation<BriefGraph>(startDestination = BriefHome) {
            composable<BriefHome> {
                BriefScreen(
                    store = store,
                    onOpenIdea = { navController.navigate(Idea(it)) },
                    onOpenArchive = { navController.navigate(Archive) },
                )
            }
            composable<PastBrief> { entry ->
                BriefScreen(
                    store = store,
                    no = entry.toRoute<PastBrief>().no,
                    onOpenIdea = { navController.navigate(Idea(it)) },
                    onBack = { navController.popBackStack() },
                )
            }
            composable<Archive> {
                ArchiveScreen(
                    store = store,
                    onOpenBrief = { navController.navigate(PastBrief(it)) },
                    onBack = { navController.popBackStack() },
                )
            }
            ideaDestination(navController, store)
        }

        navigation<LibraryGraph>(startDestination = LibraryHome) {
            composable<LibraryHome> {
                LibraryScreen(store, onOpenIdea = { navController.navigate(Idea(it)) })
            }
            ideaDestination(navController, store)
        }

        navigation<AskGraph>(startDestination = AskHome) {
            composable<AskHome> {
                AskScreen(store, onOpenIdea = { navController.navigate(Idea(it)) })
            }
            ideaDestination(navController, store)
        }

        navigation<SettingsGraph>(startDestination = SettingsHome) {
            composable<SettingsHome> {
                SettingsScreen(store, onReplayOnboarding = onReplayOnboarding)
            }
        }
    }
}

/**
 * Detail is reachable from three tabs, and each pushes it onto its own stack —
 * so the destination is registered per graph rather than shared.
 */
private fun androidx.navigation.NavGraphBuilder.ideaDestination(
    navController: NavHostController,
    store: Store,
) {
    composable<Idea> { entry ->
        DetailScreen(
            store = store,
            id = entry.toRoute<Idea>().id,
            onOpenIdea = { navController.navigate(Idea(it)) },
            onBack = { navController.popBackStack() },
        )
    }
}
