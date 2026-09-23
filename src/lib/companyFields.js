// The account-research/scoring columns on `companies`, shared between the
// CSV importer and the admin company editor so the two never drift apart.
export const COMPANY_RESEARCH_FIELDS = [
  'industry', 'archetype', 'country', 'website', 'geography',
  'sustainable_packaging_coalition', 'principal_product_target', 'material_types', 'technical_process_fit',
  'rank', 'time_to_paid_revenue', 'revenue_12_24m', 'downstream_multiplier', 'technical_fit',
  'commitment_potential', 'strategic_value', 'engineering_efficiency', 'regulatory_simplicity',
  'weighted_score', 'priority_tier', 'commercial_gate_status', 'why_it_fits',
  'recommended_entry_proposition', 'next_action', 'scoring_basis', 'account_owner', 'notes'
];

export const COMPANY_SELECT = ['id', 'name', ...COMPANY_RESEARCH_FIELDS, 'created_at'].join(',');
