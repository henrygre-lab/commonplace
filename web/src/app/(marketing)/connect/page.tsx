import { Connect } from '@/components/screens/Onboarding'

export const metadata = { title: 'Connect your X account · Commonplace' }

// Auth.js sends refusals back here as ?error=AccessDenied rather than to its
// own error page, so the screen can explain the allowlist in our own words.
export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>
}) {
  const { error } = await searchParams
  return <Connect error={Array.isArray(error) ? error[0] : error} />
}
