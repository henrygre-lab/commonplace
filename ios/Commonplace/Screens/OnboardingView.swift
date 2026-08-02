import SwiftUI

/// 01-design-spec.md § 3.1 — three full-screen steps, no chrome beyond the
/// wordmark. The OAuth is faked with a 0.9s delay and the backfill runs on a
/// timer, because this app never talks to a server.
struct OnboardingView: View {
    @Environment(Store.self) private var store
    let onFinish: () -> Void

    @State private var step = 0
    @State private var connecting = false
    @State private var progress: Double = 0
    @State private var backfill: Task<Void, Never>?

    var body: some View {
        ZStack(alignment: .top) {
            Palette.ground.ignoresSafeArea()

            HStack(spacing: 9) {
                Circle().fill(Palette.ochre).frame(width: 7, height: 7)
                Text("Commonplace").font(.serif(19)).foregroundStyle(Palette.ink)
            }
            .padding(.top, 40)

            Group {
                switch step {
                case 0: pitch
                case 1: consent
                default: setup
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .padding(.horizontal, 24)
            .transition(.opacity)
        }
        .animation(.easeOut(duration: 0.45), value: step)
        .onDisappear { backfill?.cancel() }
    }

    // MARK: Step 1 — the pitch

    private var pitch: some View {
        VStack(spacing: 0) {
            Spacer()
            Eyebrow(text: "A second brain for your X bookmarks")
                .padding(.bottom, 20)

            Text("Your bookmarks are a library nobody ever catalogued.")
                .font(.serif(36)).tracking(-0.79).lineHeight(36, 1.12)
                .foregroundStyle(Palette.ink)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.bottom, 18)

            Text("Commonplace reads everything you save on X, extracts the idea inside it, and brings the right ones back to you each morning.")
                .font(.serif(17)).lineHeight(17, 1.62)
                .foregroundStyle(Palette.muted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.bottom, 34)

            Button { step = 1 } label: {
                Text("Get started")
                    .font(.ui(15, .medium))
                    .foregroundStyle(Palette.onOchre)
                    .padding(.horizontal, 30)
                    .padding(.vertical, 14)
                    .background(Capsule().fill(Palette.ochre))
            }
            .buttonStyle(.plain)
            Spacer()
        }
    }

    // MARK: Step 2 — consent

    private let permissions = [
        ("Read your bookmarks", "Including your full history, backfilled once on setup."),
        ("Never post, follow, or message", "We ask for no write access at all."),
        ("Summaries stay yours", "Export or delete everything in one click."),
    ]

    private var consent: some View {
        VStack(spacing: 0) {
            Spacer()
            Text("Connect your X account")
                .font(.serif(30)).tracking(-0.6).lineHeight(30, 1.18)
                .foregroundStyle(Palette.ink)
                .multilineTextAlignment(.center)
                .padding(.bottom, 8)

            Text("One connection. Read-only. Revoke it whenever you like.")
                .font(.ui(14)).lineHeight(14, 1.6)
                .foregroundStyle(Palette.muted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.bottom, 24)

            CardSurface(padding: EdgeInsets(top: 4, leading: 20, bottom: 4, trailing: 20)) {
                VStack(spacing: 0) {
                    ForEach(Array(permissions.enumerated()), id: \.offset) { i, p in
                        HStack(alignment: .top, spacing: 14) {
                            Circle()
                                .fill(i == 0 ? Palette.ochre : Palette.permDot)
                                .frame(width: 6, height: 6)
                                .padding(.top, 7)
                            VStack(alignment: .leading, spacing: 3) {
                                Text(p.0).font(.ui(14, .medium)).foregroundStyle(Palette.ink)
                                Text(p.1)
                                    .font(.ui(13)).lineHeight(13, 1.5)
                                    .foregroundStyle(Palette.muted3)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            Spacer(minLength: 0)
                        }
                        .padding(.vertical, 16)

                        if i < permissions.count - 1 { Hairline(colour: Palette.lineFaint) }
                    }
                }
            }
            .padding(.bottom, 22)

            Button {
                connecting = true
                Task { @MainActor in
                    try? await Task.sleep(for: .milliseconds(900))
                    connecting = false
                    step = 2
                    runBackfill()
                }
            } label: {
                Text(connecting ? "Authorising…" : "Connect X account")
                    .font(.ui(15, .medium))
                    .foregroundStyle(Palette.onDark)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(RoundedRectangle(cornerRadius: 10).fill(Palette.ink))
            }
            .buttonStyle(.plain)
            .disabled(connecting)

            Text("Signed in as @samrieber")
                .font(.ui(12.5)).foregroundStyle(Palette.faint)
                .padding(.top, 14)
            Spacer()
        }
    }

    // MARK: Step 3 — backfill

    private let themeChips = [
        "Business", "Leverage", "Health", "Psychology", "Writing", "Pricing", "Attention", "Career",
    ]

    private var busy: Bool { progress < 100 }

    private var setup: some View {
        VStack(spacing: 0) {
            Spacer()
            Eyebrow(text: "Backfilling your archive").padding(.bottom, 12)

            Text(busy ? "1,284 bookmarks found. Reading them now." : "Your library is ready.")
                .font(.serif(32)).tracking(-0.64).lineHeight(32, 1.15)
                .foregroundStyle(Palette.ink)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.bottom, 28)

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Palette.line)
                    Capsule().fill(Palette.ochre)
                        .frame(width: geo.size.width * min(1, progress / 100))
                }
            }
            .frame(height: 4)
            .animation(.linear(duration: 0.35), value: progress)
            .padding(.bottom, 12)

            HStack {
                Text(busy
                     ? "Summarising \(Int((progress / 100) * 1284)) of 1,284"
                     : "All 1,284 bookmarks summarised")
                Spacer()
                Text("\(Int(min(100, progress)))%")
            }
            .font(.ui(13))
            .foregroundStyle(Palette.muted3)
            .padding(.bottom, 28)

            CardSurface {
                VStack(alignment: .leading, spacing: 12) {
                    Eyebrow(text: "Emerging themes")
                    FlowLayout(spacing: 7) {
                        ForEach(themeChips, id: \.self) { TagChip(name: $0, size: 12.5) }
                    }
                }
            }
            .padding(.bottom, 24)

            Button(action: onFinish) {
                Text(busy ? "Processing…" : "Enter your library")
                    .font(.ui(15, .medium))
                    .foregroundStyle(busy ? Palette.fainter : Palette.onOchre)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(RoundedRectangle(cornerRadius: 10)
                        .fill(busy ? Palette.line : Palette.ochre))
            }
            .buttonStyle(.plain)
            .disabled(busy)
            .animation(.easeOut(duration: 0.2), value: busy)
            Spacer()
        }
    }

    private func runBackfill() {
        backfill?.cancel()
        progress = 0
        backfill = Task { @MainActor in
            while progress < 100 {
                try? await Task.sleep(for: .milliseconds(220))
                guard !Task.isCancelled else { return }
                progress = min(100, progress + 4 + Double.random(in: 0...5))
            }
        }
    }
}
