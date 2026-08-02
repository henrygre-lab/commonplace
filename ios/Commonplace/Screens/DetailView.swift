import SwiftUI

/// 01-design-spec.md § 3.5, stacked into a single column for the phone.
struct DetailView: View {
    @Environment(Store.self) private var store
    let id: Int

    @State private var origOpen = false
    @State private var noteDraft = ""
    @State private var noteStatus = "Saved automatically"
    @State private var tagDraft = ""
    @State private var saveTask: Task<Void, Never>?
    @FocusState private var tagFocused: Bool

    private var item: Bookmark? { store.bookmark(id) }

    var body: some View {
        Group {
            if let item { content(item) } else { missing }
        }
        .background(Palette.ground)
        .toolbar(.hidden, for: .navigationBar)
        .task(id: id) {
            // Resets every time a new item opens.
            origOpen = false
            noteDraft = item?.note ?? ""
            noteStatus = "Saved automatically"
            tagDraft = ""
        }
    }

    private var missing: some View {
        Text("That idea is not in your library.").cardTitle().padding(24)
    }

    private func stepTarget(_ dir: Int) -> Int {
        let all = store.bookmarks
        guard let i = all.firstIndex(where: { $0.id == id }), !all.isEmpty else { return id }
        return all[(i + dir + all.count) % all.count].id
    }

    @ViewBuilder
    private func content(_ item: Bookmark) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {

                // ↑ ↓ step through the WHOLE corpus with wraparound, not the
                // filtered subset. Reading is browsing; filters are for finding.
                TopBar(backLabel: "Library") {
                    HStack(spacing: 6) {
                        NavigationLink(value: Route.idea(stepTarget(-1))) {
                            SquareNavIcon(systemImage: "chevron.up")
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Previous idea")

                        NavigationLink(value: Route.idea(stepTarget(1))) {
                            SquareNavIcon(systemImage: "chevron.down")
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Next idea")
                    }
                }
                .padding(.bottom, 18)

                SectionRule(label: "The idea", accent: true) {
                    Text("Saved \(item.date)").font(.ui(12)).foregroundStyle(Palette.faint)
                }
                .padding(.bottom, 16)

                Text(item.title)
                    .detailTitle()
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.bottom, 16)

                Text(item.summary)
                    .detailSummary()
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.bottom, 34)

                // ── Key concepts, then Actionable — stacked, not side by side.
                Eyebrow(text: "Key concepts").padding(.bottom, 12)
                VStack(alignment: .leading, spacing: 9) {
                    ForEach(item.concepts, id: \.self) { c in
                        HStack(alignment: .top, spacing: 9) {
                            Text("—").font(.ui(14)).foregroundStyle(Palette.ochreLine)
                            Text(c).font(.ui(14)).lineHeight(14, 1.45)
                                .foregroundStyle(Palette.inkBody)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
                .padding(.bottom, 28)

                Eyebrow(text: "Actionable").padding(.bottom, 12)
                VStack(alignment: .leading, spacing: 11) {
                    ForEach(Array(item.actions.enumerated()), id: \.offset) { i, a in
                        HStack(alignment: .top, spacing: 11) {
                            Text("\(i + 1)")
                                .font(.serif(13)).foregroundStyle(Palette.ochre)
                                .frame(width: 12, alignment: .leading)
                            Text(a).font(.ui(14)).lineHeight(14, 1.5)
                                .foregroundStyle(Palette.inkBody)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
                .padding(.bottom, 28)

                // ── The original post ────────────────────────────────────
                Hairline(colour: Palette.line)
                Button {
                    withAnimation(.easeOut(duration: 0.28)) { origOpen.toggle() }
                } label: {
                    HStack(spacing: 9) {
                        Text(origOpen ? "▾" : "▸").font(.ui(13))
                        Text("Show the original post").font(.ui(13))
                    }
                    .foregroundStyle(Palette.muted3)
                    .padding(.vertical, 16)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)

                if origOpen {
                    CardSurface {
                        VStack(alignment: .leading, spacing: 0) {
                            HStack(spacing: 12) {
                                AvatarCircle(initials: item.initials, size: 34)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(item.author).font(.ui(13, .medium)).foregroundStyle(Palette.ink)
                                    Text(item.handle).font(.ui(12)).foregroundStyle(Palette.faint)
                                }
                            }
                            .padding(.bottom, 14)

                            Text(item.original)
                                .font(.ui(15)).lineHeight(15, 1.68)
                                .foregroundStyle(Palette.inkSoft)
                                .fixedSize(horizontal: false, vertical: true)
                                .padding(.bottom, 16)

                            Hairline(colour: Palette.lineFaint)
                            HStack {
                                Text("\(item.likes) likes · \(item.reposts) reposts")
                                    .font(.ui(12.5)).foregroundStyle(Palette.faint)
                                Spacer()
                                Text("Open on X").font(.ui(12.5, .medium)).foregroundStyle(Palette.ochre)
                            }
                            .padding(.top, 14)
                        }
                    }
                    .transition(.opacity.combined(with: .offset(y: 6)))
                    .padding(.bottom, 8)
                }

                // ── Connections — the reason is the product ──────────────
                let related = store.related(item.id)
                if !related.isEmpty {
                    SectionRule(label: "Connections", accent: true) {
                        Text("\(related.count) of \(store.connectionsTotal) ideas")
                            .font(.ui(12)).foregroundStyle(Palette.faint)
                    }
                    .padding(.top, 34)
                    .padding(.bottom, 4)

                    ForEach(related, id: \.bookmark.id) { pair in
                        NavigationLink(value: Route.idea(pair.bookmark.id)) {
                            VStack(alignment: .leading, spacing: 6) {
                                // The 150pt reason column does not fit on a
                                // phone, so the reason sits above the title.
                                Eyebrow(
                                    text: pair.relation.reason,
                                    colour: pair.relation.disagrees ? Palette.disagree : Palette.ochre
                                )
                                Text(pair.bookmark.title)
                                    .connectionTitle()
                                    .fixedSize(horizontal: false, vertical: true)
                                Text("\(pair.bookmark.author) · saved \(pair.bookmark.date)")
                                    .font(.ui(12.5)).foregroundStyle(Palette.faint)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.vertical, 16)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        Hairline()
                    }
                }

                // ── Tags ─────────────────────────────────────────────────
                CardSurface {
                    VStack(alignment: .leading, spacing: 12) {
                        Eyebrow(text: "Tags")
                        FlowTags(tags: item.tags) { store.removeTag(item.id, $0) }
                        TextField("", text: $tagDraft, prompt:
                            Text("Add a tag ⏎").foregroundStyle(Palette.fainter)
                        )
                        .font(.ui(13))
                        .focused($tagFocused)
                        .submitLabel(.done)
                        .onSubmit {
                            store.addTag(item.id, tagDraft)
                            tagDraft = ""
                        }
                        .padding(.horizontal, 11)
                        .padding(.vertical, 8)
                        .background(RoundedRectangle(cornerRadius: 7).fill(Palette.surfaceInset))
                        .overlay(
                            RoundedRectangle(cornerRadius: 7)
                                .strokeBorder(tagFocused ? Palette.ochreLine : Palette.line)
                        )
                    }
                }
                .padding(.top, 28)
                .padding(.bottom, 16)

                // ── Your note ────────────────────────────────────────────
                CardSurface {
                    VStack(alignment: .leading, spacing: 10) {
                        Eyebrow(text: "Your note")
                        ZStack(alignment: .topLeading) {
                            if noteDraft.isEmpty {
                                Text("What does this change for you?")
                                    .font(.serif(14)).foregroundStyle(Palette.fainter)
                                    .padding(.top, 8).padding(.leading, 5)
                            }
                            // Newsreader here — writing should feel like writing.
                            TextEditor(text: $noteDraft)
                                .font(.serif(14))
                                .foregroundStyle(Palette.ink)
                                .scrollContentBackground(.hidden)
                                .frame(minHeight: 96)
                                .onChange(of: noteDraft) { _, new in autosave(item.id, new) }
                        }
                        .background(RoundedRectangle(cornerRadius: 7).fill(Palette.surfaceInset))
                        Text(noteStatus).font(.ui(11.5)).foregroundStyle(Palette.fainter)
                    }
                }
                .padding(.bottom, 16)

                // ── The two buttons ──────────────────────────────────────
                VStack(spacing: 8) {
                    Button { store.toggleReviewed(item.id) } label: {
                        Text(item.reviewed ? "Reviewed ✓" : "Mark as reviewed")
                            .font(.ui(14, .medium))
                            .foregroundStyle(item.reviewed ? Palette.ochreDeep : Palette.onOchre)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 13)
                            .background(RoundedRectangle(cornerRadius: 9)
                                .fill(item.reviewed ? Palette.ochreTint : Palette.ochre))
                    }
                    .buttonStyle(.plain)

                    Button { store.toggleCore(item.id) } label: {
                        Text(item.core ? "✦ Core idea" : "Mark as core")
                            .font(.ui(14, .medium))
                            .foregroundStyle(item.core ? Palette.ochre : Palette.muted)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 13)
                            .background(RoundedRectangle(cornerRadius: 9).fill(Palette.surface))
                            .overlay(RoundedRectangle(cornerRadius: 9).strokeBorder(Palette.line))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 22)
            .padding(.top, 4)
            .padding(.bottom, 46 + 56)
        }
        .scrollIndicators(.hidden)
    }

    /// Every keystroke sets Saving…; a 0.6s debounce then writes and settles to
    /// Saved just now. There is never a Save button.
    private func autosave(_ id: Int, _ text: String) {
        noteStatus = "Saving…"
        saveTask?.cancel()
        saveTask = Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(600))
            guard !Task.isCancelled else { return }
            store.setNote(id, text)
            noteStatus = "Saved just now"
        }
    }
}

/// Chips that wrap onto as many lines as they need.
struct FlowTags: View {
    let tags: [String]
    var onRemove: ((String) -> Void)?

    var body: some View {
        FlowLayout(spacing: 6) {
            ForEach(tags, id: \.self) { t in
                TagChip(name: t, size: 12.5, onRemove: onRemove.map { fn in { fn(t) } })
            }
        }
    }
}

struct FlowLayout: Layout {
    var spacing: CGFloat = 6

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var x: CGFloat = 0, y: CGFloat = 0, rowHeight: CGFloat = 0
        for s in subviews {
            let size = s.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, x > 0 {
                x = 0; y += rowHeight + spacing; rowHeight = 0
            }
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        return CGSize(width: maxWidth == .infinity ? x : maxWidth, height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX, y = bounds.minY, rowHeight: CGFloat = 0
        for s in subviews {
            let size = s.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX {
                x = bounds.minX; y += rowHeight + spacing; rowHeight = 0
            }
            s.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
