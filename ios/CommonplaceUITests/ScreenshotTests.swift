import XCTest

/// Captures the six portfolio screenshots listed in 04-swift-ios-app.md § 7 and
/// asserts each screen actually rendered its content on the way past.
///
/// PNGs are written to the simulator's /tmp, which on the host is
/// ~/Library/Developer/CoreSimulator/Devices/<UDID>/data/tmp/shots/
final class ScreenshotTests: XCTestCase {

    private var app: XCUIApplication!
    private var outputDir: URL!

    override func setUpWithError() throws {
        continueAfterFailure = false

        // The runner is sandboxed, so this must be its own temporary directory.
        // The host finds the PNGs by searching the device's data container.
        outputDir = FileManager.default.temporaryDirectory.appendingPathComponent("shots", isDirectory: true)
        try? FileManager.default.createDirectory(at: outputDir, withIntermediateDirectories: true)
        print("SHOTS_DIR=\(outputDir.path)")

        app = XCUIApplication()
        app.launchArguments = ["-hasOnboarded", "YES"]
        app.launch()
    }

    private func capture(_ name: String) {
        let shot = XCUIScreen.main.screenshot()
        try? shot.pngRepresentation.write(to: outputDir.appendingPathComponent("\(name).png"))

        let attachment = XCTAttachment(screenshot: shot)
        attachment.name = name
        // Attachments default to deleteOnSuccess, which throws away exactly the
        // screenshots we are here to produce.
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    private func tapTab(_ label: String) {
        let tab = app.buttons[label]
        XCTAssertTrue(tab.waitForExistence(timeout: 5), "\(label) tab is missing")
        tab.tap()
    }

    func testCapturePortfolioScreens() throws {

        // 1 — Brief, at the headline. The staggered entrance has settled.
        XCTAssertTrue(
            app.staticTexts["Three of last week's saves are the same idea in different clothes."]
                .waitForExistence(timeout: 5),
            "brief headline missing"
        )
        XCTAssertTrue(app.staticTexts["Nothing else this week needs you today."].exists,
                      "the closer should be present — it is written content, not filler")
        capture("01-brief-headline")

        // 2 — Brief, scrolled to the resurfaced card.
        app.swipeUp(velocity: .slow)
        app.swipeUp(velocity: .slow)
        capture("02-brief-resurfaced")

        // 3 — Library.
        tapTab("LIBRARY")
        XCTAssertTrue(app.staticTexts["Library"].waitForExistence(timeout: 5), "library title missing")
        // The display constants are deliberate in this portfolio build.
        XCTAssertTrue(
            app.staticTexts.containing(NSPredicate(format: "label CONTAINS '1,284 ideas'")).count > 0,
            "library subtitle should show the display constant, not a real count"
        )
        capture("03-library")

        // 4 — Library grouped by Theme.
        let theme = app.buttons["Theme"]
        XCTAssertTrue(theme.waitForExistence(timeout: 3), "Theme pill missing")
        theme.tap()
        XCTAssertTrue(app.staticTexts["Business & pricing"].waitForExistence(timeout: 3),
                      "theme grouping did not produce family buckets")
        capture("04-library-theme")

        // 5 — Detail, with Connections visible.
        let row = app.buttons["row-1"]
        XCTAssertTrue(row.waitForExistence(timeout: 3), "library row 1 missing")
        row.tap()
        XCTAssertTrue(app.staticTexts["THE IDEA"].waitForExistence(timeout: 5), "detail eyebrow missing")
        app.swipeUp(velocity: .slow)
        app.swipeUp(velocity: .slow)
        // "Argues the opposite" is the feature — it must render, and in its own colour.
        XCTAssertTrue(app.staticTexts["ARGUES THE OPPOSITE"].waitForExistence(timeout: 3),
                      "the disagreeing connection is missing")
        capture("05-detail-connections")

        // 6 — Ask, with an answer.
        tapTab("ASK")
        let suggestion = app.buttons["What have I saved about pricing strategy?"]
        XCTAssertTrue(suggestion.waitForExistence(timeout: 5), "ask suggestion chip missing")
        suggestion.tap()
        XCTAssertTrue(
            app.staticTexts["ACROSS 3 SAVES ABOUT PRICING"].waitForExistence(timeout: 5),
            "the canned pricing answer did not resolve"
        )
        capture("06-ask-answer")

        // 7 — Settings.
        tapTab("SETTINGS")
        XCTAssertTrue(app.staticTexts["Settings"].waitForExistence(timeout: 5), "settings title missing")
        XCTAssertTrue(app.staticTexts["@samrieber"].exists, "connected account missing")
        capture("07-settings")

        // 8 — Past briefs, reached from the brief header rather than a tab.
        tapTab("BRIEF")
        let allBriefs = app.buttons["All briefs"]
        XCTAssertTrue(allBriefs.waitForExistence(timeout: 5), "All briefs link missing from the header")
        allBriefs.tap()
        XCTAssertTrue(app.staticTexts["Past briefs"].waitForExistence(timeout: 5), "archive did not push")
        capture("08-archive")
    }

    /// The onboarding flow is its own recording; capture it separately.
    func testCaptureOnboarding() throws {
        app.terminate()
        app = XCUIApplication()
        app.launchArguments = ["-hasOnboarded", "NO"]
        app.launch()

        XCTAssertTrue(
            app.staticTexts["Your bookmarks are a library nobody ever catalogued."]
                .waitForExistence(timeout: 5),
            "pitch headline missing"
        )
        capture("09-onboarding-pitch")

        app.buttons["Get started"].tap()
        XCTAssertTrue(app.staticTexts["Connect your X account"].waitForExistence(timeout: 3),
                      "consent step missing")
        capture("10-onboarding-consent")

        app.buttons["Connect X account"].tap()
        XCTAssertTrue(app.staticTexts["BACKFILLING YOUR ARCHIVE"].waitForExistence(timeout: 5),
                      "backfill step missing")
        capture("11-onboarding-backfill")

        // The CTA unlocks only when the backfill completes.
        let enter = app.buttons["Enter your library"]
        XCTAssertTrue(enter.waitForExistence(timeout: 20), "backfill never finished")
        capture("12-onboarding-ready")
    }
}
