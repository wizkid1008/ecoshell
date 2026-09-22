export const STAGES = [
  'new_inquiry',
  'qualified_lead',
  'technical_review',
  'nda_documentation',
  'sample_pilot_request',
  'pilot_in_progress',
  'pilot_complete',
  'commercial_proposal',
  'contract_negotiation',
  'commercial_customer',
  'closed_not_fit',
  'closed_lost'
];

export function isValidStage(value) {
  return STAGES.includes(value);
}
