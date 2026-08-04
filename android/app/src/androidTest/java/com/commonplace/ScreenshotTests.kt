package com.commonplace

import android.content.Context
import android.graphics.Bitmap
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Captures the portfolio screenshots listed in `04-swift-ios-app.md` § 7 and
 * asserts each screen really rendered its content on the way past — the same
 * job as ios/CommonplaceUITests/ScreenshotTests.swift.
 *
 * PNGs land in the app's external files directory on the device. Pull them with:
 *
 *     adb shell run-as com.commonplace.app ls files/shots
 *     adb pull /sdcard/Android/data/com.commonplace.app/files/shots android/Screenshots
 */
@RunWith(AndroidJUnit4::class)
class ScreenshotTests {

    @get:Rule
    val rule = createAndroidComposeRule<MainActivity>()

    private val instrumentation = InstrumentationRegistry.getInstrumentation()

    private val outputDir: File by lazy {
        File(instrumentation.targetContext.getExternalFilesDir(null), "shots").apply { mkdirs() }
    }

    /** Onboarding state is persisted, so each test decides where it starts. */
    private fun setOnboarded(value: Boolean) {
        instrumentation.targetContext
            .getSharedPreferences("commonplace", Context.MODE_PRIVATE)
            .edit().putBoolean("hasOnboarded", value).commit()
    }

    private fun capture(name: String) {
        rule.waitForIdle()
        // The whole screen including the system bars, matching the iPhone set.
        val shot: Bitmap = instrumentation.uiAutomation.takeScreenshot()
        File(outputDir, "$name.png").outputStream().use {
            shot.compress(Bitmap.CompressFormat.PNG, 100, it)
        }
        shot.recycle()
    }

    @Test
    fun capturePortfolioScreens() {
        setOnboarded(true)
        rule.activityRule.scenario.recreate()

        // 1 — Brief, at the headline. The staggered entrance has settled.
        rule.onNodeWithText(
            "Three of last week's saves are the same idea in different clothes.",
        ).assertExists()
        rule.onNodeWithText("Nothing else this week needs you today.")
            .assertExists() // written content, not filler
        capture("01-brief-headline")

        // 2 — Brief, scrolled to the resurfaced card.
        rule.onNodeWithText("Read the summary").performScrollTo()
        capture("02-brief-resurfaced")

        // 3 — Library.
        rule.onNodeWithText("LIBRARY").performClick()
        rule.onNodeWithText("Library").assertExists()
        // The display constants are deliberate in this portfolio build.
        assertTrue(
            "library subtitle should show the display constant, not a real count",
            rule.onAllNodes(hasText("1,284 ideas", substring = true))
                .fetchSemanticsNodes().isNotEmpty(),
        )
        capture("03-library")

        // 4 — Library grouped by Theme.
        rule.onNodeWithText("Theme").performClick()
        rule.onNodeWithText("Business & pricing").assertExists()
        capture("04-library-theme")

        // 5 — Detail, with Connections visible.
        rule.onNodeWithText("Permissionless leverage is still unclaimed.").performClick()
        rule.onNodeWithText("THE IDEA").assertExists()
        // "Argues the opposite" is the feature — it must render, in its own colour.
        rule.onNodeWithText("ARGUES THE OPPOSITE").performScrollTo().assertExists()
        capture("05-detail-connections")

        // 6 — Ask, with an answer.
        rule.onNodeWithText("ASK").performClick()
        rule.onNodeWithText("What have I saved about pricing strategy?").performClick()
        rule.waitUntil(timeoutMillis = 5_000) {
            rule.onAllNodes(hasText("ACROSS 3 SAVES ABOUT PRICING"))
                .fetchSemanticsNodes().isNotEmpty()
        }
        capture("06-ask-answer")

        // 7 — Settings.
        rule.onNodeWithText("SETTINGS").performClick()
        rule.onNodeWithText("Settings").assertExists()
        rule.onNodeWithText("@samrieber").assertExists()
        capture("07-settings")

        // 8 — Past briefs, reached from the brief header rather than a tab.
        rule.onNodeWithText("BRIEF").performClick()
        // The Brief tab comes back exactly where it was left — still scrolled to
        // the resurfaced card from step 2 — so the header link has to be
        // scrolled back into view before it can be tapped.
        rule.onNodeWithText("All briefs").performScrollTo().performClick()
        // Captured before asserting: if the archive did not open, the PNG shows
        // what did, which is far more use than the assertion message alone.
        capture("08-archive")
        rule.onNodeWithText("Past briefs").assertExists()
    }

    /** The onboarding flow is its own recording; capture it separately. */
    @Test
    fun captureOnboarding() {
        setOnboarded(false)
        rule.activityRule.scenario.recreate()

        rule.onNodeWithText("Your bookmarks are a library nobody ever catalogued.").assertExists()
        capture("09-onboarding-pitch")

        rule.onNodeWithText("Get started").performClick()
        rule.onNodeWithText("Connect your X account").assertExists()
        capture("10-onboarding-consent")

        rule.onNodeWithText("Connect X account").performClick()
        rule.waitUntil(timeoutMillis = 5_000) {
            rule.onAllNodes(hasText("BACKFILLING YOUR ARCHIVE"))
                .fetchSemanticsNodes().isNotEmpty()
        }
        capture("11-onboarding-backfill")

        // The CTA unlocks only when the backfill completes.
        rule.waitUntil(timeoutMillis = 30_000) {
            rule.onAllNodes(hasText("Enter your library"))
                .fetchSemanticsNodes().isNotEmpty()
        }
        capture("12-onboarding-ready")
    }
}
