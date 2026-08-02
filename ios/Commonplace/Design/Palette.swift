import SwiftUI

/// Every colour in the product, named — 01-design-spec.md § 1.1.
///
/// Warm paper and ink. Every neutral carries a yellow-brown cast; there are no
/// cool greys and no pure white or black anywhere in this design.
enum Palette {

    // MARK: Surfaces

    static let ground        = Color(hex: 0xF5F1E9)  // page background, everywhere
    static let groundSunk    = Color(hex: 0xEFEADD)  // tab bar
    static let surface       = Color(hex: 0xFCFAF4)  // cards, panels, inputs
    static let surfaceInset  = Color(hex: 0xF5F1E7)  // inputs inside a surface card
    static let rowHover      = Color(hex: 0xFAF6EC)  // pressed / selected row fill
    static let segmentTrack  = Color(hex: 0xEDE7D9)  // segmented control trough
    static let segmentActive = Color(hex: 0xFDFBF6)  // active pill
    static let avatar        = Color(hex: 0xE7DFCC)
    static let avatarLarge   = Color(hex: 0xDFD5BF)
    static let chip          = Color(hex: 0xEFE9DA)  // untagged / suggestion chip
    static let chipHover     = Color(hex: 0xE7DFC9)

    // MARK: Ink

    static let ink       = Color(hex: 0x191713)  // headlines, primary text, dark buttons
    static let inkSoft   = Color(hex: 0x2E2921)  // brief prose, detail summary, row titles
    static let inkBody   = Color(hex: 0x3A342B)  // concepts, actionables
    static let muted     = Color(hex: 0x5C554A)  // secondary prose, row summary
    static let muted2    = Color(hex: 0x6E6555)  // item summaries in brief, avatar initials
    static let muted3    = Color(hex: 0x7C7466)  // descriptions, subheads, inactive segment
    static let faint     = Color(hex: 0x918879)  // eyebrows, metadata, dates
    static let fainter   = Color(hex: 0xA79E8A)  // counts, footnotes
    static let faintest  = Color(hex: 0xB3A992)  // timestamps, "No." numerals
    static let onDark    = Color(hex: 0xF7F3EA)  // text on ink buttons and the toast
    static let onOchre   = Color(hex: 0xFDFBF6)  // text on ochre buttons
    static let reviewed  = Color(hex: 0x8C8272)  // the "Reviewed" state label

    // MARK: Accent — ochre. The only accent in the product.

    static let ochre         = Color(hex: 0xA2731F)
    static let ochreDeep     = Color(hex: 0x7E570F)
    static let ochreLine     = Color(hex: 0xC9AE79)  // input focus border
    static let ochreLineSoft = Color(hex: 0xDDCBA6)  // underline on inline links
    static let ochreTint     = Color(hex: 0xEFE3CB)  // active-state fill

    /// Disagreement is visually distinct from agreement — any connection reason
    /// containing "opposite" renders in this, never in ochre.
    static let disagree = Color(hex: 0x8A5441)

    // MARK: Lines — all 1pt

    static let line        = Color(hex: 0xE4DDCE)  // card borders, section rules
    static let lineRow     = Color(hex: 0xEAE3D4)  // row separators
    static let lineFaint   = Color(hex: 0xEFE9DC)  // separators inside cards
    static let lineSidebar = Color(hex: 0xE2DACA)  // tab bar top hairline
    static let lineStrong  = Color(hex: 0xD8CEB8)  // brief header/footer, dashed border

    // MARK: Functional

    static let starOff   = Color(hex: 0xD5CCB8)  // ✦ when not core
    static let toggleOff = Color(hex: 0xDDD5C2)
    static let knob      = Color(hex: 0xFDFBF6)
    static let sync      = Color(hex: 0x7A8B5A)  // the one green in the product
    static let danger    = Color(hex: 0x8C4A3A)
    static let permDot   = Color(hex: 0xC9BFA8)  // inactive onboarding permission dot

    // MARK: Tag palette — semantic, 5 families

    /// A tag's colour comes from its family, not from a hash.
    static func tagHue(_ name: String) -> (bg: Color, fg: Color) {
        switch name {
        case "Business", "Pricing", "Distribution", "Hiring":
            return (Color(hex: 0xF1E7D3), Color(hex: 0x7C5710))   // Commerce
        case "Health", "Sleep":
            return (Color(hex: 0xE4EADA), Color(hex: 0x4E6137))   // Body
        case "Psychology", "Decisions", "Self":
            return (Color(hex: 0xE1E7ED), Color(hex: 0x456079))   // Mind
        case "Writing", "Career", "Tools", "Attention":
            return (Color(hex: 0xF2E4DD), Color(hex: 0x8A5441))   // Craft
        case "Philosophy", "Leverage":
            return (Color(hex: 0xEAE3EC), Color(hex: 0x6A5171))   // Meaning
        default:
            return (Color(hex: 0xEFE9DA), Color(hex: 0x6E6555))   // user-added
        }
    }

    /// Library → Group by Theme. Maps from the same five families.
    static func theme(for tags: [String]) -> String {
        for tag in tags {
            switch tag {
            case "Business", "Pricing", "Distribution", "Hiring": return "Business & pricing"
            case "Health", "Sleep":                               return "Health"
            case "Psychology", "Decisions", "Self":               return "Psychology & decisions"
            case "Writing", "Career", "Tools", "Attention":       return "Craft & career"
            case "Philosophy", "Leverage":                        return "Philosophy & leverage"
            default: continue
            }
        }
        return "Everything else"
    }
}

extension Color {
    init(hex: UInt32) {
        self.init(
            .sRGB,
            red:     Double((hex >> 16) & 0xFF) / 255,
            green:   Double((hex >> 8) & 0xFF) / 255,
            blue:    Double(hex & 0xFF) / 255,
            opacity: 1
        )
    }
}
