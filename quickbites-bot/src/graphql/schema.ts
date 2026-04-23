import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type BotAction {
    type: String!
    order_id: Int
    amount_inr: Int
    method: String
    target_type: String
    target_id: Int
    reason: String
    outcome_summary: String
  }

  type TranscriptEntry {
    turn: Int!
    customer_message: String!
    bot_message: String!
    actions: [BotAction!]!
    timestamp: String!
  }

  type ConversationResult {
    sessionId: String!
    transcript: [TranscriptEntry!]!
    completionReason: String!
    totalTurns: Int!
    finalScore: String
  }

  type HealthCheck {
    status: String!
    database: Boolean!
    simulator: Boolean!
    environment: Boolean!
  }

  type Query {
    health: HealthCheck!
  }

  type Mutation {
    runSimulation(mode: String!, scenarioId: Int): ConversationResult!
    runDevScenarios: [ConversationResult!]!
    runProdEvaluation: [ConversationResult!]!
    getProdSummary: String!
  }
`;
