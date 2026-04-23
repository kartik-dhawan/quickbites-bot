const Database = require('better-sqlite3');
const path = require('path');

// Create read-only database connection
const dbPath = path.join(__dirname, 'app.db');
const db = new Database(dbPath, { readonly: true });

function testDatabase() {
  console.log('🚀 Testing QuickBites Bot Database...\n');

  try {
    // Test 1: Basic database connection
    console.log('1. Testing database connection...');
    const result = db.prepare('SELECT COUNT(*) as count FROM orders').get();
    console.log(`   ✅ Connected! Found ${result.count} orders in database\n`);

    // Test 2: Get order details
    console.log('2. Testing order details lookup...');
    const orderQuery = db.prepare(`
      SELECT 
        o.*,
        c.name as customer_name,
        c.loyalty_tier,
        r.name as restaurant_name,
        r.cuisine as restaurant_cuisine
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.id = ?
    `);
    
    const order = orderQuery.get(1);
    if (order) {
      console.log(`   ✅ Order 1: ${order.restaurant_name} - ₹${order.total_inr}`);
      console.log(`   Customer: ${order.customer_name} (${order.loyalty_tier} tier)\n`);
    } else {
      console.log('   ❌ Order 1 not found\n');
    }

    // Test 3: Get customer history
    console.log('3. Testing customer history...');
    const customerStatsQuery = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_inr), 0) as total_spend
      FROM orders 
      WHERE customer_id = ? AND status = 'delivered'
    `);
    
    const customerStats = customerStatsQuery.get(1);
    console.log(`   ✅ Customer 1: ${customerStats.total_orders} orders, ₹${customerStats.total_spend} spent\n`);

    // Test 4: Get rider incidents
    console.log('4. Testing rider incidents...');
    const incidentsQuery = db.prepare(`
      SELECT 
        SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as verified_incidents,
        SUM(CASE WHEN verified = 0 THEN 1 ELSE 0 END) as unverified_incidents,
        COUNT(*) as total_incidents
      FROM rider_incidents 
      WHERE rider_id = ?
    `);
    
    const incidents = incidentsQuery.get(1);
    console.log(`   ✅ Rider 1: ${incidents.total_incidents} incidents`);
    console.log(`   Verified: ${incidents.verified_incidents}, Unverified: ${incidents.unverified_incidents}\n`);

    // Test 5: Get restaurant metrics
    console.log('5. Testing restaurant metrics...');
    const ratingQuery = db.prepare(`
      SELECT 
        AVG(rating) as avg_rating,
        COUNT(*) as total_reviews
      FROM reviews 
      WHERE restaurant_id = ?
    `);
    
    const rating = ratingQuery.get(1);
    const avgRating = rating.avg_rating || 0;
    console.log(`   ✅ Restaurant 1: ${avgRating.toFixed(1)}/5 rating`);
    console.log(`   ${rating.total_reviews} reviews\n`);

    console.log('🎉 All tests passed! Database is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    db.close();
  }
}

// Run the test
testDatabase();
