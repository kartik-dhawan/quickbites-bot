import * as yup from 'yup';

// Base action schema
const baseActionSchema = yup.object({
  type: yup.string().required()
});

// Specific action schemas
const issueRefundSchema = baseActionSchema.shape({
  type: yup.string().oneOf(['issue_refund']).required(),
  order_id: yup.number().integer().positive().required(),
  amount_inr: yup.number().integer().positive().max(5000).required(),
  method: yup.string().oneOf(['cash', 'wallet_credit']).required()
}).noUnknown(true);

const fileComplaintSchema = baseActionSchema.shape({
  type: yup.string().oneOf(['file_complaint']).required(),
  order_id: yup.number().integer().positive().required(),
  target_type: yup.string().oneOf(['restaurant', 'rider', 'app']).required()
}).noUnknown(true);

const escalateToHumanSchema = baseActionSchema.shape({
  type: yup.string().oneOf(['escalate_to_human']).required(),
  reason: yup.string().min(10).max(500).required()
}).noUnknown(true);

const flagAbuseSchema = baseActionSchema.shape({
  type: yup.string().oneOf(['flag_abuse']).required(),
  reason: yup.string().min(10).max(500).required()
}).noUnknown(true);

const closeSchema = baseActionSchema.shape({
  type: yup.string().oneOf(['close']).required(),
  outcome_summary: yup.string().required()
}).noUnknown(true);

// Union of all action types
const actionSchema = yup.lazy((value) => {
  if (!value || typeof value !== 'object' || !value.type) {
    return yup.mixed().oneOf(['issue_refund', 'file_complaint', 'escalate_to_human', 'flag_abuse', 'close']);
  }

  switch (value.type) {
    case 'issue_refund':
      return issueRefundSchema;
    case 'file_complaint':
      return fileComplaintSchema;
    case 'escalate_to_human':
      return escalateToHumanSchema;
    case 'flag_abuse':
      return flagAbuseSchema;
    case 'close':
      return closeSchema;
    default:
      return yup.mixed().oneOf(['issue_refund', 'file_complaint', 'escalate_to_human', 'flag_abuse', 'close']);
  }
});

// Array of actions schema
export const actionsArraySchema = yup.array().of(actionSchema).min(0).max(5);

// Validation function
export function validateActions(actions: any[]): { isValid: boolean; errors?: string[] } {
  try {
    actionsArraySchema.validateSync(actions);
    return { isValid: true };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return {
        isValid: false,
        errors: error.errors.map(err => `Action validation error: ${err}`)
      };
    }
    return { isValid: false, errors: ['Unknown validation error'] };
  }
}

// Additional business logic validations
export function validateRefundAgainstOrder(refundAction: any, orderTotal: number): { isValid: boolean; error?: string } {
  if (refundAction.amount_inr > orderTotal) {
    return {
      isValid: false,
      error: `Refund amount (${refundAction.amount_inr}) cannot exceed order total (${orderTotal})`
    };
  }
  return { isValid: true };
}

export function validateMultipleRefunds(actions: any[]): { isValid: boolean; error?: string } {
  const refunds = actions.filter(action => action.type === 'issue_refund');
  if (refunds.length > 1) {
    return {
      isValid: false,
      error: 'Cannot issue multiple refunds in a single response'
    };
  }
  return { isValid: true };
}
