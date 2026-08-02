import SwiftUI

struct AskView: View {
    @Environment(Store.self) private var store

    @State private var query = ""
    @State private var busy = false
    @State private var answer: AskAnswer?
    @State private var task: Task<Void, Never>?
    @FocusState private var focused: Bool

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Eyebrow(text: "Ask your library").padding(.bottom, 12)

                Text("Six years of saves. Ask it something.")
                    .font(.serif(30)).tracking(-0.66).lineHeight(30, 1.15)
                    .foregroundStyle(Palette.ink)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.bottom, 22)

                // Asking is writing — Newsreader in the field.
                HStack(spacing: 10) {
                    TextField("", text: $query, prompt:
                        Text("What have I saved about…").foregroundStyle(Palette.fainter)
                    )
                    .font(.serif(18))
                    .foregroundStyle(Palette.ink)
                    .focused($focused)
                    .submitLabel(.search)
                    .onSubmit { run(query) }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 12)
                    .background(RoundedRectangle(cornerRadius: 10).fill(Palette.surface))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .strokeBorder(focused ? Palette.ochreLine : Palette.line)
                    )
                    .animation(.easeOut(duration: 0.15), value: focused)

                    Button { run(query) } label: {
                        Text("Ask")
                            .font(.ui(14, .medium))
                            .foregroundStyle(Palette.onDark)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 14)
                            .background(RoundedRectangle(cornerRadius: 10).fill(Palette.ink))
                    }
                    .buttonStyle(.plain)
                }
                .padding(.bottom, 14)

                // With no model behind it, the chips are the primary path —
                // all four return a good answer.
                FlowLayout(spacing: 7) {
                    ForEach(Store.askSuggestions, id: \.self) { s in
                        Button { run(s) } label: {
                            Text(s)
                                .font(.ui(12.5))
                                .foregroundStyle(Palette.muted)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Capsule().fill(Palette.chip))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.bottom, 32)

                // One slot, so the thinking state cannot overlap the answer
                // while the two transitions cross.
                if busy {
                    HStack(spacing: 11) {
                        PulsingDot()
                        Text("Reading \(store.totalIdeas) summaries…")
                            .font(.ui(13.5)).foregroundStyle(Palette.muted3)
                    }
                    // Leaves instantly rather than cross-fading, so it never
                    // ghosts through the answer rising into the same slot.
                    .transition(.identity)
                } else if let answer {
                    VStack(alignment: .leading, spacing: 0) {
                        // The label wraps to two lines at this measure, so the
                        // hairline sits beneath it rather than beside it.
                        Eyebrow(text: answer.label, accent: true)
                            .padding(.bottom, 10)
                        Hairline(colour: Palette.line)
                            .padding(.bottom, 16)

                        ForEach(Array(answer.paras.enumerated()), id: \.offset) { _, p in
                            Text(p)
                                .askAnswer()
                                .fixedSize(horizontal: false, vertical: true)
                                .padding(.bottom, 16)
                        }

                        let sources = store.hydrate(answer.ids)
                        if !sources.isEmpty {
                            Eyebrow(text: "Drawn from \(sources.count) \(sources.count == 1 ? "idea" : "ideas") you saved")
                                .padding(.top, 14)
                                .padding(.bottom, 10)
                            Hairline(colour: Palette.line)

                            ForEach(sources) { s in
                                NavigationLink(value: Route.idea(s.id)) {
                                    HStack(alignment: .top, spacing: 14) {
                                        AvatarCircle(initials: s.initials, size: 26)
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(s.title)
                                                .connectionTitle()
                                                .fixedSize(horizontal: false, vertical: true)
                                            Text("\(s.author) · saved \(s.date)")
                                                .font(.ui(12.5)).foregroundStyle(Palette.faint)
                                        }
                                        Spacer(minLength: 0)
                                    }
                                    .padding(.vertical, 16)
                                    .contentShape(Rectangle())
                                }
                                .buttonStyle(.plain)
                                Hairline()
                            }
                        }

                        Text("Answers are drawn only from what you saved. Nothing here is invented.")
                            .font(.ui(12.5)).foregroundStyle(Palette.fainter)
                            .padding(.top, 22)
                    }
                    .transition(.opacity.combined(with: .offset(y: 14)))
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

    private func run(_ text: String) {
        let q = text.trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return }
        focused = false
        query = q
        task?.cancel()
        withAnimation(.easeOut(duration: 0.2)) {
            busy = true
            answer = nil
        }
        // The 0.9s retrieval beat is the whole point of the thinking state.
        task = Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(900))
            guard !Task.isCancelled else { return }
            withAnimation(.easeOut(duration: 0.45)) {
                answer = store.answer(for: q)
                busy = false
            }
        }
    }
}

/// cpPulse — 1.1s, ease-in-out, infinite.
struct PulsingDot: View {
    var colour: Color = Palette.ochre
    var size: CGFloat = 6
    var period: Double = 1.1
    @State private var dim = false

    var body: some View {
        Circle()
            .fill(colour)
            .frame(width: size, height: size)
            .opacity(dim ? 0.35 : 1)
            .animation(.easeInOut(duration: period / 2).repeatForever(autoreverses: true), value: dim)
            .onAppear { dim = true }
    }
}
