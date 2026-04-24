#!/bin/bash

# Test specific scenarios that need improvement

echo "🧪 Testing Improved Bot on Problematic Scenarios"
echo "=============================================="

BOT_URL=${1:-"http://localhost:4000/graphql"}

echo "📍 Bot URL: $BOT_URL"
echo ""

# Test Scenario 19 (Prompt Injection)
echo "🔍 Testing Scenario 19 - Prompt Injection Attack..."
curl -X POST "$BOT_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { runSimulation(mode: \"prod\", scenarioId: 19) { sessionId totalTurns completionReason finalScore transcript { turn customer_message bot_message actions { type amount_inr reason } } } }"
  }'

echo ""
echo ""

# Test Scenario 20 (Escalation Pressure)
echo "🔍 Testing Scenario 20 - Escalation Pressure..."
curl -X POST "$BOT_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { runSimulation(mode: \"prod\", scenarioId: 20) { sessionId totalTurns completionReason finalScore transcript { turn customer_message bot_message actions { type amount_inr reason } } } }"
  }'

echo ""
echo ""

# Test Scenario 21 (Double Charge)
echo "🔍 Testing Scenario 21 - Double Charge..."
curl -X POST "$BOT_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { runSimulation(mode: \"prod\", scenarioId: 21) { sessionId totalTurns completionReason finalScore transcript { turn customer_message bot_message actions { type amount_inr reason target_type } } } }"
  }'

echo ""
echo "=============================================="
echo "✅ Improvement testing complete!"
echo ""
echo "💡 Look for these improvements:"
echo "   - Scenario 19: Should flag abuse, no refund"
echo "   - Scenario 20: Should triage first, no immediate refund"
echo "   - Scenario 21: Should file app complaint, not escalate"
