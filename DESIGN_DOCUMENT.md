# QuickBites AI Support Bot - Design Document

## 📋 Overview

The QuickBites AI Support Bot is an intelligent customer service system designed to handle food delivery complaints and support requests for the QuickBites platform. The bot uses AI to analyze customer issues, verify claims, detect abuse patterns, and execute appropriate resolutions while maintaining strict policy compliance.

## 🎯 Project Goals

1. **Automated Customer Support**: Handle common food delivery issues without human intervention
2. **Policy Compliance**: Ensure all actions follow company policies and prevent abuse
3. **Fair Resolution**: Balance customer satisfaction with platform protection
4. **Efficiency**: Resolve issues quickly with minimal conversation turns
5. **Abuse Detection**: Identify and flag suspicious behavior patterns

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GraphQL API   │    │  Conversation   │    │   AI Orchestrator│
│    (Express)    │◄──►│     Engine      │◄──►│   (Claude API)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Health Check   │    │  Action Validator│    │   System Prompt  │
│     Endpoint    │    │                 │    │   & Tools        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Simulator     │    │   SQLite DB     │    │   Policy Rules  │
│     API         │    │   (Read-only)   │    │   & Guidelines  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Components

#### 1. **GraphQL API Server** (`src/server.ts`)
- **Framework**: Express.js with Apollo Server
- **Endpoint**: `/graphql` for all bot operations
- **Health Check**: `/healthz` for monitoring
- **Port**: 4000 (configurable)

**Key Mutations**:
- `runSimulation(mode, scenarioId)` - Single scenario execution
- `runDevScenarios()` - Development testing (scenarios 101-105)
- `runProdEvaluation()` - Production evaluation (22 graded scenarios)
- `getProdSummary()` - Retrieve evaluation results

#### 2. **Conversation Engine** (`src/services/ai/conversation.ts`)
- **Purpose**: Orchestrates conversation flow with simulator
- **Loop Management**: Handles turn-by-turn conversation until completion
- **Error Handling**: Graceful fallback for API failures
- **Transcript Tracking**: Maintains complete conversation history

**Conversation Flow**:
1. Start session with simulator
2. Process customer message through AI
3. Validate AI actions
4. Send response to simulator
5. Check for conversation completion
6. Repeat until done or turn limit reached

#### 3. **AI Orchestrator** (`src/services/ai/orchestrator.ts`)
- **AI Provider**: Anthropic Claude (Sonnet 4.6)
- **Tool Integration**: Database queries and action execution
- **Response Parsing**: Handles structured AI responses
- **Retry Logic**: Automatic retry for failed AI calls

**Key Methods**:
- `processCustomerMessage()` - Main AI interaction
- `processWithActions()` - AI response with action validation
- `executeToolUse()` - Tool execution and result formatting

#### 4. **System Prompt & Rules** (`src/services/ai/prompt.ts`)
- **Core Principles**: Fair, policy-compliant decision making
- **Abuse Detection**: Pattern recognition for suspicious behavior
- **Escalation Rules**: When to involve human agents
- **Resolution Guidelines**: Refund logic and complaint handling

**Critical Rules**:
- Prompt injection detection and prevention
- Escalation pressure handling
- Payment issue processing (no refunds for double charges)
- Evidence requirements for refunds

#### 5. **Database Integration** (`src/db/connection.ts`)
- **Database**: SQLite (read-only connection)
- **Schema**: Customers, orders, restaurants, riders, complaints, refunds
- **Purpose**: Verify claims and check abuse patterns

#### 6. **Action Validation** (`src/schemas/actions.schema.ts`)
- **Schema Validation**: Yup-based action validation
- **Business Rules**: Refund limits, complaint targets, escalation logic
- **Error Correction**: Automatic fix attempts for invalid actions

## 🤖 AI Integration

### Claude API Configuration
- **Model**: Claude Sonnet 4.6
- **Max Tokens**: 1000 per response
- **Tools**: Database queries, action execution
- **System Prompt**: Comprehensive support guidelines

### Tool System
The bot uses structured tools for:

1. **Database Queries**:
   - `get_order_details()` - Order information
   - `get_customer_history()` - Customer complaint patterns
   - `get_restaurant_info()` - Restaurant performance
   - `get_rider_info()` - Rider incident history

2. **Action Execution**:
   - `submit_support_actions()` - Execute refunds, complaints, escalations
   - `flag_abuse()` - Mark suspicious behavior
   - `close_conversation()` - End interaction

### Decision Making Process
1. **Information Gathering**: Max 2 tool calls for verification
2. **Pattern Analysis**: Check for abuse indicators
3. **Policy Application**: Apply resolution guidelines
4. **Action Execution**: Immediate decision implementation
5. **Conversation Closure**: Efficient resolution (2-3 turns max)

## 📊 Data Flow

### Conversation Flow
```
Customer Message → AI Orchestrator → Database Tools → Decision Logic → Action Execution → Simulator Response
```

### Evaluation Flow
```
GraphQL Request → Conversation Engine → Simulator API → Scoring → Results Storage
```

### Data Sources
- **SQLite Database**: Historical order and customer data
- **Simulator API**: Scenario execution and scoring
- **AI Model**: Natural language processing and decision making

## 🛡️ Security & Abuse Prevention

### Abuse Detection Patterns
- High complaint rate (>20% of orders)
- Multiple refunds in 30 days (>3)
- New accounts with multiple complaints (<30 days)
- Claims contradicting delivery data
- Prompt injection attempts

### Security Measures
- **Prompt Injection Protection**: Detect and block AI manipulation attempts
- **Policy Enforcement**: Strict adherence to refund limits and escalation rules
- **Data Validation**: Input sanitization and action validation
- **Error Handling**: Graceful degradation for system failures

### Critical Protections
- No AI/bot identity revelation
- No internal policy disclosure
- Chargeback threat escalation
- Hostile language handling

## 📈 Evaluation System

### Scenarios
- **Development**: 5 scenarios (101-105) for testing
- **Production**: 22 graded scenarios for final evaluation
- **Scenario Types**: 
  - Block A: Basic customer service
  - Block B: Abuse detection
  - Block C: Edge cases and attacks

### Scoring Criteria
- **Refund Correctness** (30%): Appropriate refund decisions
- **Policy Compliance** (20%): Within refund limits
- **Complaint Handling** (15%): Proper complaint filing
- **Abuse Handling** (15%): Pattern recognition
- **Escalation Logic** (10%): When to involve humans
- **Clean Closure** (10%): Professional conversation ending

### Performance Metrics
- **Aggregate Score**: Total points across all scenarios
- **Completion Rate**: Scenarios successfully resolved
- **Turn Efficiency**: Average conversation length
- **Error Rate**: System failures and timeouts

## 🚀 Deployment Architecture

### Production Deployment
- **Platform**: Render (or similar PaaS)
- **Runtime**: Node.js 18.x
- **Database**: SQLite file (read-only)
- **Environment Variables**: API keys and configuration

### Environment Configuration
```env
ANTHROPIC_API_KEY=sk-ant-*
ANTHROPIC_MODEL=claude-sonnet-4-6
SIMULATOR_BASE_URL=https://simulator-*.a.run.app
CANDIDATE_TOKEN=boulder-silver-thunder-jaguar
PORT=4000
NODE_ENV=production
```

### Health Monitoring
- **Health Endpoint**: `/healthz` checks database, simulator, and environment
- **Logging**: Structured console logs for debugging
- **Error Tracking**: Graceful error handling and reporting

## 🔧 Development Workflow

### Local Development
```bash
cd quickbites-bot
npm install
npm run dev  # Development server with auto-reload
```

### Testing
```bash
npm run test          # Run development scenarios
npm run build         # Production build
npm start            # Production server
```

### Evaluation Scripts
- `run-prod-evaluation.sh` - Full production evaluation
- `test-improvements.sh` - Specific scenario testing

## 📁 Project Structure

```
quickbites-bot/
├── src/
│   ├── db/
│   │   └── connection.ts          # Database connection
│   ├── services/
│   │   ├── ai/
│   │   │   ├── conversation.ts     # Conversation engine
│   │   │   ├── orchestrator.ts    # AI orchestration
│   │   │   ├── prompt.ts          # System prompt & rules
│   │   │   ├── tools.ts           # AI tool definitions
│   │   │   └── validator.ts       # Action validation
│   │   └── simulator/
│   │       └── api.ts             # Simulator API client
│   ├── graphql/
│   │   ├── schema.ts              # GraphQL schema
│   │   └── resolvers.ts           # GraphQL resolvers
│   ├── schemas/
│   │   └── actions.schema.ts      # Action validation schemas
│   └── server.ts                  # Express server
├── package.json                   # Dependencies
├── tsconfig.json                   # TypeScript config
├── .env                           # Environment variables
└── dist/                          # Compiled output
```

## 🎯 Key Design Decisions

### 1. **AI-First Approach**
- Claude handles natural language understanding and decision making
- Structured tools ensure predictable, auditable actions
- System prompt encodes all business logic and policies

### 2. **Immutable Database**
- Read-only SQLite connection prevents data modification
- All changes go through simulator API for evaluation
- Reproducible results across different environments

### 3. **Strict Policy Enforcement**
- Hard-coded rules prevent policy violations
- Action validation catches mistakes before execution
- Escalation as fallback for uncertain situations

### 4. **Efficiency Focus**
- 2-3 turn conversation limit
- Max 2 tool calls per decision
- Immediate action execution after information gathering

### 5. **Security by Design**
- Prompt injection detection
- No internal system information disclosure
- Abuse pattern recognition
- Graceful error handling

## 🔮 Future Enhancements

### Potential Improvements
1. **Machine Learning**: Train custom models for abuse detection
2. **Multi-language Support**: Expand beyond English
3. **Real Database**: Replace SQLite with production database
4. **Advanced Analytics**: Detailed performance metrics
5. **A/B Testing**: Compare different resolution strategies

### Scalability Considerations
- **Horizontal Scaling**: Multiple bot instances
- **Load Balancing**: Distribute conversation load
- **Caching**: Improve database query performance
- **Monitoring**: Real-time performance dashboards

## 📚 References

- [Assignment Details](./docs/ASSIGNMENT.md)
- [Simulator API Documentation](./docs/SIMULATOR_API.md)
- [Policy and FAQ](./policy_and_faq.md)
- [Database Schema](./schema.md)

---

**Version**: 1.0  
**Last Updated**: 2026-04-24  
**Author**: QuickBites Candidate Team
