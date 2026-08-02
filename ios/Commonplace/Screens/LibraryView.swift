import SwiftUI

struct LibraryView: View {
    @Environment(Store.self) private var store
    @FocusState private var searchFocused: Bool

    var body: some View {
        @Bindable var store = store

        ScrollView {
            LazyVStack(alignment: .leading, spacing: 0, pinnedViews: []) {

                // ── Header ───────────────────────────────────────────────
                Text("Library").pageTitle()
                    .padding(.bottom, 6)

                // The display constants are deliberate — this is a portfolio
                // build and the library has to look lived-in.
                Text("\(store.totalIdeas) ideas · \(store.unreviewedCount) unreviewed · synced \(store.syncedAgo) ago")
                    .font(.ui(13.5))
                    .foregroundStyle(Palette.muted3)
                    .padding(.bottom, 20)

                // ── Search ───────────────────────────────────────────────
                TextField("", text: $store.query, prompt:
                    Text("Search ideas").foregroundStyle(Palette.fainter)
                )
                .font(.ui(13.5))
                .foregroundStyle(Palette.ink)
                .focused($searchFocused)
                .submitLabel(.search)
                .padding(.horizontal, 13)
                .padding(.vertical, 9)
                .background(RoundedRectangle(cornerRadius: 8).fill(Palette.surface))
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .strokeBorder(searchFocused ? Palette.ochreLine : Palette.line)
                )
                .animation(.easeOut(duration: 0.15), value: searchFocused)
                .padding(.bottom, 12)

                // ── Filter + group pills ─────────────────────────────────
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        SegmentedPills(
                            options: Filter.allCases.map { ($0, $0.label) },
                            selection: $store.filter
                        )
                        SegmentedPills(
                            options: GroupBy.allCases.map { ($0, $0.label) },
                            selection: $store.groupBy
                        )
                    }
                }
                .scrollClipDisabled()
                .padding(.bottom, 12)

                // ── Tag row — the desktop sidebar's tag list ─────────────
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 7) {
                        ForEach(store.tagList, id: \.name) { tag in
                            let on = store.activeTag == tag.name
                            Button {
                                // Tapping an active tag clears it — toggle, not radio.
                                store.activeTag = on ? nil : tag.name
                            } label: {
                                HStack(spacing: 6) {
                                    Circle()
                                        .fill(Palette.tagHue(tag.name).fg)
                                        .frame(width: 5, height: 5)
                                    Text(tag.name).font(.ui(13))
                                    Text("\(tag.count)").font(.ui(11.5)).foregroundStyle(Palette.faintest)
                                }
                                .foregroundStyle(on ? Palette.ochreDeep : Palette.muted)
                                .padding(.horizontal, 11)
                                .padding(.vertical, 6)
                                .background(Capsule().fill(on ? Palette.ochreTint : Palette.chip))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .scrollClipDisabled()
                .padding(.bottom, 4)

                // ── Rows ─────────────────────────────────────────────────
                if store.buckets.isEmpty {
                    VStack(spacing: 10) {
                        Text("Nothing here yet.").font(.serif(22)).foregroundStyle(Palette.ink)
                        Text("Try a broader search, or clear the filters.")
                            .font(.ui(13.5)).foregroundStyle(Palette.muted3)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 70)
                } else {
                    ForEach(store.buckets) { bucket in
                        if store.groupBy != .none {
                            HStack(alignment: .firstTextBaseline, spacing: 12) {
                                Text(bucket.label).font(.serif(15)).foregroundStyle(Palette.inkBody)
                                Hairline()
                                Text("\(bucket.items.count) \(bucket.items.count == 1 ? "idea" : "ideas")")
                                    .font(.ui(11.5)).foregroundStyle(Palette.faintest)
                            }
                            .padding(.top, 30)
                            .padding(.bottom, 6)
                        }

                        ForEach(bucket.items) { item in
                            BookmarkRow(item: item)
                            Hairline()
                        }
                    }
                }
            }
            .padding(.horizontal, 22)
            .padding(.top, 18)
            .padding(.bottom, 46 + 56)
        }
        .scrollIndicators(.hidden)
        .scrollDismissesKeyboard(.immediately)
        .background(Palette.ground)
    }
}

/// The desktop three-column grid collapses to a stack on the phone; `e` and `f`
/// become swipe actions, which is how the keyboard shortcuts translate to touch.
struct BookmarkRow: View {
    @Environment(Store.self) private var store
    let item: Bookmark

    @State private var offsetX: CGFloat = 0
    @State private var committing = false

    private let threshold: CGFloat = 78

    var body: some View {
        ZStack {
            // The action revealed behind the row, coloured by swipe direction.
            HStack {
                if offsetX > 0 {
                    Label {
                        Text(item.reviewed ? "Unreview" : "Mark reviewed").font(.ui(12.5, .medium))
                    } icon: {
                        Image(systemName: "checkmark").font(.system(size: 12, weight: .semibold))
                    }
                    .foregroundStyle(Palette.onOchre)
                    .padding(.leading, 18)
                    Spacer()
                } else if offsetX < 0 {
                    Spacer()
                    Label {
                        Text(item.core ? "Remove core" : "Core").font(.ui(12.5, .medium))
                    } icon: {
                        Text("✦")
                    }
                    .foregroundStyle(Palette.ochreDeep)
                    .padding(.trailing, 18)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(offsetX > 0 ? Palette.ochre : Palette.ochreTint)
            .opacity(offsetX == 0 ? 0 : 1)

            NavigationLink(value: Route.idea(item.id)) { rowBody }
                .buttonStyle(.plain)
                .background(Palette.ground)
                .offset(x: offsetX)
                .gesture(swipe)
                .accessibilityIdentifier("row-\(item.id)")
                .accessibilityLabel("\(item.title). \(item.author), \(item.date)")
        }
    }

    private var rowBody: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 8) {
                AvatarCircle(initials: item.initials, size: 26)
                Text(item.author).font(.ui(12.5, .medium)).foregroundStyle(Palette.ink)
                Text("· \(item.date)").font(.ui(12)).foregroundStyle(Palette.faint)
                Spacer(minLength: 8)
                Text(item.reviewed ? "REVIEWED" : "NEW")
                    .stateLabel(item.reviewed ? Palette.reviewed : Palette.ochre)
                CoreStar(on: item.core)
            }
            .padding(.bottom, 9)

            Text(item.title)
                .rowTitle()
                .fixedSize(horizontal: false, vertical: true)
                .padding(.bottom, 6)

            Text(item.summary)
                .rowSummary()
                .fixedSize(horizontal: false, vertical: true)
                .padding(.bottom, 10)

            HStack(spacing: 6) {
                ForEach(item.tags, id: \.self) { TagChip(name: $0) }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 20)
        .contentShape(Rectangle())
    }

    private var swipe: some Gesture {
        DragGesture(minimumDistance: 18)
            .onChanged { v in
                guard !committing, abs(v.translation.width) > abs(v.translation.height) else { return }
                offsetX = max(-120, min(120, v.translation.width))
            }
            .onEnded { _ in
                let x = offsetX
                guard abs(x) >= threshold else {
                    withAnimation(.easeOut(duration: 0.2)) { offsetX = 0 }
                    return
                }
                committing = true
                withAnimation(.easeOut(duration: 0.18)) { offsetX = 0 }
                if x > 0 { store.toggleReviewed(item.id) } else { store.toggleCore(item.id) }
                committing = false
            }
    }
}
