import { Pitch } from '@/components/screens/Onboarding'

// The public route is the pitch, not a login wall. Someone arriving from the
// portfolio reads the argument before they are asked for anything (03 § 8).
export default function HomePage() {
  return <Pitch />
}
