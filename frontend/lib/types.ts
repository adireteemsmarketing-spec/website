export type Product = {
  id: string
  name: string
  slug: string
  description_short: string
  description_long: string
  category_id: string
  base_price: number
  is_featured: boolean
  status: 'active' | 'draft' | 'archived'
  created_at: string
  updated_at: string
}

export type ProductVariant = {
  id: string
  product_id: string
  size: string
  color: string
  sku: string
  price_override: number | null
  in_stock: boolean
  created_at: string
  updated_at: string
}

export type ProductImage = {
  id: string
  product_id: string
  storage_path: string
  sort_order: number
  created_at: string
}

export type Category = {
  id: string
  name: string
  slug: string
  parent_id: string | null
  created_at: string
}

export type CartItem = {
  id: string
  cart_id: string
  variant_id: string
  quantity: number
  created_at: string
}

export type Order = {
  id: string
  customer_id: string
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  subtotal: number
  delivery_fee: number
  total: number
  currency: string
  payment_provider: 'paystack' | 'flutterwave'
  payment_reference: string
  created_at: string
  updated_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  variant_id: string
  quantity: number
  unit_price: number
}

export type Profile = {
  id: string
  user_id: string
  role: 'user' | 'sales_rep' | 'admin' | 'super_admin'
  full_name: string
  phone: string | null
  created_at: string
  updated_at: string
}
