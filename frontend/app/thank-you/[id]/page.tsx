import { OrderThankYou } from '@/components/order-thank-you'

export default async function ThankYouPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <section className="store-shell py-16"><OrderThankYou id={id} /></section>
}
