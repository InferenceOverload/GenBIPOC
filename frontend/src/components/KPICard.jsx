import { LineChart, Line, ResponsiveContainer } from 'recharts';

const METRIC_LABELS = {
  claims_assigned: 'Claims Assigned', claims_closed: 'Claims Closed',
  calls_handled: 'Calls Handled', avg_handle_time_min: 'Avg Handle Time',
  closure_rate_pct: 'Closure Rate', reopen_rate_pct: 'Reopen Rate',
  csat_score: 'CSAT Score', error_rate_pct: 'Error Rate',
  supervisor_override_pct: 'Supervisor Override', avg_settlement_amt: 'Avg Settlement',
  reserve_accuracy_pct: 'Reserve Accuracy', litigation_rate_pct: 'Litigation Rate',
  training_hours: 'Training Hours', certifications_completed: 'Certifications',
  compliance_violations: 'Compliance Violations', days_absent: 'Days Absent',
};

const SEVERITY_COLORS = {
  normal: 'border-gray-200 bg-white',
  watch: 'border-yellow-400 bg-yellow-50',
  anomaly: 'border-red-400 bg-red-50',
};

export default function KPICard({ metric, anomalyInfo, monthlyMetrics }) {
  const label = METRIC_LABELS[metric] || metric;
  const severity = anomalyInfo?.severity || 'normal';
  const sparkData = monthlyMetrics.slice(-6).map((m, i) => ({ i, v: m[metric] }));
  const latest = anomalyInfo?.latest ?? monthlyMetrics[monthlyMetrics.length - 1]?.[metric];
  const momChange = anomalyInfo?.momChange;

  const sparkColor = severity === 'anomaly' ? '#ef4444' : severity === 'watch' ? '#eab308' : '#2E75B6';

  const severityBadge = severity === 'anomaly'
    ? <span className="text-red-600 text-xs font-medium px-1.5 py-0.5 bg-red-100 rounded">Anomaly</span>
    : severity === 'watch'
    ? <span className="text-yellow-600 text-xs font-medium px-1.5 py-0.5 bg-yellow-100 rounded">Watch</span>
    : null;

  return (
    <div className={`rounded-lg border-2 p-4 ${SEVERITY_COLORS[severity]} transition-all`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
        {severityBadge}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-2xl font-bold text-gray-900">
            {typeof latest === 'number' ? (Number.isInteger(latest) ? latest : latest.toFixed(1)) : '—'}
          </span>
          {momChange !== null && momChange !== undefined && (
            <span className={`ml-2 text-sm font-medium ${
              momChange > 0 ? 'text-green-600' : momChange < 0 ? 'text-red-600' : 'text-gray-400'
            }`}>
              {momChange > 0 ? '↑' : momChange < 0 ? '↓' : '→'}{Math.abs(momChange)}%
            </span>
          )}
        </div>
        <div className="w-20 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
