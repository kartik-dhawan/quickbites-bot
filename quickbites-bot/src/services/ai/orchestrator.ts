import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from './prompt';
import { anthropicTools, executeTool, formatToolResult } from './tools';
import { validateActions, validateRefundAgainstOrder, validateMultipleRefunds } from '../../schemas/actions.schema';
import { BotAction } from '../simulator/api';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface Message {
  role: 'user' | 'assistant';
  content: string | Array<any>;
}

export interface ConversationTurn {
  customer_message: string;
  bot_response: string;
  actions: BotAction[];
  tools_used?: string[];
}

export class Orchestrator {
  private conversationHistory: Message[] = [];

  async processCustomerMessage(customerMessage: string): Promise<{
    bot_message: string;
    actions: BotAction[];
    tools_used?: string[];
  }> {
    // Add customer message to conversation
    this.conversationHistory.push({
      role: 'user',
      content: customerMessage
    });

    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        const response = await this.callClaude();

        // Check if response contains tool_use blocks
        const toolUseBlocks = response.content.filter((block: any) => block.type === 'tool_use');
        const textBlocks = response.content.filter((block: any) => block.type === 'text');

        if (toolUseBlocks.length > 0) {
          // Check if this is the submit_support_actions tool
          const submitActionBlock = toolUseBlocks.find((block: any) => block.name === 'submit_support_actions');

          if (submitActionBlock) {
            // Claude is submitting final actions - execute and return
            const toolResults = await this.executeToolUse([submitActionBlock]);

            // Add Claude's response to conversation
            this.conversationHistory.push({
              role: 'assistant',
              content: response.content
            });

            // Add tool result to conversation (required by Anthropic API)
            this.conversationHistory.push({
              role: 'user',
              content: toolResults
            });

            // Extract actions from the tool result - it's the content field
            let actions = toolResults[0]?.content || [];

            // Parse if it's a string
            if (typeof actions === 'string') {
              try {
                actions = JSON.parse(actions);
              } catch (error) {
                console.error(`Failed to parse actions string:`, error);
                actions = [];
              }
            }

            // Get the text message from any text blocks
            const textBlocks = response.content.filter((block: any) => block.type === 'text');
            const botMessage = textBlocks.length > 0 ? textBlocks[0].text : '';

            return {
              bot_message: botMessage,
              actions,
              tools_used: ['submit_support_actions']
            };
          }

          // Claude wants to use other tools - execute them
          const toolResults = await this.executeToolUse(toolUseBlocks);

          // Add Claude's response (including tool_use) to conversation
          this.conversationHistory.push({
            role: 'assistant',
            content: response.content
          });

          // Add tool results to conversation as user message (must follow tool_use)
          this.conversationHistory.push({
            role: 'user',
            content: toolResults
          });

          attempts++;
          continue; // Try again with tool results
        } else {
          // Claude gave a direct response (no tools)
          const botMessage = textBlocks.length > 0 ? textBlocks[0].text : '';

          this.conversationHistory.push({
            role: 'assistant',
            content: response.content
          });

          // No actions if Claude didn't call submit_support_actions
          return {
            bot_message: botMessage,
            actions: [],
            tools_used: []
          };
        }
      } catch (error) {
        console.error('Claude API error:', error);

        // Fallback response
        const fallbackMessage = "I'm having trouble accessing my systems right now. Let me get a human agent to help you with this issue.";

        this.conversationHistory.push({
          role: 'assistant',
          content: fallbackMessage
        });

        return {
          bot_message: fallbackMessage,
          actions: [{ type: 'escalate_to_human' as const, reason: 'AI system error' }],
          tools_used: []
        };
      }
    }

    // If we've tried too many times, escalate
    const escalationMessage = "I need to get a human agent to help resolve this issue for you.";

    this.conversationHistory.push({
      role: 'assistant',
      content: escalationMessage
    });

    return {
      bot_message: escalationMessage,
      actions: [{ type: 'escalate_to_human' as const, reason: 'Max tool use attempts exceeded' }],
      tools_used: []
    };
  }

  private async callClaude(): Promise<any> {
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: this.conversationHistory,
      tools: anthropicTools,
    });

    return response;
  }

  private async executeToolUse(toolUseBlocks: any[]): Promise<any[]> {
    const results = [];

    for (const toolUse of toolUseBlocks) {
      const toolName = toolUse.name;
      const toolInput = toolUse.input;
      const toolUseId = toolUse.id;

      try {
        const result = await executeTool(toolName, toolInput);
        const formattedResult = formatToolResult(toolName, result);

        results.push({
          type: 'tool_result',
          tool_use_id: toolUseId,
          content: formattedResult
        });
      } catch (error) {
        results.push({
          type: 'tool_result',
          tool_use_id: toolUseId,
          content: `Error executing ${toolName}: ${error}`
        });
      }
    }

    return results;
  }


  async processWithActions(customerMessage: string): Promise<{
    bot_message: string;
    actions: BotAction[];
  }> {
    // First, get basic response and tools
    const initialResponse = await this.processCustomerMessage(customerMessage);

    // If no actions were taken, we're done
    if (initialResponse.actions.length === 0) {
      return {
        bot_message: initialResponse.bot_message,
        actions: []
      };
    }

    // If we have actions, validate them
    const validation = validateActions(initialResponse.actions);

    if (!validation.isValid) {
      console.error('Action validation failed:', validation.errors);

      // Try to get Claude to fix the actions
      const fixMessage = `The actions I tried to take had validation errors: ${validation.errors?.join(', ')}. Please provide corrected actions.`;

      const fixResponse = await this.processCustomerMessage(fixMessage);

      return {
        bot_message: fixResponse.bot_message,
        actions: fixResponse.actions
      };
    }

    return {
      bot_message: initialResponse.bot_message,
      actions: initialResponse.actions
    };
  }

  reset(): void {
    this.conversationHistory = [];
  }

  getConversationHistory(): Message[] {
    return [...this.conversationHistory];
  }
}
