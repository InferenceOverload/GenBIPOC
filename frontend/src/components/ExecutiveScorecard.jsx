import { useDashboard } from '../context/DashboardContext';
import { KPI_DIMENSIONS, METRIC_LABELS, METRIC_UNITS } from '../utils/kpiDimensions';
import { getAllHandlers, getWingHandlers, getTeamHandlers, aggregateMetric, computeDimensionHealth } from '../utils/aggregator';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const STATUS_CONFIG = {
  improving: { label: 'Improving', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500' },
  stable: { label: 'Stable', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' },
  needs_attention: { label: 'Needs Attention', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
};

function formatValue(metric, value) {
  if (value === undefined || value === null) return '—';
  const unit = METRIC_UNITS[metric];
  if (unit === '$') return `$${Math.round(value).toLocaleString()}`;
  if (unit === '%') return `${value.toFixed(1)}%`;
  if (unit === '/5') return value.toFixed(2);
  if (unit === 'min') return `${value.toFixed(1)}m`;
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function MetricRow({ metric, handlers, periodMonths }) {
  const agg = aggregateMetric(handlers, metric, periodMonths);
  if (!agg) return null;

  const label = METRIC_LABELS[metric] || metric;
  const changeColor = agg.change > 0 ? 'text-green-600' : agg.change < 0 ? 'text-red-600' : 'text-gray-400';
  const arrow = agg.change > 0 ? '↑' : agg.change < 0 ? '↓' : '→';

  // Mini sparkline from all handlers' latest months
  const sparkData = [];
  for (const h of handlers) {
    const recent = h.monthly_metrics?.slice(-6) || [];
    recent.forEach((m, i) => {
      if (!sparkData[i]) sparkData[i] = { i, sum: 0, count: 0 };
      sparkData[i].sum += m[metric] || 0;
      sparkData[i].count++;
    });
  }
  const sparkline = sparkData.map(d => ({ i: d.i, v: d.count ? d.sum / d.count : 0 }));

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600 w-40">{label}</span>
      <div className="flex items-center gap-4">
        <div className="w-16 h-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkline}>
              <Line type="monotone" dataKey="v" stroke="#6B7280" strokeWidth={1} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <span className="text-sm font-semibold text-gray-900 w-20 text-right">
          {formatValue(metric, agg.current)}
        </span>
        <span className={`text-xs font-medium w-14 text-right ${changeColor}`}>
          {arrow}{Math.abs(agg.change)}%
        </span>
      </div>
    </div>
  );
}

function DimensionCard({ dimensionKey, dimension, handlers, periodMonths }) {
  const health = computeDimensionHealth(handlers, dimension, periodMonths);
  const config = STATUS_CONFIG[health.status];

  return (
    <div className={`rounded-xl border-2 ${config.border} ${config.bg} p-5 transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{dimension.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{dimension.label}</h3>
            <p className="text-xs text-gray-500">{dimension.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${config.dot}`} />
          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        </div>
      </div>

      <div className="space-y-0">
        {dimension.metrics.map(metric => (
          <MetricRow key={metric} metric={metric} handlers={handlers} periodMonths={periodMonths} />
        ))}
      </div>
    </div>
  );
}

function WingBreakdown({ data, periodMonths }) {
  if (!data?.wings) return null;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Wing Performance Overview</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Wing</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Handlers</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Avg CSAT</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Closure Rate</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Litigation Rate</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Error Rate</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Flags</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.wings).map(([wingId, wing]) => {
              const handlers = getWingHandlers(data, wingId);
              const csat = aggregateMetric(handlers, 'csat_score', periodMonths);
              const closure = aggregateMetric(handlers, 'closure_rate_pct', periodMonths);
              const litigation = aggregateMetric(handlers, 'litigation_rate_pct', periodMonths);
              const errorRate = aggregateMetric(handlers, 'error_rate_pct', periodMonths);

              // Count anomalies in wing
              let anomalyCount = 0;
              for (const h of handlers) {
                const latest = h.monthly_metrics?.[h.monthly_metrics.length - 1];
                if (latest?.csat_score < 3.4 || latest?.litigation_rate_pct > 18 || latest?.error_rate_pct > 9) anomalyCount++;
              }

              return (
                <tr key={wingId} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{wing.name}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{handlers.length}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={csat?.current < 3.8 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                      {csat?.current.toFixed(2)}
                    </span>
                    <span className={`ml-1 text-xs ${csat?.change > 0 ? 'text-green-600' : csat?.change < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {csat?.change > 0 ? '↑' : csat?.change < 0 ? '↓' : '→'}{Math.abs(csat?.change || 0)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-gray-900">{closure?.current.toFixed(1)}%</span>
                    <span className={`ml-1 text-xs ${closure?.change > 0 ? 'text-green-600' : closure?.change < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {closure?.change > 0 ? '↑' : '↓'}{Math.abs(closure?.change || 0)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={litigation?.current > 12 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                      {litigation?.current.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={errorRate?.current > 6 ? 'text-yellow-600 font-medium' : 'text-gray-900'}>
                      {errorRate?.current.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {anomalyCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        {anomalyCount} alert{anomalyCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ExecutiveScorecard() {
  const { data, periodMonths, selectedWing, selectedTeamLead } = useDashboard();
  if (!data) return null;

  let handlers;
  let scopeLabel;
  if (selectedTeamLead && selectedWing) {
    handlers = getTeamHandlers(data, selectedWing, selectedTeamLead);
    const tl = data.wings[selectedWing]?.team_leads[selectedTeamLead];
    scopeLabel = `${data.wings[selectedWing]?.name} > ${tl?.name}`;
  } else if (selectedWing) {
    handlers = getWingHandlers(data, selectedWing);
    scopeLabel = data.wings[selectedWing]?.name;
  } else {
    handlers = getAllHandlers(data);
    scopeLabel = 'Organization-Wide';
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-gray-500">
          Executive Report Card — {scopeLabel} — Last {periodMonths} months vs prior {periodMonths} months
        </p>
      </div>

      {/* Dimension Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Object.entries(KPI_DIMENSIONS).map(([key, dim]) => (
          <DimensionCard key={key} dimensionKey={key} dimension={dim} handlers={handlers} periodMonths={periodMonths} />
        ))}
      </div>

      {/* Wing Breakdown (only at org level) */}
      {!selectedWing && <WingBreakdown data={data} periodMonths={periodMonths} />}
    </div>
  );
}
