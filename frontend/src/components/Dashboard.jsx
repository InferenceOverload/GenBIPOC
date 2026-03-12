import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { detectAnomalies } from '../utils/anomalyDetector';
import KPICard from './KPICard';
import AnomalyBanner from './AnomalyBanner';
import ExecutiveScorecard from './ExecutiveScorecard';
import RawDataTable from './RawDataTable';

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

const TABS = [
  { id: 'scorecard', label: 'Report Card' },
  { id: 'raw', label: 'Raw Data' },
];

export default function Dashboard() {
  const { data, loading, selectedWing, selectedTeamLead,
          getSelectedHandlerData, getSelectedTeamData, periodMonths, setPeriodMonths } = useDashboard();
  const [activeTab, setActiveTab] = useState('scorecard');

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

  // At handler level, default to scorecard (KPI cards). At higher levels, show tabs.
  const showTabs = true; // Always show tabs for easy switching

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
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
        <div className="flex items-center gap-3">
          {/* Period Selector */}
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
      </div>

      {/* Tabs */}
      {showTabs && (
        <div className="flex gap-1 mb-5 border-b border-gray-200">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-[var(--hartford-primary)] text-[var(--hartford-primary)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'raw' ? (
        <RawDataTable />
      ) : handler ? (
        <>
          {/* Anomaly Banner */}
          <AnomalyBanner />
          {/* KPI Grid */}
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
        </>
      ) : (
        <ExecutiveScorecard />
      )}
    </div>
  );
}
