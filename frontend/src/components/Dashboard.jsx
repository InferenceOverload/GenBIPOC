import { useDashboard } from '../context/DashboardContext';
import { detectAnomalies } from '../utils/anomalyDetector';
import KPICard from './KPICard';
import AnomalyBanner from './AnomalyBanner';

const DISPLAY_METRICS = [
  'claims_assigned', 'claims_closed', 'calls_handled', 'avg_handle_time_min',
  'closure_rate_pct', 'reopen_rate_pct', 'csat_score', 'error_rate_pct',
  'supervisor_override_pct', 'avg_settlement_amt', 'reserve_accuracy_pct', 'litigation_rate_pct',
  'training_hours', 'certifications_completed', 'compliance_violations', 'days_absent',
];

const PERIOD_OPTIONS = [
  { label: '1M', value: 1 },
  { label: '3M', value: 3 },
  { label: '6M', value: 6 },
  { label: '12M', value: 12 },
];

export default function Dashboard() {
  const { data, loading, selectedWing, selectedTeamLead,
          getSelectedHandlerData, getSelectedTeamData, periodMonths, setPeriodMonths } = useDashboard();

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-500">Loading data...</div>;
  }

  const handler = getSelectedHandlerData();
  const team = getSelectedTeamData();
  const wing = data?.wings?.[selectedWing];

  const breadcrumbs = [];
  if (wing) breadcrumbs.push(wing.name);
  if (team) breadcrumbs.push(team.name);
  if (handler) breadcrumbs.push(handler.name);

  const anomalies = handler ? detectAnomalies(handler.monthly_metrics, periodMonths) : [];
  const anomalyMap = Object.fromEntries(anomalies.map(a => [a.metric, a]));

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {handler ? handler.name : team ? team.name : wing ? wing.name : 'Claims Performance Intelligence'}
          </h1>
          {breadcrumbs.length > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">{breadcrumbs.join(' > ')}</p>
          )}
          {handler && (
            <p className="text-xs text-gray-400 mt-1">
              {handler.lob} | {handler.tenure_years}yr tenure | {handler.team_lead_name}
            </p>
          )}
        </div>
        <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriodMonths(opt.value)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                periodMonths === opt.value
                  ? 'bg-[var(--hartford-primary)] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Anomaly Banner */}
      {handler && <AnomalyBanner />}

      {/* KPI Grid */}
      {handler ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {DISPLAY_METRICS.map(metric => (
            <KPICard
              key={metric}
              metric={metric}
              anomalyInfo={anomalyMap[metric]}
              monthlyMetrics={handler.monthly_metrics}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 mt-20">
          <p className="text-lg">Select a handler from the navigation</p>
          <p className="text-sm mt-1">Drill down through Wings → Team Leads → Handlers</p>
        </div>
      )}
    </div>
  );
}
