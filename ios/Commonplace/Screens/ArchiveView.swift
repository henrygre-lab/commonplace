import SwiftUI

/// 01-design-spec.md § 3.6. Reached from the brief's "All briefs" link and
/// pushed onto the Brief stack — Past briefs is not a tab.
struct ArchiveView: View {
    @Environment(Store.self) private var store

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                TopBar("Brief").padding(.bottom, 10)

                Text("Past briefs").pageTitle().padding(.bottom, 6)

                Text("\(store.archiveCount) briefs since \(store.archiveSince) · \(store.totalIdeas) ideas passed through them")
                    .font(.ui(13.5))
                    .foregroundStyle(Palette.muted3)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.bottom, 26)

                ForEach(Array(store.briefs.enumerated()), id: \.element.no) { index, brief in
                    let read = store.isRead(brief.no)
                    NavigationLink(value: Route.brief(brief.no)) {
                        VStack(alignment: .leading, spacing: 0) {
                            HStack(alignment: .firstTextBaseline) {
                                Text(brief.dateShort).font(.serif(17)).foregroundStyle(Palette.inkSoft)
                                Text("No. \(brief.no)").font(.ui(11.5)).foregroundStyle(Palette.faintest)
                                Spacer(minLength: 8)
                                Text(read ? "READ" : "UNREAD")
                                    .stateLabel(read ? Palette.fainter : Palette.ochre)
                            }
                            .padding(.bottom, 8)

                            Text(brief.headline)
                                .font(.serif(19)).lineHeight(19, 1.34)
                                .foregroundStyle(read ? Palette.muted : Palette.ink)
                                .fixedSize(horizontal: false, vertical: true)
                                .padding(.bottom, 6)

                            Text(brief.lede)
                                .font(.ui(13.5)).lineHeight(13.5, 1.56)
                                .foregroundStyle(Palette.muted3)
                                .fixedSize(horizontal: false, vertical: true)
                                .padding(.bottom, 6)

                            Text("\(brief.itemIds.count + 1) ideas")
                                .font(.ui(11.5)).foregroundStyle(Palette.faintest)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.vertical, 20)
                        .padding(.horizontal, index == 0 ? 12 : 0)
                        // The current brief's row is filled.
                        .background(index == 0 ? Palette.rowHover : .clear)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    Hairline()
                }

                Text("Briefs older than ninety days are summarised into your monthly digest.")
                    .font(.ui(12.5)).foregroundStyle(Palette.fainter)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 26)
            }
            .padding(.horizontal, 22)
            .padding(.top, 4)
            .padding(.bottom, 46 + 56)
        }
        .scrollIndicators(.hidden)
        .background(Palette.ground)
        .toolbar(.hidden, for: .navigationBar)
    }
}
