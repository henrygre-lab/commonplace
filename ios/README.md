# Commonplace — iPhone app (portfolio)

The SwiftUI build — start at the [root README](../README.md) for what
Commonplace is and the rules both apps share.

**This app never talks to a server.** It ships the seed bundled, every
interaction works, and it exists to be screenshotted and screen-recorded.

```bash
brew install xcodegen          # once
xcodegen generate              # regenerate Commonplace.xcodeproj after adding files
open Commonplace.xcodeproj

# build + capture the portfolio screenshots
xcodebuild -project Commonplace.xcodeproj -scheme Commonplace \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' test
```

`Commonplace.xcodeproj` is generated from `project.yml` — edit the YAML, not the
project file.

## Where this stands

All seven screens plus the three-step onboarding are built and verified running
in the simulator. `Screenshots/` holds the twelve captures produced by the UI
test, including the six that `04 § 7` asks for.

## Layout

```
project.yml                    the source of truth for the Xcode project
Commonplace/
  CommonplaceApp.swift         @main, RootView, the custom tab bar
  Store.swift                  @Observable — all state and all mutations
  Models.swift                 Bookmark, Brief, Relation, AskAnswer
  Design/
    Palette.swift              every colour, named
    Typography.swift           every text style as a modifier
    Fonts/                     Newsreader + Instrument Sans .ttf
  Components/Primitives.swift  Eyebrow, AvatarCircle, TagChip, SegmentedPills,
                               PaperToggle, CardSurface, TopBar, Toast, …
  Screens/                     one file per screen
  Resources/Seed.json          GENERATED — the written content
CommonplaceUITests/            drives the app to capture Screenshots/
```

## Things that will bite you

**The display numbers are deliberately fake.** `1,284 ideas`, `142 briefs`,
`89 unreviewed` and the sidebar tag counts are constants on `Store`, *not*
`bookmarks.count`. A portfolio build has to look like a product in real use.
The web app does the exact opposite and shows real counts — see
`web/src/lib/store.tsx`, where `useCounts()` derives every number. Do not "fix"
these — the difference between the two apps is intentional.

**`Resources/Seed.json` is generated** by `tools/extract-ios-seed.mjs`. The prose
is written content, not filler, and it was extracted programmatically so the em
dashes, `·` separators and names like Sørensen and Nyström are byte-exact. Do not
paraphrase it or hand-edit it. `node tools/check-content.mjs` verifies it still
matches the web copy exactly.

**The Newsreader PostScript names are not what you would guess.** Google Fonts
serves an optical-size instance, so the faces register as
`Newsreader16pt16pt-Regular` and `Newsreader16pt16pt-Italic`. Instrument Sans is
normal (`InstrumentSans-Regular/-Medium/-SemiBold`). `Font.serif(_:)` and
`Font.ui(_:_:)` in `Typography.swift` hide this. Custom fonts do not respond
reliably to `.weight()`, which is why each weight resolves to its own face.

**Detail, Archive and past briefs hide the system navigation bar** and draw the
prototype's `← Library` row inline via `TopBar`. iOS 26 gives toolbar items a
glass background and lets content scroll under them; neither belongs in a warm
paper design, and the back label was being truncated to "Li…".

**Dark mode is off on purpose.** `UIUserInterfaceStyle: Light` in the plist. A
dark inversion of this palette is a different design and out of scope.

## Recording the deliverables

`04 § 7` wants three screen recordings and one 25s flow. Before recording:

```bash
xcrun simctl status_bar booted override --time "9:41" \
  --batteryState charged --batteryLevel 100 --cellularBars 4
```

Record at 1× and scale in post — 3× recordings look soft when scaled down. The
three moments worth recording are the brief's staggered arrival, swipe-to-review
in the library, and asking a question and watching the answer rise.

To replay onboarding without deleting the app, use the Replay row in Settings.
