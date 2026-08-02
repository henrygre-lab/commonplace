import SwiftUI

// MARK: - Eyebrow
//
// The workhorse label of this design — used ~30×. 10.5pt, tracking 1.47,
// uppercase, faint; or ochre when the section deserves emphasis (The idea,
// Connections, Resurfaced, Ask answer).

struct Eyebrow: View {
    let text: String
    var accent = false
    var colour: Color?

    var body: some View {
        Text(text.uppercased())
            .font(.ui(10.5))
            .tracking(1.47)
            .foregroundStyle(colour ?? (accent ? Palette.ochre : Palette.faint))
            .fixedSize(horizontal: false, vertical: true)
    }
}

// MARK: - SectionRule — eyebrow + flex hairline

struct SectionRule<Trailing: View>: View {
    let label: String
    var accent = false
    @ViewBuilder var trailing: Trailing

    var body: some View {
        HStack(spacing: 12) {
            Eyebrow(text: label, accent: accent)
            Rectangle().fill(Palette.lineRow).frame(height: 1)
            trailing
        }
    }
}

extension SectionRule where Trailing == EmptyView {
    init(_ label: String, accent: Bool = false) {
        self.init(label: label, accent: accent) { EmptyView() }
    }
}

// MARK: - AvatarCircle

struct AvatarCircle: View {
    let initials: String
    var size: CGFloat = 26
    var large = false

    var body: some View {
        Circle()
            .fill(large ? Palette.avatarLarge : Palette.avatar)
            .frame(width: size, height: size)
            .overlay(
                Text(initials)
                    .font(.ui(max(9, size * 0.38), .semibold))
                    .foregroundStyle(Palette.muted2)
            )
    }
}

// MARK: - TagChip

struct TagChip: View {
    let name: String
    var size: CGFloat = 11.5
    var onRemove: (() -> Void)?

    var body: some View {
        let hue = Palette.tagHue(name)
        HStack(spacing: 6) {
            Text(name).font(.ui(size))
            if onRemove != nil {
                Text("×").font(.ui(size)).opacity(0.45)
            }
        }
        .foregroundStyle(hue.fg)
        .padding(.horizontal, 9)
        .padding(.vertical, 3)
        .background(Capsule().fill(hue.bg))
        .contentShape(Capsule())
        .onTapGesture { onRemove?() }
    }
}

// MARK: - CardSurface — #FCFAF4 + 1pt #E4DDCE

struct CardSurface<Content: View>: View {
    var radius: CGFloat = 14
    var padding: EdgeInsets = EdgeInsets(top: 20, leading: 20, bottom: 20, trailing: 20)
    /// The recall prompt is the only dashed edge in the product: it signals
    /// "not content, an exercise".
    var dashed = false
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: radius)
                    .fill(dashed ? Color.clear : Palette.surface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: radius)
                    .strokeBorder(
                        dashed ? Palette.lineStrong : Palette.line,
                        style: dashed
                            ? StrokeStyle(lineWidth: 1, dash: [4, 4])
                            : StrokeStyle(lineWidth: 1)
                    )
            )
    }
}

// MARK: - SegmentedPills — custom, not UISegmentedControl

struct SegmentedPills<T: Hashable>: View {
    let options: [(value: T, label: String)]
    @Binding var selection: T

    var body: some View {
        HStack(spacing: 2) {
            ForEach(options, id: \.value) { option in
                let on = option.value == selection
                Button {
                    selection = option.value
                } label: {
                    Text(option.label)
                        .font(.ui(13))
                        .foregroundStyle(on ? Palette.ink : Palette.muted3)
                        // A pill label must never wrap — "07:00" broken across
                        // four lines is the fastest way to look unfinished.
                        .lineLimit(1)
                        .fixedSize()
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(
                            RoundedRectangle(cornerRadius: 7)
                                .fill(on ? Palette.segmentActive : .clear)
                                .shadow(color: on ? .black.opacity(0.08) : .clear, radius: 1, y: 1)
                        )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(3)
        .background(RoundedRectangle(cornerRadius: 9).fill(Palette.segmentTrack))
    }
}

// MARK: - PaperToggle — 42×25 track
//
// The system Toggle is iOS green and would be the only wrong colour in the app.

struct PaperToggle: View {
    @Binding var isOn: Bool

    var body: some View {
        Capsule()
            .fill(isOn ? Palette.ochre : Palette.toggleOff)
            .frame(width: 42, height: 25)
            .overlay(alignment: .leading) {
                Circle()
                    .fill(Palette.knob)
                    .frame(width: 19, height: 19)
                    .shadow(color: .black.opacity(0.18), radius: 1, y: 1)
                    .offset(x: isOn ? 20 : 3)
            }
            .animation(.easeInOut(duration: 0.18), value: isOn)
            .contentShape(Rectangle())
            .onTapGesture { isOn.toggle() }
            .accessibilityAddTraits(.isButton)
    }
}

// MARK: - Toast

struct ToastView: View {
    let message: String

    var body: some View {
        Text(message)
            .font(.ui(13))
            .foregroundStyle(Palette.onDark)
            .padding(.horizontal, 20)
            .padding(.vertical, 11)
            .background(Capsule().fill(Palette.ink))
            .shadow(color: Color(hex: 0x191713).opacity(0.24), radius: 12, y: 8)
            .transition(.opacity.combined(with: .offset(y: 6)))
    }
}

// MARK: - Star — the ✦ core marker

struct CoreStar: View {
    let on: Bool

    var body: some View {
        Text("✦")
            .font(.system(size: 15))
            .foregroundStyle(on ? Palette.ochre : Palette.starOff)
    }
}

// MARK: - TopBar
//
// The prototype's `← Library` row, drawn inline at the top of the scroll
// content exactly as on desktop (01 § 3.5). The system navigation bar is hidden
// on these screens: iOS 26 gives toolbar items a glass background and lets
// content scroll under them, neither of which belongs in this design.

struct TopBar<Trailing: View>: View {
    let backLabel: String
    @ViewBuilder var trailing: Trailing
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        HStack {
            Button { dismiss() } label: {
                HStack(spacing: 5) {
                    Image(systemName: "chevron.left").font(.system(size: 11, weight: .medium))
                    Text(backLabel).font(.ui(13))
                }
                .foregroundStyle(Palette.muted3)
                .fixedSize()
                // Never below a 44pt hit target.
                .frame(height: 44, alignment: .leading)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            Spacer(minLength: 12)
            trailing
        }
    }
}

extension TopBar where Trailing == EmptyView {
    init(_ backLabel: String) {
        self.init(backLabel: backLabel) { EmptyView() }
    }
}

/// The 30pt square nav buttons on the detail screen. Just the face — the caller
/// wraps it in whichever Button or NavigationLink it needs.
struct SquareNavIcon: View {
    let systemImage: String

    var body: some View {
        Image(systemName: systemImage)
            .font(.system(size: 11, weight: .medium))
            .foregroundStyle(Palette.muted3)
            .frame(width: 30, height: 30)
            .background(RoundedRectangle(cornerRadius: 7).fill(Palette.surface))
            .overlay(RoundedRectangle(cornerRadius: 7).strokeBorder(Palette.line))
            // Never below a 44pt hit target.
            .frame(width: 44, height: 44)
            .contentShape(Rectangle())
    }
}

// MARK: - Hairline

struct Hairline: View {
    var colour: Color = Palette.lineRow
    var body: some View { Rectangle().fill(colour).frame(height: 1) }
}

// MARK: - Pill buttons

struct PrimaryPillButton: View {
    let title: String
    var filled = true
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.ui(14.5, .medium))
                .foregroundStyle(filled ? Palette.onDark : Palette.ochreDeep)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(Capsule().fill(filled ? Palette.ink : Palette.ochreTint))
        }
        .buttonStyle(.plain)
    }
}

struct OutlineButton: View {
    let title: String
    var danger = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.ui(13))
                .foregroundStyle(danger ? Palette.danger : Palette.muted)
                .padding(.horizontal, 14)
                .padding(.vertical, 9)
                .background(RoundedRectangle(cornerRadius: 8).strokeBorder(Palette.line))
        }
        .buttonStyle(.plain)
    }
}
