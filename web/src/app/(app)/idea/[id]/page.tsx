import { Detail } from '@/components/screens/Detail'

export const metadata = { title: 'Idea · Commonplace' }

export default async function IdeaPage(props: PageProps<'/idea/[id]'>) {
  const { id } = await props.params
  return <Detail id={Number(id)} />
}
