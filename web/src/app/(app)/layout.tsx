import { AppShell } from '@/components/AppShell'
import { StoreProvider } from '@/lib/store'

// The store lives in the layout so corpus state survives navigation between
// screens: marking something reviewed in the library updates it inside the brief.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <AppShell>{children}</AppShell>
    </StoreProvider>
  )
}
