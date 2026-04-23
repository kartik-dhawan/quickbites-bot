// Database types based on schema.md

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  city: string;
  joined_at: string;
  loyalty_tier: 'bronze' | 'silver' | 'gold';
  wallet_balance_inr: number;
}

export interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  city: string;
  area: string;
  joined_at: string;
}

export interface Rider {
  id: number;
  name: string;
  phone: string;
  city: string;
  joined_at: string;
}

export interface Order {
  id: number;
  customer_id: number;
  restaurant_id: number;
  rider_id: number | null;
  placed_at: string;
  delivered_at: string | null;
  status: 'delivered' | 'cancelled';
  subtotal_inr: number;
  delivery_fee_inr: number;
  total_inr: number;
  payment_method: 'upi' | 'card' | 'wallet' | 'cod';
  promo_code: string | null;
  address: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  item_name: string;
  qty: number;
  price_inr: number;
}

export interface Complaint {
  id: number;
  customer_id: number;
  order_id: number;
  target_type: 'restaurant' | 'rider' | 'app';
  target_id: number | null;
  raised_at: string;
  description: string;
  status: 'open' | 'resolved' | 'rejected';
  resolution: 'refund_full' | 'refund_partial' | 'credit' | 'apology' | 'none';
  resolution_amount_inr: number;
}

export interface Refund {
  id: number;
  customer_id: number;
  order_id: number;
  amount_inr: number;
  type: 'cash' | 'wallet_credit';
  issued_at: string;
  reason: string;
}

export interface Review {
  id: number;
  customer_id: number;
  order_id: number;
  restaurant_id: number;
  rating: number; // 1-5
  comment: string;
  created_at: string;
}

export interface RiderIncident {
  id: number;
  rider_id: number;
  order_id: number;
  type: 'late' | 'rude' | 'damaged' | 'theft_claim';
  reported_at: string;
  verified: number; // 0 or 1
  notes: string;
}

// Extended types with joins
export interface OrderWithDetails extends Order {
  customer?: Customer;
  restaurant?: Restaurant;
  rider?: Rider;
  items?: OrderItem[];
}

export interface CustomerWithStats extends Customer {
  total_orders?: number;
  total_complaints?: number;
  complaint_rate?: number;
  recent_refunds?: number;
}
