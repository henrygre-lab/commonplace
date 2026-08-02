import SwiftUI

/// The hero screen — 01-design-spec.md § 3.9.
///
/// It arrives as staggered blocks so it reads as a letter being set down rather
/// than a dashboard painting in. This is the one piece of ceremony in the
/// product and it is what makes a screen recording feel like a product.
struct BriefView: View {
    @Environment(Store.self) private var store
    /// `nil` is today's brief; a number is a past one pushed from the archive.
    let no: Int?

    @State private var shown = false
    @State private var promptOpen = false

    private var brief: Brief? {
        guard let no else { return store.briefs.first }
        return store.briefs.first { $0.no == no }
    }

    var body: some View {
        Group {
            if let brief {
                content(brief)
            } else {
                Text("There is no brief with that number.")
                    .cardTitle()
                    .padding(24)
            }
        }
        .background(Palette.ground)
        .toolbar(.hidden, for: .navigationBar)
        // Arriving at a brief always closes the recall question.
        .task { promptOpen = false; shown = true }
    }

    @ViewBuilder
    private func content(_ brief: Brief) -> some View {
        let items = store.hydrate(brief.itemIds)
        let resurfaced = store.bookmark(brief.resId)
        let read = store.isRead(brief.no)

        ScrollView {
            VStack(alignment: .leading, spacing: 0) {

                if no != nil {
                    TopBar("All briefs").padding(.bottom, 10)
                }

                // ── 1 · header rule ──────────────────────────────────────
                HStack {
                    HStack(spacing: 7) {
                        Circle().fill(Palette.ochre).frame(width: 6, height: 6)
                        Eyebrow(text: brief.shortDateLine)
                    }
                    Spacer(minLength: 12)
                    Text(brief.shortMins.uppercased())
                        .font(.ui(10.5)).tracking(1.05)
                        .foregroundStyle(Palette.faintest)
                    // Past briefs is not a tab — it is reached from here and
                    // pushed onto the Brief stack, exactly as on desktop.
                    if no == nil {
                        NavigationLink(value: Route.archive) {
                            Text("All briefs")
                                .font(.ui(12.5))
                                .foregroundStyle(Palette.ochre)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.bottom, 26)
                .rise(shown, delay: 0)

                // ── 2 · headline ─────────────────────────────────────────
                Text(brief.headline)
                    .briefHeadline()
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.bottom, 20)
                    .rise(shown, delay: 0.06)

                // ── 3 · prose ────────────────────────────────────────────
                VStack(alignment: .leading, spacing: 16) {
                    ForEach(Array(brief.paras.enumerated()), id: \.offset) { _, p in
                        Text(p).briefBody().fixedSize(horizontal: false, vertical: true)
                    }
                    Text(brief.closer).briefCloser().fixedSize(horizontal: false, vertical: true)
                }
                .padding(.bottom, 30)
                .rise(shown, delay: 0.14)

                // ── 4 · the grouped saves ────────────────────────────────
                VStack(alignment: .leading, spacing: 0) {
                    Eyebrow(text: brief.sectionLabel)
                        .padding(.bottom, 10)
                    Hairline(colour: Palette.line)

                    ForEach(items) { item in
                        NavigationLink(value: Route.idea(item.id)) {
                            briefItem(item)
                        }
                        .buttonStyle(.plain)
                        Hairline(colour: Palette.lineFaint)
                    }
                }
                .rise(shown, delay: 0.22)

                // ── 5 · resurfaced, 6 · recall, 7 · footer ───────────────
                VStack(alignment: .leading, spacing: 0) {
                    if let resurfaced {
                        CardSurface {
                            VStack(alignment: .leading, spacing: 0) {
                                Eyebrow(text: brief.resLabelShort, accent: true)
                                    .padding(.bottom, 10)
                                Text(resurfaced.title)
                                    .cardTitle()
                                    .fixedSize(horizontal: false, vertical: true)
                                    .padding(.bottom, 8)
                                Text(resurfaced.summary)
                                    .itemSummary()
                                    .fixedSize(horizontal: false, vertical: true)
                                    .padding(.bottom, 14)
                                NavigationLink(value: Route.idea(resurfaced.id)) {
                                    Text("Read the summary")
                                        .font(.ui(13, .medium))
                                        .foregroundStyle(Palette.ochre)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.top, 30)
                    }

                    if store.settings.spaced {
                        // The only dashed edge in the product: not content, an exercise.
                        CardSurface(dashed: true) {
                            VStack(alignment: .leading, spacing: 0) {
                                Eyebrow(text: "One question before you go")
                                    .padding(.bottom, 10)
                                Text(brief.promptQ)
                                    .font(.serif(17)).lineHeight(17, 1.45)
                                    .foregroundStyle(Palette.ink)
                                    .fixedSize(horizontal: false, vertical: true)
                                    .padding(.bottom, 14)

                                if promptOpen {
                                    Text(brief.promptA)
                                        .cardBody()
                                        .fixedSize(horizontal: false, vertical: true)
                                        .transition(.opacity.combined(with: .offset(y: 6)))
                                } else {
                                    Button {
                                        withAnimation(.easeOut(duration: 0.3)) { promptOpen = true }
                                    } label: {
                                        Text("Show me")
                                            .font(.ui(13, .medium))
                                            .foregroundStyle(Palette.ochre)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                        .padding(.top, 26)
                    }

                    VStack(spacing: 12) {
                        PrimaryPillButton(
                            title: read ? "Brief read ✓" : "Mark brief as read",
                            filled: !read
                        ) {
                            store.toggleBriefRead(brief.no)
                        }
                        Text("Next brief tomorrow at \(store.settings.time)")
                            .font(.ui(12))
                            .foregroundStyle(Palette.faint)
                    }
                    .padding(.top, 30)
                }
                .rise(shown, delay: 0.30)
            }
            .padding(.horizontal, 22)
            .padding(.top, no == nil ? 20 : 4)
            .padding(.bottom, 46 + 56)
        }
        .scrollIndicators(.hidden)
    }

    private func briefItem(_ item: Bookmark) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 8) {
                AvatarCircle(initials: item.initials, size: 22)
                Text(item.author).font(.ui(12.5)).foregroundStyle(Palette.muted)
                Text(item.date).font(.ui(12)).foregroundStyle(Palette.faintest)
            }
            .padding(.bottom, 8)

            Text(item.title)
                .itemTitle()
                .tracking(-0.18)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.bottom, 6)

            Text(item.summary)
                .itemSummary()
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 18)
        .contentShape(Rectangle())
    }
}

/// The staggered entrance. Delays: 0 / .06 / .14 / .22 / .30.
private extension View {
    func rise(_ shown: Bool, delay: Double) -> some View {
        opacity(shown ? 1 : 0)
            .offset(y: shown ? 0 : 14)
            .animation(.easeOut(duration: 0.55).delay(delay), value: shown)
    }
}

