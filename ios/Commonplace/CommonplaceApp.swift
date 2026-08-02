import SwiftUI

@main
struct CommonplaceApp: App {
    @State private var store = Store()
    @AppStorage("hasOnboarded") private var hasOnboarded = false
    @State private var replaying = false

    var body: some Scene {
        WindowGroup {
            ZStack {
                Palette.ground.ignoresSafeArea()

                if hasOnboarded && !replaying {
                    RootView(replayOnboarding: { replaying = true })
                        .transition(.opacity)
                } else {
                    OnboardingView {
                        hasOnboarded = true
                        replaying = false
                    }
                    .transition(.opacity)
                }
            }
            .environment(store)
            // This design's optical sizes break at accessibility XL, and
            // portfolio screenshots are taken at the default size anyway.
            .dynamicTypeSize(...(.large))
            // Warm paper only. A dark inversion is a different design.
            .preferredColorScheme(.light)
            .animation(.easeInOut(duration: 0.4), value: hasOnboarded)
            .animation(.easeInOut(duration: 0.4), value: replaying)
        }
    }
}

/// Where a push can lead. Each tab owns its own `NavigationStack`.
enum Route: Hashable {
    case idea(Int)
    case brief(Int)
    case archive
}

enum Tab: Hashable, CaseIterable {
    case brief, library, ask, settings

    var label: String {
        switch self {
        case .brief:    return "Brief"
        case .library:  return "Library"
        case .ask:      return "Ask"
        case .settings: return "Settings"
        }
    }
}

struct RootView: View {
    @Environment(Store.self) private var store
    @State private var tab: Tab = .brief
    // Each tab keeps its own navigation path so switching away and back does
    // not lose your place.
    @State private var paths: [Tab: NavigationPath] = [:]
    let replayOnboarding: () -> Void

    var body: some View {
        ZStack(alignment: .bottom) {
            Palette.ground.ignoresSafeArea()

            // Held in a ZStack rather than a TabView so every stack stays alive.
            ForEach(Tab.allCases, id: \.self) { t in
                stack(for: t)
                    .opacity(tab == t ? 1 : 0)
                    .allowsHitTesting(tab == t)
                    .accessibilityHidden(tab != t)
            }

            TabBar(selection: $tab)
        }
        .overlay(alignment: .bottom) {
            if let toast = store.toast {
                ToastView(message: toast)
                    .padding(.bottom, 96)
            }
        }
        .animation(.easeOut(duration: 0.22), value: store.toast)
        .ignoresSafeArea(.keyboard, edges: .bottom)
    }

    @ViewBuilder
    private func stack(for t: Tab) -> some View {
        NavigationStack(path: binding(for: t)) {
            Group {
                switch t {
                case .brief:    BriefView(no: nil)
                case .library:  LibraryView()
                case .ask:      AskView()
                case .settings: SettingsView(replayOnboarding: replayOnboarding)
                }
            }
            .navigationDestination(for: Route.self) { route in
                switch route {
                case .idea(let id):  DetailView(id: id)
                case .brief(let no): BriefView(no: no)
                case .archive:       ArchiveView()
                }
            }
        }
    }

    private func binding(for t: Tab) -> Binding<NavigationPath> {
        Binding(
            get: { paths[t] ?? NavigationPath() },
            set: { paths[t] = $0 }
        )
    }
}

/// Custom, not `TabView`'s default chrome — the system bar is grey-blue and
/// cool, and no icons: the words are the design.
struct TabBar: View {
    @Binding var selection: Tab

    var body: some View {
        VStack(spacing: 0) {
            Hairline(colour: Palette.lineSidebar)
            HStack(spacing: 0) {
                ForEach(Tab.allCases, id: \.self) { t in
                    Button {
                        selection = t
                    } label: {
                        Text(t.label.uppercased())
                            .font(.ui(10.5))
                            .tracking(1.47)
                            .foregroundStyle(selection == t ? Palette.ochre : Palette.muted3)
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityAddTraits(selection == t ? [.isSelected, .isButton] : .isButton)
                }
            }
        }
        .background(Palette.groundSunk)
    }
}
