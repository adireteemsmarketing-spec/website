import { OrderDetails } from '@/components/customer-orders'
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <section className="store-shell max-w-5xl"><OrderDetails id={id} /></section>
}
