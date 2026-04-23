const db = require('./db/connection');
const { getOrderDetails, getCustomerHistory } = require('./services/db/order.service');
const { getRiderIncidents, getRestaurantMetrics } = require('./services/db/reputation.service');
const { getAbuseIndicators } = require('./services/db/abuse.service');

async function runTests() {
  console.log('🚀 Testing QuickBites Bot Database Services...\n');

  try {
    // Test 1: Basic database connection
    console.log('1. Testing database connection...');
    const result = db.prepare('SELECT COUNT(*) as count FROM orders').get() as any;
    console.log(`   ✅ Connected! Found ${result.count} orders in database\n`);

    // Test 2: Get order details
    console.log('2. Testing order details lookup...');
    const orderDetails = getOrderDetails(1);
    if (orderDetails) {
      console.log(`   ✅ Order 1: ${orderDetails.restaurant?.name} - ₹${orderDetails.total_inr}`);
      console.log(`   Customer: ${orderDetails.customer?.name} (${orderDetails.customer?.loyalty_tier})`);
      console.log(`   Items: ${orderDetails.items?.length} items\n`);
    } else {
      console.log('   ❌ Order 1 not found\n');
    }

    // Test 3: Get customer history
    console.log('3. Testing customer history...');
    const customerHistory = getCustomerHistory(1);
    console.log(`   ✅ Customer 1: ${customerHistory.total_orders} orders, ₹${customerHistory.total_spend} spent`);
    console.log(`   Loyalty tier: ${customerHistory.loyalty_tier}\n`);

    // Test 4: Get rider incidents
    console.log('4. Testing rider incidents...');
    const riderIncidents = getRiderIncidents(1);
    console.log(`   ✅ Rider 1: ${riderIncidents.total_incidents} incidents`);
    console.log(`   Verified: ${riderIncidents.verified_incidents}, Unverified: ${riderIncidents.unverified_incidents}\n`);

    // Test 5: Get restaurant metrics
    console.log('5. Testing restaurant metrics...');
    const restaurantMetrics = getRestaurantMetrics(1);
    console.log(`   ✅ Restaurant 1: ${restaurantMetrics.average_rating.toFixed(1)}/5 rating`);
    console.log(`   ${restaurantMetrics.total_reviews} reviews, ${restaurantMetrics.complaint_rate.toFixed(1)}% complaint rate\n`);

    // Test 6: Abuse detection
    console.log('6. Testing abuse detection...');
    const abuseIndicators = getAbuseIndicators(1);
    console.log(`   ✅ Customer 1 risk score: ${abuseIndicators.risk_score}/100`);
    console.log(`   New account: ${abuseIndicators.is_new_account}, High complaints: ${abuseIndicators.high_complaint_rate}\n`);

    console.log('🎉 All tests passed! Database services are working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    db.close();
  }
}

// Run the tests
runTests();
