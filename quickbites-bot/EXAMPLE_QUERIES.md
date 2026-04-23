# Example GraphQL Queries for QuickBites Support Bot

## Health Check

Check if the bot is ready to handle requests:

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

## Run Single Dev Scenario

Test a specific development scenario (101-105):

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
        target_type
        reason
        outcome_summary
      }
      timestamp
    }
  }
}
```

## Run All Dev Scenarios

Test all 5 rehearsal scenarios at once:

```graphql
mutation {
  runDevScenarios {
    sessionId
    completionReason
    totalTurns
    transcript {
      turn
      customer_message
      bot_message
    }
  }
}
```

## Run Production Evaluation

Run the full 22-scenario production evaluation (use this when ready for grading):

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

## Get Production Summary

Get your aggregate score after running production evaluation:

```graphql
mutation {
  getProdSummary
}
```

## Test Specific Scenarios

### Scenario 101 - Missing Item
```graphql
mutation {
  runSimulation(mode: "dev", scenarioId: 101) {
    sessionId
    transcript {
      turn
      customer_message
      bot_message
      actions {
        type
        amount_inr
        method
      }
    }
  }
}
```

### Scenario 102 - Cold Food
```graphql
mutation {
  runSimulation(mode: "dev", scenarioId: 102) {
    sessionId
    transcript {
      turn
      customer_message
      bot_message
      actions {
        type
        reason
      }
    }
  }
}
```

### Scenario 103 - Late Delivery
```graphql
mutation {
  runSimulation(mode: "dev", scenarioId: 103) {
    sessionId
    transcript {
      turn
      customer_message
      bot_message
      actions {
        type
        target_type
      }
    }
  }
}
```

### Scenario 104 - Wrong Order
```graphql
mutation {
  runSimulation(mode: "dev", scenarioId: 104) {
    sessionId
    transcript {
      turn
      customer_message
      bot_message
      actions {
        type
        amount_inr
        method
      }
    }
  }
}
```

### Scenario 105 - Potential Abuse
```graphql
mutation {
  runSimulation(mode: "dev", scenarioId: 105) {
    sessionId
    transcript {
      turn
      customer_message
      bot_message
      actions {
        type
        reason
      }
    }
  }
}
```

## Inspect Transcript Details

Get full conversation details including all actions:

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
        target_type
        target_id
        reason
        outcome_summary
      }
      timestamp
    }
  }
}
```

## Quick Test (Minimal Output)

For quick testing without full transcript:

```graphql
mutation {
  runSimulation(mode: "dev", scenarioId: 101) {
    sessionId
    completionReason
    totalTurns
  }
}
```

## How to Use

1. Start the server: `npm run dev`
2. Open GraphQL Playground: http://localhost:4000/graphql
3. Copy and paste any query above
4. Click the "Play" button to execute
5. View results in the right panel

## Tips

- **Start with health check** to ensure everything is configured
- **Use dev scenarios first** to test without affecting your prod score
- **Review transcripts** to understand bot decisions
- **Check completionReason** to see how conversations ended
- **Monitor totalTurns** to ensure conversations are efficient
- **Only use runProdEvaluation** when you're ready for grading
