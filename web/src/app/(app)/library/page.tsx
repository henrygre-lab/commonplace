import { Suspense } from 'react'
import { Library } from '@/components/screens/Library'

export const metadata = { title: 'Library · Commonplace' }

export default function LibraryPage() {
  return (
    <Suspense fallback={null}>
      <Library />
    </Suspense>
  )
}
