import Foundation

// Data shapes — 01-design-spec.md § 2.

struct Bookmark: Identifiable, Codable, Hashable {
    let id: Int
    let author: String
    let handle: String
    /// Kept as the display string. There is no date maths in this app.
    let date: String
    var tags: [String]
    /// THE EXTRACTED IDEA, as a claim.
    let title: String
    /// 2 sentences, ~40 words, the argument in the reader's own voice.
    let summary: String
    let concepts: [String]
    let actions: [String]
    /// The raw post, \n\n between paragraphs.
    let original: String
    let likes: String
    let reposts: String
    var reviewed: Bool
    /// Starred; resurfaces more often, never expires.
    var core: Bool
    var note: String

    /// Derived at decode time — first letter of the first two words of `author`.
    var initials: String {
        author.split(separator: " ").prefix(2).compactMap { $0.first }.map(String.init).joined()
    }
}

struct Brief: Identifiable, Codable, Hashable {
    var id: Int { no }
    let no: Int
    let dateLine: String
    let shortDateLine: String
    let dateShort: String
    let mins: String
    let shortMins: String
    let headline: String
    let lede: String
    let paras: [String]
    let closer: String
    /// The count word here must match `itemIds.count`.
    let sectionLabel: String
    let itemIds: [Int]
    let resId: Int
    let resLabel: String
    let resLabelShort: String
    let promptQ: String
    let promptA: String
    let promptSourceId: Int
    let promptSource: String
}

/// `[relatedId, reason]`. The reason is the product: it names WHY two saves
/// connect. "Related" is a failure; "Argues the opposite" is the feature.
struct Relation: Hashable {
    let id: Int
    let reason: String

    /// Disagreement is visually distinct from agreement.
    var disagrees: Bool { reason.lowercased().contains("opposite") }
}

struct AskAnswer: Codable, Hashable {
    /// Trigger keywords.
    let keys: [String]
    let label: String
    /// 2 paragraphs; the 2nd names a GAP in the library.
    let paras: [String]
    /// Cited sources.
    let ids: [Int]
}

enum Filter: String, CaseIterable {
    case all, unreviewed, core
    var label: String {
        switch self {
        case .all:        return "All"
        case .unreviewed: return "Unreviewed"
        case .core:       return "Core"
        }
    }
}

enum GroupBy: String, CaseIterable {
    case date, theme, none
    var label: String {
        switch self {
        case .date:  return "Date"
        case .theme: return "Theme"
        case .none:  return "None"
        }
    }
}

struct AppSettings {
    var time = "07:00"
    var freq = "Daily"
    var email = true
    var push = false
    /// "Include a recall prompt".
    var spaced = true
}

// MARK: - Seed.json

struct SeedFile: Decodable {
    let bookmarks: [Bookmark]
    let briefs: [Brief]
    /// JSON object keys are strings; rebuilt into `[Int: [Relation]]` on load.
    let relations: [String: [[RelationField]]]
    let askCorpus: [AskAnswer]
}

/// A relation row is a mixed array — `[12, "Argues the opposite"]`.
enum RelationField: Decodable {
    case id(Int)
    case reason(String)

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if let i = try? c.decode(Int.self) { self = .id(i) }
        else { self = .reason(try c.decode(String.self)) }
    }

    var intValue: Int? { if case .id(let i) = self { return i }; return nil }
    var stringValue: String? { if case .reason(let s) = self { return s }; return nil }
}
