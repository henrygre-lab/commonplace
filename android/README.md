# Commonplace — Android app (portfolio)

The Jetpack Compose build — start at the [root README](../README.md) for what
Commonplace is and the rules all the apps share.

**This app never talks to a server.** It ships the seed bundled, every
interaction works, and it exists to be screenshotted and screen-recorded — the
same brief as the [iPhone app](../ios/README.md).

```bash
./gradlew assembleDebug          # APK → app/build/outputs/apk/debug/
./gradlew installDebug           # onto a running emulator or device
```

No Android Studio required. The toolchain is Homebrew-installable:

```bash
brew install --cask android-commandlinetools
brew install gradle              # only to regenerate the wrapper; builds use ./gradlew
sdkmanager --install "platform-tools" "platforms;android-36" "build-tools;36.0.0"
```

`local.properties` points Gradle at the SDK and is git-ignored — create it with
`sdk.dir=/opt/homebrew/share/android-commandlinetools` on a fresh clone.

To run it, headless:

```bash
sdkmanager --install "system-images;android-36;google_apis;arm64-v8a" "emulator"
avdmanager create avd -n commonplace -k "system-images;android-36;google_apis;arm64-v8a" -d pixel_8
emulator -avd commonplace -no-window -gpu swiftshader_indirect &
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.commonplace.app/com.commonplace.MainActivity
adb exec-out screencap -p > shot.png
```

**A new AVD asks for a 10–12 GB userdata partition and fails to boot if the disk
cannot spare it**, with `FATAL | Not enough space to create userdata partition`.
Set `disk.dataPartition.size=3G` in `~/.android/avd/<name>.avd/config.ini` — the
app needs nothing like the default.

## Where this stands

**Complete.** All seven screens plus the three-step onboarding are built and
verified running on an Android 16 emulator, and `Screenshots/` holds the twelve
captures the instrumented test produces — the same set as the iPhone app,
including the six that `04 § 7` asks for.

The shell is a custom bottom bar over per-tab navigation graphs, which preserve
each tab's scroll position and back stack across switches.

## Screenshots

```bash
./gradlew assembleDebug assembleDebugAndroidTest
adb install -r -t app/build.nosync/outputs/apk/debug/app-debug.apk
adb install -r -t app/build.nosync/outputs/apk/androidTest/debug/app-debug-androidTest.apk
adb shell am instrument -w com.commonplace.app.test/androidx.test.runner.AndroidJUnitRunner
adb pull /sdcard/Android/data/com.commonplace.app/files/shots/. Screenshots/
```

**Do not use `./gradlew connectedDebugAndroidTest` for this.** It uninstalls the
app when it finishes, and the PNGs live in the app's external files directory —
so they are deleted along with it and there is nothing left to pull. Running the
instrumentation directly leaves the app in place.

`ScreenshotTests` asserts each screen really rendered its content on the way
past — that the brief's closer is present, that the library subtitle shows the
display constant rather than a real count, that `ARGUES THE OPPOSITE` appears in
Connections. It captures each shot *before* asserting, so a failure leaves a PNG
of whatever actually rendered.

Not yet built: the six screens, the custom bottom bar, navigation, and the
screenshot test.

## Layout

```
app/src/main/
  AndroidManifest.xml            portrait only, forced-light theme
  res/font/                      the five OFL .ttf, lowercase resource names
  res/values/themes.xml          force-dark disabled — see below
  java/com/commonplace/
    MainActivity.kt              @main; edge-to-edge, font scale pinned, onboarding gate
    Nav.kt                       type-safe routes, one graph per tab
    Store.kt                     all state and all mutations
    Models.kt                    Bookmark, Brief, Relation, AskAnswer
    design/Palette.kt            every colour, named
    design/Type.kt               every text style, and the metrics corrections
    components/                  Primitives.kt, TabBar.kt
    screens/                     one file per screen
app/src/androidTest/             drives the app to capture Screenshots/
licenses/                        SIL OFL 1.1 for both families
```

Each file is a direct port of its counterpart under `ios/Commonplace/`, with the
same names and the same ordering. If one changes, change both.

## Things that will bite you

**The display numbers are deliberately fake.** `1,284 ideas`, `142 briefs`,
`89 unreviewed` and the tag counts are constants on `Store`, *not*
`bookmarks.size`. A portfolio build has to look like a product in real use. The
web app does the exact opposite and shows real counts — see
`web/src/lib/store.tsx`, where `useCounts()` derives every number. Do not "fix"
these; the difference between the apps is intentional.

**There is no `Seed.json` in this directory, on purpose.** Gradle adds the
iPhone app's resources folder as an asset source:

```kotlin
sourceSets["main"].assets.srcDir("../../ios/Commonplace/Resources")
```

so both platforms read the same file and cannot drift. Adding a copy here would
fork the corpus — `node tools/check-content.mjs` fails if that line disappears or
if a second `Seed.json` shows up.

**Do not apply the `kotlin-android` plugin.** AGP 9 provides Kotlin support
itself and applying it alongside is a hard error. That is also why there is no
`kotlinOptions`/`jvmTarget` block: AGP owns the Kotlin toolchain now.

**There is no Material dependency, deliberately.** This design has no Material
colour roles, no elevation and no ripples, so screens are built from Compose
`foundation` and `BasicText`. Reaching for `material3` would make it easy to
introduce chrome the design forbids — the bottom bar is a plain `Row`, not a
`NavigationBar`. Ripples must be replaced with the `rowHover` fill.

**Two corrections in `Type.kt` make text measure correctly** —
`includeFontPadding = false` and `LineHeightStyle(Center, None)`. Without them
Compose adds legacy padding and nothing lines up with `01-design-spec.md`. With
them, `lineHeight` behaves like CSS `line-height`, which is the unit the spec is
written in, and `letterSpacing` takes `em` directly. This is the one place
Compose is *easier* than SwiftUI, which has to convert to a gap between lines.

**Two Gradle failures that look like code errors and are not.** Both come from
interrupted builds, which a nearly-full disk makes likely:

- `reached end of stream after reading 0 bytes` — a corrupt configuration cache.
  It fails *during configuration*, so no task runs and there is no compiler error
  to read. `rm -rf .gradle`.
- `Type … is defined multiple times: …/Foo 2.class, …/Foo.class` — a stale
  macOS `" 2"` duplicate left in `app/build`. `rm -rf app/build`.

When checking a build from a script, read Gradle's own exit code. Piping its
output through `head` closes the pipe and masks the status, which will report a
failed build as passing.

**Dark mode is not supported and force-dark is disabled.** Several OEM skins will
otherwise invert an app that never opted in, and this palette is warm paper — an
inversion is a different design. There is no `values-night/`, the theme parent is
not `DayNight`, and nothing calls `isSystemInDarkTheme()`.
