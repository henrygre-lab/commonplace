import SwiftUI

/// Two typefaces. Newsreader for anything editorial, Instrument Sans for UI.
/// Never a third.
extension Font {

    /// Newsreader. The PostScript names carry the optical-size instance that
    /// Google Fonts served, so they are not simply "Newsreader-Regular".
    static func serif(_ size: CGFloat) -> Font {
        .custom("Newsreader16pt16pt-Regular", size: size)
    }

    static func serifItalic(_ size: CGFloat) -> Font {
        .custom("Newsreader16pt16pt-Italic", size: size)
    }

    /// Instrument Sans. Custom fonts do not respond reliably to `.weight()`,
    /// so each weight resolves to its own face.
    static func ui(_ size: CGFloat, _ weight: Font.Weight = .regular) -> Font {
        switch weight {
        case .medium:
            return .custom("InstrumentSans-Medium", size: size)
        case .semibold, .bold, .heavy, .black:
            return .custom("InstrumentSans-SemiBold", size: size)
        default:
            return .custom("InstrumentSans-Regular", size: size)
        }
    }
}

/// CSS `line-height` is a multiplier of font size; SwiftUI's `lineSpacing` is
/// the gap *between* lines. CSS `letter-spacing` in em maps to `tracking`.
///
///     lineSpacing = size * (lineHeight - 1)
///     tracking    = size * em
extension View {
    func lineHeight(_ size: CGFloat, _ multiple: CGFloat) -> some View {
        lineSpacing(size * (multiple - 1))
    }
}

// MARK: - Text styles
//
// Every number in the type scale appears exactly once, here. Base is the iPhone
// scale in 01-design-spec.md § 1.2, extended with the phone values suggested in
// 04-swift-ios-app.md § 2 for the screens the prototype only shows on desktop.

extension View {

    // MARK: Editorial — Newsreader

    /// Brief headline: 31 / 1.16 / -0.02em
    func briefHeadline() -> some View {
        font(.serif(31)).tracking(-0.62).lineHeight(31, 1.16)
            .foregroundStyle(Palette.ink)
    }

    /// Brief body prose: 17.5 / 1.68
    func briefBody() -> some View {
        font(.serif(17.5)).lineHeight(17.5, 1.68).foregroundStyle(Palette.inkBody)
    }

    /// The closing line, italic.
    func briefCloser() -> some View {
        font(.serifItalic(17.5)).lineHeight(17.5, 1.68).foregroundStyle(Palette.muted)
    }

    /// Brief item title: 18 / 1.32
    func itemTitle() -> some View {
        font(.serif(18)).lineHeight(18, 1.32).foregroundStyle(Palette.ink)
    }

    /// Resurfaced + recall-prompt titles: 17–18 / 1.34–1.45
    func cardTitle(_ size: CGFloat = 18) -> some View {
        font(.serif(size)).lineHeight(size, 1.4).foregroundStyle(Palette.ink)
    }

    /// Page title — Library, Past briefs, Ask, Settings: 30 / -0.022em
    func pageTitle() -> some View {
        font(.serif(30)).tracking(-0.66).foregroundStyle(Palette.ink)
    }

    /// Detail h1: 29 / 1.16 / -0.022em
    func detailTitle() -> some View {
        font(.serif(29)).tracking(-0.64).lineHeight(29, 1.16).foregroundStyle(Palette.ink)
    }

    /// Detail summary: 18 / 1.62
    func detailSummary() -> some View {
        font(.serif(18)).lineHeight(18, 1.62).foregroundStyle(Palette.inkSoft)
    }

    /// Library row title: 17 / 1.34
    func rowTitle() -> some View {
        font(.serif(17)).lineHeight(17, 1.34).foregroundStyle(Palette.inkSoft)
    }

    /// Connection title: 16 / 1.34
    func connectionTitle() -> some View {
        font(.serif(16)).lineHeight(16, 1.34).foregroundStyle(Palette.inkSoft)
    }

    /// Ask answer paragraph: 18 / 1.68
    func askAnswer() -> some View {
        font(.serif(18)).lineHeight(18, 1.68).foregroundStyle(Palette.inkSoft)
    }

    // MARK: UI — Instrument Sans

    /// Library row summary: 14 / 1.55. Deliberately close in weight to the
    /// title — you scan the idea, not the headline.
    func rowSummary() -> some View {
        font(.ui(14)).lineHeight(14, 1.55).foregroundStyle(Palette.muted)
    }

    /// Brief item summary: 13.5 / 1.55
    func itemSummary() -> some View {
        font(.ui(13.5)).lineHeight(13.5, 1.55).foregroundStyle(Palette.muted2)
    }

    /// Body copy inside cards: 13.5 / 1.55
    func cardBody(_ colour: Color = Palette.inkBody) -> some View {
        font(.ui(13.5)).lineHeight(13.5, 1.55).foregroundStyle(colour)
    }

    /// Metadata: 12–12.5
    func meta(_ colour: Color = Palette.faint) -> some View {
        font(.ui(12.5)).foregroundStyle(colour)
    }

    /// Settings row title: 15, medium
    func settingsTitle() -> some View {
        font(.ui(15, .medium)).foregroundStyle(Palette.ink)
    }

    /// The state label on a row — New / Reviewed / Read / Unread.
    func stateLabel(_ colour: Color) -> some View {
        font(.ui(10.5)).tracking(1.05).foregroundStyle(colour)
    }
}
