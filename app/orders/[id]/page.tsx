import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

/** Backend notifications use `actionUrl: /orders/:id`. Real UI lives at `/don-hang`. */
export default function OrderDeepLinkPage({ params }: { params: { id: string } }) {
  const id = params?.id
  if (!id || typeof id !== 'string') {
    redirect('/don-hang')
  }
  redirect(`/don-hang?order=${encodeURIComponent(id)}`)
}
