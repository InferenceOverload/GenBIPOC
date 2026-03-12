import { getAnomalySummary } from '../utils/anomalyDetector';
import { useDashboard } from '../context/DashboardContext';

const METRIC_LABELS = {
  closure_rate_pct: 'closure rate', csat_score: 'CSAT score',
  error_rate_pct: 'error rate', litigation_rate_pct: 'litigation rate',
  reopen_rate_pct: 'reopen rate', training_hours: 'training hours',
  days_absent: 'days absent',
};

export default function AnomalyBanner() {
  const { getSelectedHandlerData, periodMonths } = useDashboard();
  const handler = getSelectedHandlerData();
  if (!handler) return null;

  const { red, yellow } = getAnomalySummary(handler.monthly_metrics, periodMonths);
  if (red.length === 0 && yellow.length === 0) return null;

  const topIssues = [...red, ...yellow].slice(0, 3).map(a => METRIC_LABELS[a.metric] || a.metric).join(', ');
  const severity = red.length > 0 ? 'red' : 'yellow';
  const total = red.length + yellow.length;

  return (
    <div className={`rounded-lg p-4 mb-4 flex items-start gap-3 ${
      severity === 'red' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
    }`}>
      <span className="text-xl shrink-0">{severity === 'red' ? '⚠️' : '👀'}</span>
      <div>
        <p className={`font-medium text-sm ${severity === 'red' ? 'text-red-800' : 'text-yellow-800'}`}>
          AI Insight: {total} metric{total > 1 ? 's' : ''} flagged
        </p>
        <p className={`text-sm mt-0.5 ${severity === 'red' ? 'text-red-600' : 'text-yellow-600'}`}>
          Significant changes detected in {topIssues}. Ask the agent for a full investigation.
        </p>
      </div>
    </div>
  );
}
