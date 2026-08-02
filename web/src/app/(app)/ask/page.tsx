import { Suspense } from 'react'
import { Ask } from '@/components/screens/Ask'

export const metadata = { title: 'Ask your library · Commonplace' }

export default function AskPage() {
  return (
    <Suspense fallback={null}>
      <Ask />
    </Suspense>
  )
}
