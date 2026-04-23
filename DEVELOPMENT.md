# QuickBites Support Bot - Development Guide

This guide will help you set up, run, and test the QuickBites AI support bot locally.

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- SQLite3 (comes bundled with the project)

## 🚀 Getting Started

### 1. Install Dependencies

Navigate to the bot directory and install dependencies:

```bash
cd quickbites-bot
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp ../.env.example .env
```

Edit the `.env` file in the `quickbites-bot` directory with your values:

```env
# Claude API Key (required for AI responses)
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
ANTHROPIC_MODEL=claude-sonnet-4-6

# Simulator Base URL (provided by QuickBites team)
SIMULATOR_BASE_URL=https://simulator-75lk3meynq-el.a.run.app

# Your Candidate Token (required for prod evaluation runs)
CANDIDATE_TOKEN=boulder-silver-thunder-jaguar

# Optional: Server port (defaults to 4000)
PORT=4000
```

### 3. Start the Server

Run the development server with auto-reload:

```bash
npm run dev
```

You should see output like:

```
🚀 QuickBites Support Bot Server
==================================================
📡 Server running on http://localhost:4000
🔍 GraphQL Playground: http://localhost:4000/graphql
❤️  Health check: http://localhost:4000/healthz
==================================================
Ready to handle support conversations!
```

## 🧪 Testing the Server

### Health Check

Verify the server is running:

```bash
curl http://localhost:4000/healthz
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2024-04-23T10:00:00.000Z"
}
```

## 🔍 Using GraphQL Playground

The server includes a GraphQL Playground at `http://localhost:4000/graphql` where you can interactively test queries and mutations.

### Opening GraphQL Playground

1. Open your browser
2. Navigate to `http://localhost:4000/graphql`
3. You'll see the GraphQL Playground interface with:
   - Query editor on the left
   - Variables panel at the bottom left
   - Documentation explorer on the right
   - Response panel in the center

### GraphQL Schema Overview

**Queries:**
- `health` - Check system health status

**Mutations:**
- `runSimulation(mode, scenarioId)` - Run a single simulation scenario
- `runDevScenarios` - Run all development scenarios
- `runProdEvaluation` - Run production evaluation scenarios
- `getProdSummary` - Get summary of production evaluation results

## 📝 Example GraphQL Queries & Mutations

### 1. Health Check Query

```graphql
query {
  health {
    status
    database
    simulator
    environment
  }
}
```

**Response:**
```json
{
  "data": {
    "health": {
      "status": "ok",
      "database": true,
      "simulator": true,
      "environment": true
    }
  }
}
```

### 2. Run a Single Simulation (Development Mode)

```graphql
mutation {
  runSimulation(mode: "dev", scenarioId: 1) {
    sessionId
    transcript {
      turn
      customer_message
      bot_message
      actions {
        type
        order_id
        amount_inr
        method
        target_type
        target_id
        reason
        outcome_summary
      }
      timestamp
    }
    completionReason
    totalTurns
    finalScore
  }
}
```

### 3. Run All Development Scenarios

```graphql
mutation {
  runDevScenarios {
    sessionId
    totalTurns
    completionReason
    finalScore
  }
}
```

This will run all available development scenarios and return a summary of each.

### 4. Run Production Evaluation

⚠️ **Important:** Only run this when ready for evaluation. Requires valid `CANDIDATE_TOKEN`.

```graphql
mutation {
  runProdEvaluation {
    sessionId
    totalTurns
    completionReason
    finalScore
  }
}
```

This will run all 22 production scenarios used for grading.

### 5. Get Production Summary

After running production evaluation, get a detailed summary:

```graphql
mutation {
  getProdSummary
}
```

Returns a detailed text summary of the evaluation results.

## 🎯 Step-by-Step GraphQL Testing Guide

### Step 1: Verify Server is Running

1. Open http://localhost:4000/graphql in your browser
2. Run the health check query to verify all systems are operational

### Step 2: Test a Simple Development Scenario

1. Copy the `runSimulation` mutation with `mode: "dev"` and `scenarioId: 1`
2. Paste it into the GraphQL Playground query editor
3. Click the "Play" button (▶️)
4. Review the response to see the conversation transcript and bot actions

### Step 3: Explore Different Scenarios

Try different scenario IDs to test various customer support situations:

```graphql
mutation {
  runSimulation(mode: "dev", scenarioId: 2) {
    sessionId
    transcript {
      turn
      customer_message
      bot_message
      actions {
        type
        amount_inr
        reason
      }
    }
    totalTurns
    completionReason
  }
}
```

### Step 4: Run All Development Scenarios

When you're ready for comprehensive testing:

```graphql
mutation {
  runDevScenarios {
    sessionId
    totalTurns
    completionReason
    finalScore
  }
}
```

### Step 5: Production Evaluation (When Ready)

Once your bot performs well on development scenarios:

1. Ensure your `CANDIDATE_TOKEN` is set correctly in `.env`
2. Run the production evaluation:
```graphql
mutation {
  runProdEvaluation {
    sessionId
    totalTurns
    completionReason
    finalScore
  }
}
```
3. Get the detailed summary:
```graphql
mutation {
  getProdSummary
}
```

## 🐛 Troubleshooting

### Server Won't Start

- **Error:** "Cannot find module"
  - **Solution:** Run `npm install` in the `quickbites-bot` directory

- **Error:** "Database locked" or "Database not found"
  - **Solution:** Ensure `app.db` exists in the project root

- **Error:** "ANTHROPIC_API_KEY not found"
  - **Solution:** Create `.env` file with your API key

### GraphQL Playground Issues

- **Error:** "Cannot GET /graphql"
  - **Solution:** Ensure server is running and check the port in console output

- **Error:** "Introspection disabled"
  - **Solution:** This shouldn't happen as introspection is enabled in `server.ts`

### Simulator Connection Issues

- **Error:** "Simulator connection failed"
  - **Solution:** Check `SIMULATOR_BASE_URL` in `.env` and ensure you have network access

## 📊 Understanding the Response

### Transcript Structure

Each conversation turn includes:
- `turn`: Turn number (1, 2, 3...)
- `customer_message`: What the customer said
- `bot_message`: How the bot responded
- `actions`: Actions taken by the bot (refund, escalate, etc.)
- `timestamp`: When this turn occurred

### Bot Actions

Common action types:
- `refund`: Issue a refund to customer
- `escalate`: Escalate to human agent
- `close`: Close the conversation
- `complaint`: File a complaint against restaurant/rider/app

### Completion Reasons

- `resolved`: Issue resolved successfully
- `escalated`: Escalated to human
- `max_turns_reached`: Conversation limit reached
- `customer_satisfied`: Customer ended conversation

## 🚀 Production Deployment

When you're ready to deploy:

1. Build the project:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

3. Ensure your environment variables are set in the production environment

## 📚 Additional Resources

- [Assignment Details](./docs/ASSIGNMENT.md)
- [Simulator API Documentation](./docs/SIMULATOR_API.md)
- [Policy and FAQ](./policy_and_faq.md)
- [Database Schema](./schema.md)
