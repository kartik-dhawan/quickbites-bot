import { Orchestrator } from './orchestrator';
import { ActionValidator } from './validator';
import SimulatorAPI from '../simulator/api';
import { BotAction } from '../simulator/api';

export interface ConversationResult {
  sessionId: string;
  transcript: Array<{
    turn: number;
    customer_message: string;
    bot_message: string;
    actions: BotAction[];
    timestamp: string;
  }>;
  finalScore?: any;
  completionReason: 'bot_closed' | 'customer_closed' | 'turn_cap' | 'error';
  totalTurns: number;
}

export class ConversationEngine {
  private orchestrator: Orchestrator;
  private validator: ActionValidator;
  private simulator: typeof SimulatorAPI;

  constructor() {
    this.orchestrator = new Orchestrator();
    this.validator = new ActionValidator();
    this.simulator = SimulatorAPI;
  }

  async runConversation(mode: 'dev' | 'prod' = 'dev', scenarioId?: number): Promise<ConversationResult> {
    console.log(`🚀 Starting ${mode} conversation${scenarioId ? ` (scenario ${scenarioId})` : ''}...`);

    const transcript = [];
    let turn = 0;
    let done = false;
    let sessionId = '';
    let completionReason: 'bot_closed' | 'customer_closed' | 'turn_cap' | 'error' = 'error';

    try {
      // Start session
      const sessionResponse = await this.simulator.startSession(mode, scenarioId);
      sessionId = sessionResponse.session_id;

      console.log(`📞 Session started: ${sessionId}`);
      console.log(`👤 Customer: "${sessionResponse.customer_message}"`);

      // Reset orchestrator for new conversation
      this.orchestrator.reset();

      let customerMessage = sessionResponse.customer_message;

      // Main conversation loop
      while (!done && turn < sessionResponse.max_turns * 2) {
        turn++;
        console.log(`\n--- Turn ${turn} ---`);

        // Process customer message
        const botResponse = await this.orchestrator.processWithActions(customerMessage);

        console.log(`🤖 Bot: "${botResponse.bot_message}"`);
        console.log(`🔧 Actions: ${botResponse.actions.length} action(s)`);

        // Validate actions
        const validationResult = await this.validator.validateAndCorrectActions(
          botResponse.actions,
          this.orchestrator.getConversationHistory().map(msg => msg.content)
        );

        if (!validationResult.isValid) {
          console.log(`❌ Validation failed: ${validationResult.errorMessage}`);

          // Try to get corrected actions
          const correctionMessage = this.validator.generateCorrectionMessage(validationResult.errorMessage!);
          const correctedResponse = await this.orchestrator.processCustomerMessage(correctionMessage);

          // Use corrected response or escalate
          const finalActions = correctedResponse.actions.length > 0 ? correctedResponse.actions : [
            { type: 'escalate_to_human' as const, reason: 'Action validation failed' }
          ];

          // Send reply with corrected actions
          const replyResponse = await this.simulator.sendReply(
            sessionId,
            correctedResponse.bot_message,
            finalActions
          );

          // Add to transcript
          transcript.push({
            turn,
            customer_message: customerMessage,
            bot_message: correctedResponse.bot_message,
            actions: finalActions,
            timestamp: new Date().toISOString()
          });

        } else {
          // Actions are valid, send them
          const replyResponse = await this.simulator.sendReply(
            sessionId,
            botResponse.bot_message,
            botResponse.actions
          );

          // Add to transcript
          transcript.push({
            turn,
            customer_message: customerMessage,
            bot_message: botResponse.bot_message,
            actions: botResponse.actions,
            timestamp: new Date().toISOString()
          });

          // Check if conversation is done
          done = replyResponse.done;
          if (done) {
            completionReason = replyResponse.close_reason || 'customer_closed';
            console.log(`🏁 Conversation ended: ${completionReason}`);

            if (replyResponse.score) {
              console.log(`📊 Score: ${JSON.stringify(replyResponse.score)}`);
            }
          } else {
            // Continue conversation
            customerMessage = replyResponse.customer_message || '';
            console.log(`👤 Customer: "${customerMessage}"`);
          }
        }
      }

      if (!done && turn >= sessionResponse.max_turns * 2) {
        completionReason = 'turn_cap';
        console.log(`⏱️ Turn limit reached`);
      }

    } catch (error) {
      console.error('❌ Conversation error:', error);
      completionReason = 'error';
    }

    return {
      sessionId,
      transcript,
      finalScore: undefined, // Will be populated in prod mode
      completionReason,
      totalTurns: turn
    };
  }

  async runMultipleConversations(mode: 'dev' | 'prod' = 'dev', count: number = 1): Promise<ConversationResult[]> {
    console.log(`🔄 Running ${count} ${mode} conversations...`);

    const results = [];

    for (let i = 0; i < count; i++) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Conversation ${i + 1}/${count}`);
      console.log(`${'='.repeat(50)}`);

      const result = await this.runConversation(mode);
      results.push(result);

      // Small delay between conversations
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  async runDevScenarios(): Promise<ConversationResult[]> {
    // Test all dev scenarios (101-105)
    const scenarioIds = [101, 102, 103, 104, 105];
    const results = [];

    for (const scenarioId of scenarioIds) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Testing Scenario ${scenarioId}`);
      console.log(`${'='.repeat(50)}`);

      try {
        const result = await this.runConversation('dev', scenarioId);
        results.push(result);
      } catch (error) {
        console.error(`❌ Scenario ${scenarioId} failed:`, error);
      }
    }

    return results;
  }

  async getProdSummary(): Promise<any> {
    try {
      const summary = await this.simulator.getCandidateSummary();
      return summary;
    } catch (error) {
      console.error('Failed to get prod summary:', error);
      return null;
    }
  }

  printSummary(results: ConversationResult[]): void {
    console.log(`\n${'='.repeat(50)}`);
    console.log('CONVERSATION SUMMARY');
    console.log(`${'='.repeat(50)}`);

    const completed = results.filter(r => r.completionReason !== 'error');
    const errors = results.filter(r => r.completionReason === 'error');

    console.log(`Total conversations: ${results.length}`);
    console.log(`Completed: ${completed.length}`);
    console.log(`Errors: ${errors.length}`);

    if (completed.length > 0) {
      const avgTurns = completed.reduce((sum, r) => sum + r.totalTurns, 0) / completed.length;
      console.log(`Average turns: ${avgTurns.toFixed(1)}`);

      const completionReasons = completed.reduce((acc, r) => {
        acc[r.completionReason] = (acc[r.completionReason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('Completion reasons:');
      Object.entries(completionReasons).forEach(([reason, count]) => {
        console.log(`  - ${reason}: ${count}`);
      });
    }

    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. Session ${error.sessionId}: ${error.completionReason}`);
      });
    }
  }
}
