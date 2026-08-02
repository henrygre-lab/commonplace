import SwiftUI

/// 01-design-spec.md § 3.8. Every control is optimistic and immediate — there
/// is no Save button anywhere in the product.
struct SettingsView: View {
    @Environment(Store.self) private var store
    let replayOnboarding: () -> Void

    var body: some View {
        @Bindable var store = store

        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("Settings").pageTitle().padding(.bottom, 28)

                // ── Daily brief ──────────────────────────────────────────
                sectionHeader("Daily brief")

                settingsRow("Delivery time", "Your brief is written an hour before it arrives.", stacked: true) {
                    SegmentedPills(
                        options: ["06:00", "07:00", "08:00", "19:00"].map { ($0, $0) },
                        selection: $store.settings.time
                    )
                }

                settingsRow("Frequency", "Fewer briefs mean longer ones.", stacked: true) {
                    SegmentedPills(
                        options: ["Daily", "Weekdays", "Weekly"].map { ($0, $0) },
                        selection: $store.settings.freq
                    )
                }

                settingsRow("Email the brief", "Arrives as plain text, no images, no tracking.") {
                    PaperToggle(isOn: $store.settings.email)
                }
                settingsRow("Push notification", "One a day, at delivery time only.") {
                    PaperToggle(isOn: $store.settings.push)
                }
                settingsRow(
                    "Include a recall prompt",
                    "One question per brief about something you saved earlier.",
                    last: true
                ) {
                    PaperToggle(isOn: $store.settings.spaced)
                }

                // ── Connected account ────────────────────────────────────
                sectionHeader("Connected account").padding(.top, 34)

                CardSurface(padding: EdgeInsets(top: 22, leading: 20, bottom: 22, trailing: 20)) {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(spacing: 13) {
                            AvatarCircle(initials: "SR", size: 38, large: true)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("@samrieber").font(.ui(14.5, .medium)).foregroundStyle(Palette.ink)
                                Text("X · read-only · connected 4 March")
                                    .font(.ui(12.5)).foregroundStyle(Palette.faint)
                            }
                            Spacer(minLength: 8)
                            HStack(spacing: 7) {
                                PulsingDot(colour: Palette.sync, period: 2.4)
                                Text("Syncing").font(.ui(12.5)).foregroundStyle(Palette.muted2)
                            }
                        }
                        .padding(.bottom, 18)

                        Hairline(colour: Palette.lineFaint)

                        HStack(alignment: .top, spacing: 26) {
                            stat("Bookmarks", store.totalIdeas)
                            stat("Summarised", store.totalIdeas)
                            stat("Last sync", store.syncedAgo)
                        }
                        .padding(.top, 18)
                        .padding(.bottom, 16)

                        HStack(spacing: 8) {
                            OutlineButton(title: "Resync now") { store.flash("Resync queued") }
                            OutlineButton(title: "Disconnect", danger: true) {}
                        }
                    }
                }

                // ── Your data ────────────────────────────────────────────
                sectionHeader("Your data").padding(.top, 34)

                settingsRow("Export summaries and notes", "Markdown, one file per idea. Yours to keep.") {
                    OutlineButton(title: "Export") { store.flash("Exported to Files") }
                }
                settingsRow("Replay onboarding", "For walking someone through the setup flow.", last: true) {
                    OutlineButton(title: "Replay", action: replayOnboarding)
                }
            }
            .padding(.horizontal, 22)
            .padding(.top, 18)
            .padding(.bottom, 46 + 56)
        }
        .scrollIndicators(.hidden)
        .background(Palette.ground)
    }

    private func sectionHeader(_ title: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Eyebrow(text: title)
            Hairline(colour: Palette.line)
        }
    }

    /// A wide control (the segmented pills) drops beneath the label rather than
    /// squeezing beside it — at phone width there is no room for both.
    private func settingsRow<Control: View>(
        _ title: String,
        _ desc: String,
        last: Bool = false,
        stacked: Bool = false,
        @ViewBuilder control: () -> Control
    ) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            let label = VStack(alignment: .leading, spacing: 4) {
                Text(title).settingsTitle()
                Text(desc)
                    .font(.ui(13)).lineHeight(13, 1.5)
                    .foregroundStyle(Palette.muted3)
                    .fixedSize(horizontal: false, vertical: true)
            }

            if stacked {
                VStack(alignment: .leading, spacing: 12) {
                    label
                    ScrollView(.horizontal, showsIndicators: false) {
                        control()
                    }
                    .scrollClipDisabled()
                }
                .padding(.vertical, 18)
            } else {
                HStack(alignment: .center, spacing: 18) {
                    label
                    Spacer(minLength: 0)
                    control()
                }
                .padding(.vertical, 18)
            }

            if !last { Hairline(colour: Palette.lineFaint) }
        }
    }

    private func stat(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(label.uppercased())
                .font(.ui(10.5)).tracking(1.26)
                .foregroundStyle(Palette.fainter)
            Text(value).font(.serif(21)).foregroundStyle(Palette.ink)
        }
    }
}
