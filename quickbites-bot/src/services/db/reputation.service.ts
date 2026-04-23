import db from '../../db/connection';
import { RiderIncident, Review } from '../../types/db';

export function getRiderIncidents(riderId: number): {
  verified_incidents: number;
  unverified_incidents: number;
  total_incidents: number;
  incidents_by_type: Record<string, number>;
} {
  const incidentsQuery = db.prepare(`
    SELECT type, verified, COUNT(*) as count
    FROM rider_incidents 
    WHERE rider_id = ?
    GROUP BY type, verified
  `);

  const incidents = incidentsQuery.all(riderId) as any[];

  let verified_incidents = 0;
  let unverified_incidents = 0;
  const incidents_by_type: Record<string, number> = {};

  incidents.forEach(incident => {
    const count = incident.count;
    const type = incident.type;

    if (incident.verified === 1) {
      verified_incidents += count;
    } else {
      unverified_incidents += count;
    }

    incidents_by_type[type] = (incidents_by_type[type] || 0) + count;
  });

  return {
    verified_incidents,
    unverified_incidents,
    total_incidents: verified_incidents + unverified_incidents,
    incidents_by_type
  };
}

export function getRestaurantMetrics(restaurantId: number): {
  recent_reviews: Review[];
  average_rating: number;
  total_reviews: number;
  low_rating_percentage: number;
  complaint_rate: number;
} {
  // Get recent reviews
  const reviewsQuery = db.prepare(`
    SELECT * FROM reviews 
    WHERE restaurant_id = ? 
    ORDER BY created_at DESC
    LIMIT 20
  `);
  const recent_reviews = reviewsQuery.all(restaurantId) as Review[];

  // Calculate rating stats
  const ratingStatsQuery = db.prepare(`
    SELECT 
      AVG(rating) as avg_rating,
      COUNT(*) as total_reviews,
      SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) as low_ratings
    FROM reviews 
    WHERE restaurant_id = ?
  `);
  const ratingStats = ratingStatsQuery.get(restaurantId) as any;

  // Calculate complaint rate
  const complaintQuery = db.prepare(`
    SELECT 
      COUNT(DISTINCT c.id) as total_complaints,
      COUNT(DISTINCT o.id) as total_orders
    FROM complaints c
    JOIN orders o ON c.order_id = o.id
    WHERE o.restaurant_id = ? AND c.target_type = 'restaurant'
  `);
  const complaintStats = complaintQuery.get(restaurantId) as any;

  const average_rating = ratingStats.avg_rating || 0;
  const total_reviews = ratingStats.total_reviews || 0;
  const low_rating_percentage = total_reviews > 0 ? (ratingStats.low_ratings / total_reviews) * 100 : 0;
  const complaint_rate = complaintStats.total_orders > 0 ? (complaintStats.total_complaints / complaintStats.total_orders) * 100 : 0;

  return {
    recent_reviews,
    average_rating,
    total_reviews,
    low_rating_percentage,
    complaint_rate
  };
}
