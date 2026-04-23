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
  content: string;
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
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const response = await this.callClaude();

        if (response.type === 'message') {
          // Claude gave a direct response (no tools)
          const botMessage = response.content[0]?.type === 'text' ? response.content[0].text : '';

          this.conversationHistory.push({
            role: 'assistant',
            content: botMessage
          });

          return {
            bot_message: botMessage,
            actions: [],
            tools_used: []
          };
        } else if (response.type === 'tool_use') {
          // Claude wants to use tools
          const toolResults = await this.executeToolUse(response.content);

          // Add tool results to conversation and continue
          this.conversationHistory.push({
            role: 'assistant',
            content: JSON.stringify(toolResults)
          });

          attempts++;
          continue; // Try again with tool results
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
          actions: [{ type: 'escalate_to_human', reason: 'AI system error' }],
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
      actions: [{ type: 'escalate_to_human', reason: 'Max tool use attempts exceeded' }],
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

  private async executeToolUse(toolUseContent: any[]): Promise<any[]> {
    const results = [];

    for (const toolUse of toolUseContent) {
      if (toolUse.type === 'tool_use') {
        const toolName = toolUse.name;
        const toolInput = toolUse.input;

        try {
          const result = await executeTool(toolName, toolInput);
          const formattedResult = formatToolResult(toolName, result);

          results.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: formattedResult
          });
        } catch (error) {
          results.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: `Error executing ${toolName}: ${error}`
          });
        }
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
