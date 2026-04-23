# QuickBites Support Bot

AI-powered customer support bot for QuickBites food delivery platform. Handles customer complaints, makes refund decisions, detects abuse patterns, and escalates when appropriate.

## 🏗️ Architecture

### Core Components
- **Database Layer**: SQLite queries for customer/order history lookup
- **Policy Engine**: Rule-based decision system for refunds/complaints
- **LLM Integration**: Claude Sonnet 4-6 for natural language understanding
- **Validation Layer**: Comprehensive action validation with business rules
- **API Layer**: GraphQL API for simulator integration
- **Conversation Engine**: Orchestrates full conversation flows

### Technology Stack
- **Backend**: Node.js + TypeScript + Express
- **Database**: SQLite with better-sqlite3
- **AI**: Anthropic Claude API
- **API**: GraphQL via Apollo Server
- **Validation**: Yup schemas

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` file:
```env
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL=claude-sonnet-4-6
SIMULATOR_BASE_URL=https://simulator-75lk3meynq-el.a.run.app
CANDIDATE_TOKEN=boulder-silver-thunder-jaguar
PORT=4000
NODE_ENV=development
```

### 3. Start Development Server
```bash
npm run dev
```

Server will be available at:
- GraphQL Playground: http://localhost:4000/graphql
- Health Check: http://localhost:4000/healthz

### 4. Run Tests
```bash
# Database and integration tests
node integration-test.js

# Build TypeScript
npm run build

# Start production server
npm start
```

## 📊 GraphQL API

### Health Check
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

### Run Single Simulation
```graphql
mutation {
  runSimulation(mode: "dev", scenarioId: 101) {
    sessionId
    completionReason
    totalTurns
    transcript {
      turn
      customer_message
      bot_message
      actions {
        type
        order_id
        amount_inr
        method
      }
    }
  }
}
```

### Run All Dev Scenarios
```graphql
mutation {
  runDevScenarios {
    sessionId
    completionReason
    totalTurns
  }
}
```

### Run Production Evaluation
```graphql
mutation {
  runProdEvaluation {
    sessionId
    completionReason
    totalTurns
    finalScore
  }
}
```

### Get Production Summary
```graphql
mutation {
  getProdSummary
}
```

## 🧠 Decision Logic

### Refund Policy
- **Small wallet credit (₹50-₹300)**: Modest issues, good customers
- **Partial refund**: Missing items, cold food (refund affected portion)
- **Full refund**: Order completely unusable, no abuse signals
- **Never refund more than order total**

### Abuse Detection
- High complaint rate (>20% of orders)
- Multiple refunds in last 30 days (>3)
- "Never arrived" claims against clean riders
- New accounts (<30 days) with multiple complaints

### Escalation Criteria
- Large refund requests (>₹1000)
- Novel situations not covered by policy
- Credible abuse patterns
- Customer demands exceeding policy limits

## 📁 Project Structure

```
quickbites-bot/
├── src/
│   ├── db/
│   │   └── connection.ts          # Database connection
│   ├── services/
│   │   ├── db/
│   │   │   ├── order.service.ts   # Order/customer queries
│   │   │   ├── reputation.service.ts  # Rider/restaurant metrics
│   │   │   └── abuse.service.ts   # Abuse detection
│   │   ├── ai/
│   │   │   ├── prompt.ts          # System prompt
│   │   │   ├── tools.ts           # Anthropic tool definitions
│   │   │   ├── orchestrator.ts    # Claude orchestration
│   │   │   ├── validator.ts      # Action validation
│   │   │   └── conversation.ts    # Conversation engine
│   │   └── simulator/
│   │       └── api.ts             # Simulator API client
│   ├── schemas/
│   │   └── actions.schema.ts      # Yup validation schemas
│   ├── graphql/
│   │   ├── schema.ts             # GraphQL type definitions
│   │   └── resolvers.ts          # GraphQL resolvers
│   ├── types/
│   │   └── db.ts                 # TypeScript interfaces
│   └── server.ts                # Express server
├── app.db                        # SQLite database
├── integration-test.js           # Integration tests
├── package.json
├── tsconfig.json
└── .env
```

## 🔒 Safety Features

### Validation Layers
1. **Schema Validation**: Ensures actions match expected formats
2. **Business Logic Validation**: Checks refund amounts, reason lengths
3. **Cross-Action Validation**: Prevents conflicting actions
4. **Order Validation**: Refunds cannot exceed order totals

### Error Handling
- Graceful degradation on API failures
- Automatic escalation when validation fails
- Multiple retry attempts for complex requests
- Comprehensive error logging

### Security
- Read-only database access
- Environment variable configuration
- Token-based simulator authentication
- Prompt injection resistance

## 📈 Evaluation

### Development Testing
- 5 rehearsal scenarios (101-105)
- Unlimited unscored sessions
- Transcript access for debugging

### Production Evaluation
- 22 graded scenarios
- Auto-scored on 6 criteria:
  - Refund correctness (30%)
  - Within-policy refund amount (20%)
  - Complaint handling (15%)
  - Abuse handling (15%)
  - Escalation correctness (10%)
  - Closed cleanly (10%)

## 🎯 Key Features

- **Data-Driven Decisions**: Uses database history for intelligent decisions
- **Policy Enforcement**: Strict adherence to company policies
- **Abuse Detection**: Identifies suspicious patterns
- **Validation**: Multiple safety nets prevent costly mistakes
- **Scalable**: GraphQL API for easy integration
- **Observable**: Comprehensive logging and transcripts

## 📝 Deliverables

1. **Git Repository**: Complete source code with documentation
2. **Hosted Service**: Deploy to Railway/Render/Heroku
3. **Design Document**: Architecture, policies, evaluation methodology
4. **Video Walkthrough**: Demo of good and adversarial sessions

## 🤝 Contributing

This is a take-home assignment. The codebase demonstrates:
- Clean architecture and separation of concerns
- Type safety with TypeScript
- Comprehensive error handling
- Production-ready code quality
- Thoughtful AI integration

## 📄 License

Proprietary - QuickBites Assignment
