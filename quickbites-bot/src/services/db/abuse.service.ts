import db from '../../db/connection';

export function getRecentRefunds(customerId: number, days: number = 30): {
  total_refunded: number;
  refund_count: number;
  refunds: Array<{
    order_id: number;
    amount_inr: number;
    type: string;
    issued_at: string;
    reason: string;
  }>;
} {
  const refundsQuery = db.prepare(`
    SELECT 
      order_id,
      amount_inr,
      type,
      issued_at,
      reason
    FROM refunds 
    WHERE customer_id = ? 
      AND issued_at >= date('2026-04-13', '-${days} days')
    ORDER BY issued_at DESC
  `);
  
  const refunds = refundsQuery.all(customerId) as any[];
  const total_refunded = refunds.reduce((sum, refund) => sum + refund.amount_inr, 0);
  
  return {
    total_refunded,
    refund_count: refunds.length,
    refunds
  };
}

export function getComplaintRatio(customerId: number): {
  total_orders: number;
  total_complaints: number;
  complaint_rate: number;
  rejected_complaints: number;
  rejection_rate: number;
} {
  // Get total orders
  const ordersQuery = db.prepare(`
    SELECT COUNT(*) as count
    FROM orders 
    WHERE customer_id = ?
  `);
  
  const ordersResult = ordersQuery.get(customerId) as any;
  const total_orders = ordersResult.count || 0;
  
  // Get complaint stats
  const complaintsQuery = db.prepare(`
    SELECT 
      COUNT(*) as total_complaints,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_complaints
    FROM complaints 
    WHERE customer_id = ?
  `);
  
  const complaintsResult = complaintsQuery.get(customerId) as any;
  const total_complaints = complaintsResult.total_complaints || 0;
  const rejected_complaints = complaintsResult.rejected_complaints || 0;
  
  const complaint_rate = total_orders > 0 ? (total_complaints / total_orders) * 100 : 0;
  const rejection_rate = total_complaints > 0 ? (rejected_complaints / total_complaints) * 100 : 0;
  
  return {
    total_orders,
    total_complaints,
    complaint_rate,
    rejected_complaints,
    rejection_rate
  };
}

export function getAbuseIndicators(customerId: number): {
  is_new_account: boolean;
  high_complaint_rate: boolean;
  high_refund_frequency: boolean;
  high_rejection_rate: boolean;
  risk_score: number; // 0-100
} {
  // Check if account is new (< 30 days)
  const customerQuery = db.prepare(`
    SELECT joined_at FROM customers WHERE id = ?
  `);
  const customer = customerQuery.get(customerId) as any;
  
  const joinedDate = new Date(customer?.joined_at || '2026-01-01');
  const today = new Date('2026-04-13');
  const daysSinceJoined = Math.floor((today.getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24));
  const is_new_account = daysSinceJoined < 30;
  
  // Get complaint and refund metrics
  const complaintMetrics = getComplaintRatio(customerId);
  const refundMetrics = getRecentRefunds(customerId, 30);
  
  // Determine abuse indicators
  const high_complaint_rate = complaintMetrics.complaint_rate > 20; // >20% of orders
  const high_refund_frequency = refundMetrics.refund_count > 3; // >3 refunds in 30 days
  const high_rejection_rate = complaintMetrics.rejection_rate > 50; // >50% rejected
  
  // Calculate risk score
  let risk_score = 0;
  if (is_new_account) risk_score += 25;
  if (high_complaint_rate) risk_score += 30;
  if (high_refund_frequency) risk_score += 25;
  if (high_rejection_rate) risk_score += 20;
  
  return {
    is_new_account,
    high_complaint_rate,
    high_refund_frequency,
    high_rejection_rate,
    risk_score
  };
}
