import { Brief } from '@/components/screens/Brief'

export const metadata = { title: 'Brief · Commonplace' }

export default async function PastBriefPage(props: PageProps<'/brief/[no]'>) {
  const { no } = await props.params
  return <Brief no={Number(no)} />
}
