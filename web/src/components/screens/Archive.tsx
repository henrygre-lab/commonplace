'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCounts, useStore } from '@/lib/store'

export function Archive() {
  const pathname = usePathname()
  const { briefs, briefsRead } = useStore()
  const counts = useCounts()

  // Real counts, not the prototype's hard-coded 143 / 1,284 (02 § 2).
  const since = briefs[briefs.length - 1]?.dateShort ?? ''
  const current = briefs[0]?.no

  return (
    <div
      className="mx-auto w-full max-w-[900px] pb-[100px] pt-[52px] md:pt-[104px] lg:pt-[52px]"
      style={{ paddingLeft: 'clamp(24px,4vw,56px)', paddingRight: 'clamp(24px,4vw,56px)' }}
    >
      <h1 className="mb-2 font-serif text-[38px] text-ink" style={{ letterSpacing: '-0.022em' }}>
        Past briefs
      </h1>
      <p className="mb-[38px] font-sans text-[13.5px] text-muted-3">
        {counts.briefs} {counts.briefs === 1 ? 'brief' : 'briefs'} since {since} · {counts.ideas}{' '}
        ideas passed through them
      </p>

      {briefs.map((b) => {
        const read = !!briefsRead[b.no]
        const isCurrent = pathname === '/briefs' ? b.no === current : false
        return (
          <Link
            key={b.no}
            href={`/brief/${b.no}`}
            className={`grid items-start gap-[26px] border-b border-line-row py-6 pr-[6px] transition-colors duration-[150ms] hover:bg-row-hover ${
              isCurrent ? 'bg-row-hover' : ''
            }`}
            style={{ gridTemplateColumns: '92px minmax(240px,1fr) 96px' }}
          >
            <div>
              <div className="font-serif text-[17px] text-ink-soft">{b.dateShort}</div>
              <div className="mt-[3px] font-sans text-[11.5px] text-faintest">No. {b.no}</div>
            </div>

            <div className="min-w-0">
              <div
                className="pretty mb-[7px] font-serif"
                style={{ fontSize: 19, lineHeight: 1.34, color: read ? '#5C554A' : '#191713' }}
              >
                {b.headline}
              </div>
              <div
                className="pretty font-sans text-muted-3"
                style={{ fontSize: 13.5, lineHeight: 1.56 }}
              >
                {b.lede}
              </div>
            </div>

            <div className="text-right">
              <div
                className="whitespace-nowrap font-sans uppercase"
                style={{ fontSize: 10.5, letterSpacing: '0.1em', color: read ? '#A79E8A' : '#A2731F' }}
              >
                {read ? 'Read' : 'Unread'}
              </div>
              <div className="mt-[6px] font-sans text-[11.5px] text-faintest">
                {b.itemIds.length + 1} ideas
              </div>
            </div>
          </Link>
        )
      })}

      <p className="mt-[34px] font-sans text-[12.5px] text-fainter">
        Briefs older than ninety days are summarised into your monthly digest.
      </p>
    </div>
  )
}
