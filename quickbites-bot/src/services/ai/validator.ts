import { validateActions, validateRefundAgainstOrder, validateMultipleRefunds } from '../../schemas/actions.schema';
import { BotAction } from '../simulator/api';
import { getOrderDetails } from '../db/order.service';

export interface ValidationResult {
  isValid: boolean;
  actions?: BotAction[];
  errorMessage?: string;
  correctedActions?: BotAction[];
}

export class ActionValidator {
  async validateAndCorrectActions(
    actions: BotAction[],
    conversationHistory: string[]
  ): Promise<ValidationResult> {
    // Step 1: Basic schema validation
    const basicValidation = validateActions(actions);
    if (!basicValidation.isValid) {
      return {
        isValid: false,
        errorMessage: `Schema validation failed: ${basicValidation.errors?.join(', ')}`
      };
    }

    // Step 2: Business logic validation
    const businessValidation = await this.validateBusinessLogic(actions);
    if (!businessValidation.isValid) {
      return businessValidation;
    }

    // Step 3: Cross-action validation
    const crossValidation = this.validateCrossActions(actions);
    if (!crossValidation.isValid) {
      return crossValidation;
    }

    return {
      isValid: true,
      actions
    };
  }

  private async validateBusinessLogic(actions: BotAction[]): Promise<ValidationResult> {
    for (const action of actions) {
      switch (action.type) {
        case 'issue_refund':
          const refundValidation = await this.validateRefund(action);
          if (!refundValidation.isValid) {
            return refundValidation;
          }
          break;

        case 'escalate_to_human':
          const escalationValidation = this.validateEscalation(action);
          if (!escalationValidation.isValid) {
            return escalationValidation;
          }
          break;

        case 'flag_abuse':
          const abuseValidation = this.validateAbuseFlag(action);
          if (!abuseValidation.isValid) {
            return abuseValidation;
          }
          break;

        case 'file_complaint':
          const complaintValidation = this.validateComplaint(action);
          if (!complaintValidation.isValid) {
            return complaintValidation;
          }
          break;

        case 'close':
          const closeValidation = this.validateClose(action);
          if (!closeValidation.isValid) {
            return closeValidation;
          }
          break;
      }
    }

    return { isValid: true };
  }

  private async validateRefund(action: BotAction): Promise<ValidationResult> {
    // Check refund amount against order total
    const orderDetails = getOrderDetails(action.order_id);
    if (!orderDetails) {
      return {
        isValid: false,
        errorMessage: `Order ${action.order_id} not found`
      };
    }

    const refundValidation = validateRefundAgainstOrder(action, orderDetails.total_inr);
    if (!refundValidation.isValid) {
      return {
        isValid: false,
        errorMessage: refundValidation.error
      };
    }

    // Additional business rules
    if (action.amount_inr < 10) {
      return {
        isValid: false,
        errorMessage: 'Refund amount must be at least ₹10'
      };
    }

    if (action.amount_inr > 5000) {
      return {
        isValid: false,
        errorMessage: 'Refund amount cannot exceed ₹5000 without human approval'
      };
    }

    return { isValid: true };
  }

  private validateEscalation(action: BotAction): ValidationResult {
    if (!action.reason || action.reason.length < 10) {
      return {
        isValid: false,
        errorMessage: 'Escalation reason must be at least 10 characters'
      };
    }

    if (action.reason.length > 500) {
      return {
        isValid: false,
        errorMessage: 'Escalation reason cannot exceed 500 characters'
      };
    }

    return { isValid: true };
  }

  private validateAbuseFlag(action: BotAction): ValidationResult {
    if (!action.reason || action.reason.length < 10) {
      return {
        isValid: false,
        errorMessage: 'Abuse flag reason must be at least 10 characters'
      };
    }

    if (action.reason.length > 500) {
      return {
        isValid: false,
        errorMessage: 'Abuse flag reason cannot exceed 500 characters'
      };
    }

    return { isValid: true };
  }

  private validateComplaint(action: BotAction): ValidationResult {
    const validTargets = ['restaurant', 'rider', 'app'];
    if (!validTargets.includes(action.target_type)) {
      return {
        isValid: false,
        errorMessage: `Invalid target_type. Must be one of: ${validTargets.join(', ')}`
      };
    }

    return { isValid: true };
  }

  private validateClose(action: BotAction): ValidationResult {
    if (!action.outcome_summary || action.outcome_summary.length < 10) {
      return {
        isValid: false,
        errorMessage: 'Close outcome summary must be at least 10 characters'
      };
    }

    if (action.outcome_summary.length > 1000) {
      return {
        isValid: false,
        errorMessage: 'Close outcome summary cannot exceed 1000 characters'
      };
    }

    return { isValid: true };
  }

  private validateCrossActions(actions: BotAction[]): ValidationResult {
    // Check for multiple refunds
    const multipleRefundsValidation = validateMultipleRefunds(actions);
    if (!multipleRefundsValidation.isValid) {
      return {
        isValid: false,
        errorMessage: multipleRefundsValidation.error
      };
    }

    // Check for too many actions
    if (actions.length > 5) {
      return {
        isValid: false,
        errorMessage: 'Cannot take more than 5 actions in a single response'
      };
    }

    return { isValid: true };
  }

  generateCorrectionMessage(validationError: string): string {
    return `The actions I tried to take had validation errors: ${validationError}. Please provide corrected actions that follow the policy guidelines.`;
  }
}
