import db from '../../db/connection';
import { Order, OrderItem, Customer, OrderWithDetails } from '../../types/db';

export function getOrderDetails(orderId: number): OrderWithDetails | null {
  const orderQuery = db.prepare(`
    SELECT 
      o.*,
      c.name as customer_name,
      c.email as customer_email,
      c.phone as customer_phone,
      c.city as customer_city,
      c.joined_at as customer_joined_at,
      c.loyalty_tier,
      c.wallet_balance_inr as customer_wallet_balance_inr,
      r.name as restaurant_name,
      r.cuisine as restaurant_cuisine,
      r.city as restaurant_city,
      r.area as restaurant_area,
      r.joined_at as restaurant_joined_at,
      rider.name as rider_name,
      rider.phone as rider_phone,
      rider.city as rider_city,
      rider.joined_at as rider_joined_at
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN restaurants r ON o.restaurant_id = r.id
    LEFT JOIN riders rider ON o.rider_id = rider.id
    WHERE o.id = ?
  `);

  const order = orderQuery.get(orderId) as any;

  if (!order) return null;

  // Get order items
  const itemsQuery = db.prepare(`
    SELECT * FROM order_items WHERE order_id = ?
  `);

  const items = itemsQuery.all(orderId) as OrderItem[];

  return {
    id: order.id,
    customer_id: order.customer_id,
    restaurant_id: order.restaurant_id,
    rider_id: order.rider_id,
    placed_at: order.placed_at,
    delivered_at: order.delivered_at,
    status: order.status,
    subtotal_inr: order.subtotal_inr,
    delivery_fee_inr: order.delivery_fee_inr,
    total_inr: order.total_inr,
    payment_method: order.payment_method,
    promo_code: order.promo_code,
    address: order.address,
    items,
    customer: {
      id: order.customer_id,
      name: order.customer_name,
      email: order.customer_email,
      phone: order.customer_phone,
      city: order.customer_city,
      joined_at: order.customer_joined_at,
      loyalty_tier: order.loyalty_tier,
      wallet_balance_inr: order.customer_wallet_balance_inr
    } as Customer,
    restaurant: {
      id: order.restaurant_id,
      name: order.restaurant_name,
      cuisine: order.restaurant_cuisine,
      city: order.restaurant_city,
      area: order.restaurant_area,
      joined_at: order.restaurant_joined_at
    }
  };
}

export function getCustomerHistory(customerId: number): {
  orders: Order[];
  total_orders: number;
  total_spend: number;
  loyalty_tier: string;
} {
  // Get customer info
  const customerQuery = db.prepare(`
    SELECT loyalty_tier FROM customers WHERE id = ?
  `);
  const customer = customerQuery.get(customerId) as any;

  // Get order history
  const ordersQuery = db.prepare(`
    SELECT * FROM orders 
    WHERE customer_id = ? 
    ORDER BY placed_at DESC
    LIMIT 20
  `);
  const orders = ordersQuery.all(customerId) as Order[];

  // Calculate stats
  const statsQuery = db.prepare(`
    SELECT 
      COUNT(*) as total_orders,
      COALESCE(SUM(total_inr), 0) as total_spend
    FROM orders 
    WHERE customer_id = ? AND status = 'delivered'
  `);
  const stats = statsQuery.get(customerId) as any;

  return {
    orders,
    total_orders: stats.total_orders,
    total_spend: stats.total_spend,
    loyalty_tier: customer?.loyalty_tier || 'bronze'
  };
}
