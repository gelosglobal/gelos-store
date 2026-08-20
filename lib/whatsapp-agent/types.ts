export type WaCartItem = {
  product_id: string
  product_name: string
  variant: string | null
  quantity: number
  unit_price_ghs: number | null
}

export type WaOrderItem = WaCartItem & {
  line_total_ghs: number
}

export type WaCustomerRecord = {
  whatsapp_id: string
  display_name: string | null
  alternate_phone: string | null
  notes: string | null
}

export type WaCartRecord = {
  whatsapp_id: string
  delivery_area: string | null
  landmark: string | null
  latitude: number | null
  longitude: number | null
  location_url: string | null
  payment_method: string | null
  payment_notes: string | null
  order_notes: string | null
  items: WaCartItem[]
}

export type WaOrderRecord = {
  order_id: string
  whatsapp_id: string
  customer_name: string
  alternate_phone: string | null
  delivery_area: string
  landmark: string | null
  latitude: number | null
  longitude: number | null
  location_url: string | null
  payment_method: string
  payment_status: string
  subtotal_ghs: number
  delivery_fee_ghs: number
  total_ghs: number
  order_status: string
  notes: string | null
  customer_confirmed: boolean
  excel_sync_status: string
  excel_sync_error: string | null
  created_at: string
  updated_at: string
  items: WaOrderItem[]
}

export type WaHandoffRecord = {
  id: string
  whatsapp_id: string
  reason: string
  summary: string | null
  urgency: string
  status: string
  created_at: string
}

export type WaConversationMessage = {
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type WaCatalogProduct = {
  id: string
  name: string
  category?: string
  description?: string
  price_ghs: number | null
  stock_status?: string
  variants: string[]
  active?: boolean
}

export type WaShopConfig = {
  business_name: string
  assistant_name?: string
  currency?: string
  business_profile?: Record<string, unknown>
  default_delivery_fee_ghs: number
  delivery_zones: Array<{
    name: string
    aliases?: string[]
    fee_ghs: number
  }>
  payment_methods: Array<{
    id: string
    label: string
    instructions?: string
  }>
  policies?: Record<string, string>
  faqs?: Array<{ question: string; answer: string }>
  agent_unavailable_message?: string
}
