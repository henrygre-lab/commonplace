import Foundation
import Observation

@Observable
final class Store {

    // MARK: Corpus

    var bookmarks: [Bookmark] = []
    var briefs: [Brief] = []
    var relations: [Int: [Relation]] = [:]
    var askCorpus: [AskAnswer] = []

    // MARK: UI state

    var query = ""
    var filter: Filter = .all
    var activeTag: String?
    var groupBy: GroupBy = .date
    var readBriefs: Set<Int> = [141, 140, 139, 138]
    var settings = AppSettings()
    var toast: String?

    // MARK: Display constants — the prototype's theatre, kept deliberately
    //
    // This is a portfolio build: it has to look like a product in real use, so
    // these are NOT computed from `bookmarks.count`. The web app does the
    // opposite and shows real counts. See 02-interactions-and-state.md § 2.

    let totalIdeas = "1,284"
    let briefCount = 142
    let archiveCount = 143
    let unreviewedCount = 89
    let connectionsTotal = "1,284"
    let syncedAgo = "6 min"
    let archiveSince = "4 March"

    private var toastTask: Task<Void, Never>?

    // MARK: Load

    init() { load() }

    private func load() {
        guard
            let url = Bundle.main.url(forResource: "Seed", withExtension: "json"),
            let data = try? Data(contentsOf: url),
            let seed = try? JSONDecoder().decode(SeedFile.self, from: data)
        else {
            assertionFailure("Seed.json is missing from the bundle")
            return
        }

        bookmarks = seed.bookmarks
        briefs = seed.briefs
        askCorpus = seed.askCorpus

        var graph: [Int: [Relation]] = [:]
        for (key, rows) in seed.relations {
            guard let from = Int(key) else { continue }
            graph[from] = rows.compactMap { row in
                guard let id = row.first?.intValue, let reason = row.last?.stringValue else { return nil }
                // A reason of "Related" or "Similar" is a failure — drop the row.
                guard !["related", "similar"].contains(reason.lowercased()) else { return nil }
                return Relation(id: id, reason: reason)
            }
        }
        relations = graph
    }

    // MARK: Lookup
    //
    // Briefs, connections and Ask answers all reference bookmarks BY ID and
    // hydrate at read time. Nothing is denormalised, so marking something
    // reviewed in the library updates it inside the brief too.

    func bookmark(_ id: Int) -> Bookmark? { bookmarks.first { $0.id == id } }

    func hydrate(_ ids: [Int]) -> [Bookmark] { ids.compactMap(bookmark) }

    func related(_ id: Int) -> [(relation: Relation, bookmark: Bookmark)] {
        (relations[id] ?? []).compactMap { r in
            guard let b = bookmark(r.id) else { return nil }
            return (r, b)
        }
    }

    // MARK: Mutations

    func toggleReviewed(_ id: Int) {
        guard let i = bookmarks.firstIndex(where: { $0.id == id }) else { return }
        bookmarks[i].reviewed.toggle()
        flash(bookmarks[i].reviewed ? "Marked reviewed" : "Moved back to unreviewed")
    }

    func toggleCore(_ id: Int) {
        guard let i = bookmarks.firstIndex(where: { $0.id == id }) else { return }
        bookmarks[i].core.toggle()
        flash(bookmarks[i].core ? "Added to core — resurfaces more often" : "Removed from core")
    }

    func setNote(_ id: Int, _ note: String) {
        guard let i = bookmarks.firstIndex(where: { $0.id == id }) else { return }
        bookmarks[i].note = note
    }

    func addTag(_ id: Int, _ tag: String) {
        let t = tag.trimmingCharacters(in: .whitespaces)
        guard !t.isEmpty, let i = bookmarks.firstIndex(where: { $0.id == id }),
              !bookmarks[i].tags.contains(t) else { return }
        bookmarks[i].tags.append(t)
    }

    func removeTag(_ id: Int, _ tag: String) {
        guard let i = bookmarks.firstIndex(where: { $0.id == id }) else { return }
        bookmarks[i].tags.removeAll { $0 == tag }
    }

    func toggleBriefRead(_ no: Int) {
        if readBriefs.contains(no) {
            readBriefs.remove(no)
        } else {
            readBriefs.insert(no)
            // Toasts only when marking read, not when unmarking.
            flash("Brief marked read · next one at \(settings.time)")
        }
    }

    func isRead(_ no: Int) -> Bool { readBriefs.contains(no) }

    /// The toast auto-dismisses after 1.9s.
    func flash(_ message: String) {
        toastTask?.cancel()
        toast = message
        toastTask = Task { @MainActor [weak self] in
            try? await Task.sleep(for: .milliseconds(1900))
            guard !Task.isCancelled else { return }
            self?.toast = nil
        }
    }

    // MARK: Derived

    /// Filtered by filter, then activeTag, then a case-insensitive substring
    /// match of query against title + summary + author + tags.
    var visible: [Bookmark] {
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        return bookmarks.filter { b in
            if filter == .unreviewed && b.reviewed { return false }
            if filter == .core && !b.core { return false }
            if let tag = activeTag, !b.tags.contains(tag) { return false }
            guard !q.isEmpty else { return true }
            let hay = "\(b.title) \(b.summary) \(b.author) \(b.tags.joined(separator: " "))"
            return hay.lowercased().contains(q)
        }
    }

    struct Bucket: Identifiable {
        var id: String { label }
        let label: String
        let items: [Bookmark]
    }

    /// Theme buckets sort by descending size; `.none` yields one unlabelled bucket.
    var buckets: [Bucket] {
        let items = visible
        guard groupBy != .none else {
            return items.isEmpty ? [] : [Bucket(label: "", items: items)]
        }

        var order: [String] = []
        var grouped: [String: [Bookmark]] = [:]
        for b in items {
            let key = groupBy == .date ? Self.monthGroup(b.date) : Palette.theme(for: b.tags)
            if grouped[key] == nil { order.append(key) }
            grouped[key, default: []].append(b)
        }

        let result = order.map { Bucket(label: $0, items: grouped[$0] ?? []) }
        return groupBy == .theme ? result.sorted { $0.items.count > $1.items.count } : result
    }

    /// Tags with counts, alphabetical — the desktop sidebar's tag list becomes a
    /// horizontally scrolling row above the library.
    var tagList: [(name: String, count: Int)] {
        var counts: [String: Int] = [:]
        for b in bookmarks { for t in b.tags { counts[t, default: 0] += 1 } }
        // Counts keep the prototype's scaling so the library looks lived-in.
        return counts.keys.sorted().map { ($0, counts[$0]! * 17 + 6) }
    }

    private static let months = [
        "Jan": "January", "Feb": "February", "Mar": "March", "Apr": "April",
        "May": "May", "Jun": "June", "Jul": "July", "Aug": "August",
        "Sep": "September", "Oct": "October", "Nov": "November", "Dec": "December",
    ]

    static func monthGroup(_ date: String) -> String {
        let parts = date.split(separator: " ")
        let month = parts.count > 1 ? String(parts[1]) : ""
        return "\(months[month] ?? month) 2026"
    }

    // MARK: Ask
    //
    // There is no error state and no empty-result illustration. A miss is framed
    // as information about the library rather than about the question.

    func answer(for question: String) -> AskAnswer {
        let q = question.lowercased()

        if let hit = askCorpus.first(where: { $0.keys.contains { q.contains($0) } }) {
            return hit
        }

        let needle = q.split(separator: " ").first { $0.count > 3 }.map(String.init) ?? q
        let matches = bookmarks.filter {
            "\($0.title) \($0.summary) \($0.tags.joined(separator: " "))"
                .lowercased().contains(needle)
        }.prefix(3)

        if !matches.isEmpty {
            return AskAnswer(
                keys: [],
                label: "Across \(matches.count) loosely related saves",
                paras: [
                    "Nothing in your library answers that directly. The closest saves are below — they touch the question without settling it.",
                    "If this is a live question for you, it is worth saving deliberately rather than waiting for it to turn up.",
                ],
                ids: matches.map(\.id)
            )
        }

        return AskAnswer(
            keys: [],
            label: "No matches",
            paras: ["Nothing you have saved speaks to that. That is useful information about the library rather than about the question."],
            ids: []
        )
    }

    static let askSuggestions = [
        "What have I saved about pricing strategy?",
        "What do my saves say about building in public?",
        "Everything on sleep and energy",
        "How do I decide faster?",
    ]
}
