#!/bin/bash

# Production Evaluation Script for QuickBites Bot
# This runs all 22 scenarios in production mode

echo "🚀 Starting QuickBites Production Evaluation"
echo "=========================================="

# Base URL (your deployed bot or localhost)
BOT_URL=${1:-"http://localhost:4000/graphql"}

echo "📍 Bot URL: $BOT_URL"
echo ""

# Step 1: Run all production scenarios
echo "📊 Running production evaluation (all 22 scenarios)..."
curl -X POST "$BOT_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { runProdEvaluation { sessionId totalTurns completionReason finalScore } }"
  }'

echo ""
echo ""

# Step 2: Get final summary
echo "📈 Getting production summary..."
curl -X POST "$BOT_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { getProdSummary }"
  }'

echo ""
echo "=========================================="
echo "✅ Production evaluation complete!"
echo ""
echo "💡 Check the results above for:"
echo "   - scenarios_completed: should be 22"
echo "   - aggregate_score: your final score"
