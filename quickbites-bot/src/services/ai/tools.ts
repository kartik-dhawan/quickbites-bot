import { getOrderDetails, getCustomerHistory } from '../db/order.service';
import { getRiderIncidents, getRestaurantMetrics } from '../db/reputation.service';
import { getAbuseIndicators } from '../db/abuse.service';

// Tool definitions for Claude
export const anthropicTools = [
  {
    name: 'fetch_order_context',
    description: 'Get detailed information about a specific order including customer, restaurant, rider, and items',
    input_schema: {
      type: 'object' as const,
      properties: {
        order_id: {
          type: 'integer',
          description: 'The ID of the order to look up'
        }
      },
      required: ['order_id']
    }
  },
  {
    name: 'fetch_customer_history',
    description: 'Get a customer\'s order history, spending patterns, and loyalty tier',
    input_schema: {
      type: 'object' as const,
      properties: {
        customer_id: {
          type: 'integer',
          description: 'The ID of the customer to look up'
        }
      },
      required: ['customer_id']
    }
  },
  {
    name: 'fetch_rider_incidents',
    description: 'Get information about a rider\'s incident history including verified vs unverified incidents',
    input_schema: {
      type: 'object' as const,
      properties: {
        rider_id: {
          type: 'integer',
          description: 'The ID of the rider to look up'
        }
      },
      required: ['rider_id']
    }
  },
  {
    name: 'fetch_restaurant_metrics',
    description: 'Get restaurant performance metrics including ratings, reviews, and complaint rates',
    input_schema: {
      type: 'object' as const,
      properties: {
        restaurant_id: {
          type: 'integer',
          description: 'The ID of the restaurant to look up'
        }
      },
      required: ['restaurant_id']
    }
  },
  {
    name: 'assess_abuse_risk',
    description: 'Evaluate abuse indicators for a customer including complaint patterns and refund frequency',
    input_schema: {
      type: 'object' as const,
      properties: {
        customer_id: {
          type: 'integer',
          description: 'The ID of the customer to assess'
        }
      },
      required: ['customer_id']
    }
  },
  {
    name: 'submit_support_actions',
    description: 'Use this tool to execute support actions like refunds, complaints, or closing the chat. You MUST use this tool instead of just describing your actions in text. This is the final step after you have gathered all necessary information and made your decision.',
    input_schema: {
      type: 'object' as const,
      properties: {
        actions: {
          type: 'array',
          description: 'Array of support actions to execute',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['issue_refund', 'file_complaint', 'escalate_to_human', 'flag_abuse', 'close'],
                description: 'The type of action to take'
              },
              order_id: {
                type: 'integer',
                description: 'Order ID - REQUIRED for issue_refund and file_complaint actions. Do not include for other action types.'
              },
              amount_inr: {
                type: 'integer',
                description: 'Refund amount in INR - REQUIRED for issue_refund action. Do not include for other action types.'
              },
              method: {
                type: 'string',
                enum: ['cash', 'wallet_credit'],
                description: 'Refund method - REQUIRED for issue_refund action, must be exactly "cash" or "wallet_credit". Do not include for other action types.'
              },
              target_type: {
                type: 'string',
                enum: ['rider', 'restaurant', 'app'],
                description: 'Target for complaint - REQUIRED for file_complaint action. Do not include for other action types.'
              },
              reason: {
                type: 'string',
                description: 'Reason for the action - REQUIRED for escalate_to_human and flag_abuse actions. Do not include for other action types.'
              },
              outcome_summary: {
                type: 'string',
                description: 'Summary of the resolution - REQUIRED for close action. Do not include for other action types.'
              }
            },
            required: ['type']
          }
        }
      },
      required: ['actions']
    }
  }
];

// Tool execution function
export async function executeTool(toolName: string, input: any): Promise<any> {
  try {
    switch (toolName) {
      case 'fetch_order_context':
        return getOrderDetails(input.order_id);

      case 'fetch_customer_history':
        return getCustomerHistory(input.customer_id);

      case 'fetch_rider_incidents':
        return getRiderIncidents(input.rider_id);

      case 'fetch_restaurant_metrics':
        return getRestaurantMetrics(input.restaurant_id);

      case 'assess_abuse_risk':
        return getAbuseIndicators(input.customer_id);

      case 'submit_support_actions':
        // Return the actions directly - they will be validated and sent to simulator
        return input.actions;

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    return { error: `Failed to execute ${toolName}: ${error}` };
  }
}

// Tool result formatter for Claude
export function formatToolResult(toolName: string, result: any): string {
  if (result.error) {
    return `Error: ${result.error}`;
  }

  switch (toolName) {
    case 'fetch_order_context':
      if (!result) {
        return 'Order not found.';
      }
      return `Order Details:
- Order ID: ${result.id}
- Status: ${result.status}
- Total: ₹${result.total_inr}
- Placed: ${result.placed_at}
- Delivered: ${result.delivered_at || 'Not delivered'}
- Customer: ${result.customer?.name} (${result.customer?.loyalty_tier} tier)
- Restaurant: ${result.restaurant?.name} (${result.restaurant?.cuisine})
- Items: ${result.items?.map((item: any) => `${item.qty}x ${item.item_name} (₹${item.price_inr})`).join(', ')}`;

    case 'fetch_customer_history':
      return `Customer History:
- Total Orders: ${result.total_orders}
- Total Spend: ₹${result.total_spend}
- Loyalty Tier: ${result.loyalty_tier}
- Recent Orders: ${result.orders.slice(0, 5).map((o: any) => `Order ${o.id} (₹${o.total_inr}, ${o.status})`).join(', ')}`;

    case 'fetch_rider_incidents':
      return `Rider Incidents:
- Total Incidents: ${result.total_incidents}
- Verified: ${result.verified_incidents}
- Unverified: ${result.unverified_incidents}
- By Type: ${Object.entries(result.incidents_by_type).map(([type, count]) => `${type}: ${count}`).join(', ')}`;

    case 'fetch_restaurant_metrics':
      return `Restaurant Metrics:
- Average Rating: ${result.average_rating.toFixed(1)}/5
- Total Reviews: ${result.total_reviews}
- Low Rating Percentage: ${result.low_rating_percentage.toFixed(1)}%
- Complaint Rate: ${result.complaint_rate.toFixed(1)}%
- Recent Reviews: ${result.recent_reviews.slice(0, 3).map((r: any) => `${r.rating}/5: "${r.comment}"`).join(', ')}`;

    case 'assess_abuse_risk':
      return `Abuse Risk Assessment:
- Risk Score: ${result.risk_score}/100
- New Account: ${result.is_new_account ? 'Yes' : 'No'}
- High Complaint Rate: ${result.high_complaint_rate ? 'Yes' : 'No'}
- High Refund Frequency: ${result.high_refund_frequency ? 'Yes' : 'No'}
- High Rejection Rate: ${result.high_rejection_rate ? 'Yes' : 'No'}`;

    default:
      return JSON.stringify(result, null, 2);
  }
}
