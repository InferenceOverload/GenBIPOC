// KPI Dimensions — groups metrics into executive-friendly categories
export const KPI_DIMENSIONS = {
  customer_experience: {
    label: 'Customer Experience',
    icon: '👥',
    metrics: ['csat_score', 'reopen_rate_pct', 'calls_handled'],
    primaryMetric: 'csat_score',
    description: 'Customer satisfaction and service quality',
  },
  handler_efficiency: {
    label: 'Handler Efficiency',
    icon: '⚡',
    metrics: ['closure_rate_pct', 'avg_handle_time_min', 'claims_assigned', 'claims_closed'],
    primaryMetric: 'closure_rate_pct',
    description: 'Productivity, throughput, and cycle time',
  },
  financial_performance: {
    label: 'Financial Performance',
    icon: '💰',
    metrics: ['avg_settlement_amt', 'reserve_accuracy_pct', 'litigation_rate_pct', 'error_rate_pct', 'supervisor_override_pct'],
    primaryMetric: 'litigation_rate_pct',
    description: 'Cost control, accuracy, and risk exposure',
  },
  development_compliance: {
    label: 'Development & Compliance',
    icon: '📋',
    metrics: ['training_hours', 'certifications_completed', 'compliance_violations', 'days_absent'],
    primaryMetric: 'compliance_violations',
    description: 'Training, certifications, and adherence',
  },
};

export const METRIC_LABELS = {
  claims_assigned: 'Claims Assigned', claims_closed: 'Claims Closed',
  calls_handled: 'Calls Handled', avg_handle_time_min: 'Avg Handle Time',
  closure_rate_pct: 'Closure Rate', reopen_rate_pct: 'Reopen Rate',
  csat_score: 'CSAT Score', error_rate_pct: 'Error Rate',
  supervisor_override_pct: 'Supervisor Override', avg_settlement_amt: 'Avg Settlement',
  reserve_accuracy_pct: 'Reserve Accuracy', litigation_rate_pct: 'Litigation Rate',
  training_hours: 'Training Hours', certifications_completed: 'Certifications',
  compliance_violations: 'Compliance Violations', days_absent: 'Days Absent',
};

export const METRIC_UNITS = {
  csat_score: '/5', closure_rate_pct: '%', reopen_rate_pct: '%', error_rate_pct: '%',
  supervisor_override_pct: '%', reserve_accuracy_pct: '%', litigation_rate_pct: '%',
  avg_handle_time_min: 'min', avg_settlement_amt: '$',
};

// Higher is better for these metrics
export const HIGHER_IS_BETTER = new Set([
  'csat_score', 'closure_rate_pct', 'reserve_accuracy_pct', 'claims_closed',
  'calls_handled', 'certifications_completed',
]);

// Lower is better for these metrics
export const LOWER_IS_BETTER = new Set([
  'reopen_rate_pct', 'error_rate_pct', 'litigation_rate_pct', 'supervisor_override_pct',
  'avg_handle_time_min', 'avg_settlement_amt', 'compliance_violations', 'days_absent',
]);
