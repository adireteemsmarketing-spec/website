export type Customer = { id: string; email: string; name: string; phone: string }
export type CustomerOrder = {
  id: string; order_number: string; status: string; created_at: string; updated_at: string; currency: string;
  subtotal: number; total: number; delivery_fee: number; tax: number;
  payment_provider: string | null; payment_reference: string | null;
  payments?: { id: string; provider: string; reference: string; amount: number; currency: string; status: string; verified_at: string | null; created_at: string; provider_mode: string | null }[];
  shipping_address: Record<string, string>;
  order_items: { id: string; product_name: string; size: string; quantity: number; unit_price: number }[];
  shipments: { id: string; status: string; carrier: string | null; tracking_number: string | null; tracking_url: string | null; estimated_delivery?: string | null; current_location?: string | null }[];
  order_events: { id: string; status: string; customer_note: string | null; created_at: string }[];
}
export const statusLabels: Record<string, string> = { pending: 'Awaiting payment', paid: 'Payment confirmed', processing: 'Preparing your order', shipped: 'On the route', out_for_delivery: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded' }
export function deliveryStatus(order: CustomerOrder) {
  if (['cancelled', 'refunded', 'delivered'].includes(order.status)) return order.status
  return order.shipments.some(s => s.status === 'out_for_delivery') ? 'out_for_delivery' : order.status
}
export function safeTrackingUrl(value: string | null) {
  try { const url = new URL(value || ''); return url.protocol === 'https:' ? url.href : null } catch { return null }
}
