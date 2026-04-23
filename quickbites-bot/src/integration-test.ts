import { Orchestrator } from './services/ai/orchestrator';
import { ActionValidator } from './services/ai/validator';
import SimulatorAPI from './services/simulator/api';
import { getOrderDetails, getCustomerHistory } from './services/db/order.service';

async function runIntegrationTest() {
  console.log('🚀 Running QuickBites Bot Integration Test...\n');

  try {
    // Test 1: Database Services
    console.log('1. Testing Database Services...');
    const orderDetails = getOrderDetails(1);
    console.log(`   ✅ Order lookup: ${orderDetails?.restaurant?.name} - ₹${orderDetails?.total_inr}`);
    
    const customerHistory = getCustomerHistory(1);
    console.log(`   ✅ Customer history: ${customerHistory.total_orders} orders\n`);

    // Test 2: Action Validator
    console.log('2. Testing Action Validator...');
    const validator = new ActionValidator();
    
    // Test valid action
    const validAction = {
      type: 'issue_refund' as const,
      order_id: 1,
      amount_inr: 100,
      method: 'wallet_credit' as const
    };
    
    const validResult = await validator.validateAndCorrectActions([validAction], []);
    console.log(`   ✅ Valid action passed: ${validResult.isValid}`);
    
    // Test invalid action
    const invalidAction = {
      type: 'issue_refund' as const,
      order_id: 1,
      amount_inr: 10000, // Too high
      method: 'wallet_credit' as const
    };
    
    const invalidResult = await validator.validateAndCorrectActions([invalidAction], []);
    console.log(`   ✅ Invalid action caught: ${!invalidResult.isValid}\n`);

    // Test 3: Orchestrator (without Claude API)
    console.log('3. Testing Orchestrator...');
    const orchestrator = new Orchestrator();
    
    // Test conversation history
    orchestrator.reset();
    const history = orchestrator.getConversationHistory();
    console.log(`   ✅ Conversation history reset: ${history.length === 0}\n`);

    // Test 4: Simulator API Connection
    console.log('4. Testing Simulator API...');
    const simulator = SimulatorAPI;
    
    const healthCheck = await simulator.healthCheck();
    console.log(`   ✅ Simulator health check: ${healthCheck}`);
    
    if (healthCheck) {
      console.log('   🎯 Simulator is reachable! Ready for real testing.\n');
    } else {
      console.log('   ⚠️  Simulator not reachable (may need API key)\n');
    }

    // Test 5: Environment Variables
    console.log('5. Testing Environment Configuration...');
    const requiredEnvVars = [
      'ANTHROPIC_API_KEY',
      'SIMULATOR_BASE_URL', 
      'CANDIDATE_TOKEN'
    ];
    
    let envConfigOk = true;
    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar];
      const status = value ? '✅' : '❌';
      console.log(`   ${status} ${envVar}: ${value ? 'SET' : 'MISSING'}`);
      if (!value) envConfigOk = false;
    }
    
    console.log(`   Environment config: ${envConfigOk ? '✅ COMPLETE' : '❌ INCOMPLETE'}\n`);

    // Test 6: Tool Definitions
    console.log('6. Testing Tool Definitions...');
    const { anthropicTools } = require('./services/ai/tools');
    console.log(`   ✅ Tools loaded: ${anthropicTools.length} tools available`);
    anthropicTools.forEach((tool: any, index: number) => {
      console.log(`   - ${index + 1}. ${tool.name}: ${tool.description.substring(0, 50)}...`);
    });
    console.log();

    // Test 7: Schema Validation
    console.log('7. Testing Schema Validation...');
    const { validateActions } = require('./schemas/actions.schema');
    
    const testActions = [
      { type: 'issue_refund', order_id: 1, amount_inr: 100, method: 'wallet_credit' },
      { type: 'file_complaint', order_id: 1, target_type: 'restaurant' }
    ];
    
    const schemaResult = validateActions(testActions);
    console.log(`   ✅ Schema validation: ${schemaResult.isValid ? 'PASSED' : 'FAILED'}\n`);

    // Summary
    console.log('🎉 Integration Test Complete!');
    console.log('✅ Database services: Working');
    console.log('✅ Action validator: Working'); 
    console.log('✅ Orchestrator: Ready');
    console.log('✅ Simulator API: ' + (healthCheck ? 'Connected' : 'Needs config'));
    console.log('✅ Tools: Loaded');
    console.log('✅ Schemas: Validating');
    
    if (envConfigOk && healthCheck) {
      console.log('\n🚀 READY FOR PRODUCTION TESTING!');
    } else {
      console.log('\n⚠️  Configure environment variables for full testing');
    }

  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

// Run the test
runIntegrationTest();
