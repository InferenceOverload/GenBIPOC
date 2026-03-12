import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { getAllHandlers, getWingHandlers, getTeamHandlers } from '../utils/aggregator';
import { METRIC_LABELS } from '../utils/kpiDimensions';

const ALL_METRICS = [
  'claims_assigned', 'claims_closed', 'calls_handled', 'avg_handle_time_min',
  'closure_rate_pct', 'reopen_rate_pct', 'csat_score', 'error_rate_pct',
  'supervisor_override_pct', 'avg_settlement_amt', 'reserve_accuracy_pct', 'litigation_rate_pct',
  'training_hours', 'certifications_completed', 'compliance_violations', 'days_absent',
];

function formatCell(metric, value) {
  if (value === undefined || value === null) return '—';
  if (metric === 'avg_settlement_amt') return `$${Math.round(value).toLocaleString()}`;
  if (typeof value === 'number' && !Number.isInteger(value)) return value.toFixed(1);
  return value;
}

export default function RawDataTable() {
  const { data, selectedWing, selectedTeamLead, selectedHandler, periodMonths } = useDashboard();
  const [viewMode, setViewMode] = useState('latest'); // 'latest' | 'monthly'
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  if (!data) return null;

  let handlers;
  if (selectedHandler) {
    // Single handler — show monthly breakdown
    if (selectedWing && selectedTeamLead) {
      const tl = data.wings[selectedWing]?.team_leads[selectedTeamLead];
      handlers = tl?.handlers?.filter(h => h.handler_id === selectedHandler) || [];
    } else {
      handlers = [];
    }
  } else if (selectedTeamLead && selectedWing) {
    handlers = getTeamHandlers(data, selectedWing, selectedTeamLead);
  } else if (selectedWing) {
    handlers = getWingHandlers(data, selectedWing);
  } else {
    handlers = getAllHandlers(data);
  }

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  // Build rows based on view mode
  let rows;
  if (viewMode === 'monthly' && handlers.length === 1) {
    // Monthly breakdown for single handler
    const h = handlers[0];
    rows = h.monthly_metrics.map(m => ({
      id: m.month,
      name: m.month,
      lob: h.lob,
      wingName: h.wing_name || '',
      teamLeadName: h.team_lead_name || '',
      ...m,
    }));
  } else {
    // Latest month for each handler
    rows = handlers.map(h => {
      const recent = h.monthly_metrics?.slice(-periodMonths) || [];
      const avg = {};
      for (const metric of ALL_METRICS) {
        const vals = recent.map(m => m[metric]).filter(v => v !== undefined);
        avg[metric] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : undefined;
      }
      return {
        id: h.handler_id,
        name: h.name,
        lob: h.lob,
        wingName: h.wing_name || h.wingName || '',
        teamLeadName: h.team_lead_name || h.teamLeadName || '',
        tenure: h.tenure_years,
        ...avg,
      };
    });

    // Sort
    rows.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const SortHeader = ({ col, label, className = '' }) => (
    <th
      className={`px-3 py-2 text-left font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none ${className}`}
      onClick={() => toggleSort(col)}
    >
      {label} {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {rows.length} {viewMode === 'monthly' ? 'months' : 'handlers'} — {periodMonths}M average
        </p>
        {handlers.length === 1 && (
          <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setViewMode('latest')}
              className={`px-3 py-1 text-xs rounded-md ${viewMode === 'latest' ? 'bg-gray-800 text-white' : 'text-gray-600'}`}
            >
              Summary
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1 text-xs rounded-md ${viewMode === 'monthly' ? 'bg-gray-800 text-white' : 'text-gray-600'}`}
            >
              Monthly
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-auto max-h-[calc(100vh-280px)]">
        <table className="w-full text-xs whitespace-nowrap">
          <thead className="bg-gray-50 border-b sticky top-0">
            <tr>
              <SortHeader col="name" label={viewMode === 'monthly' ? 'Month' : 'Handler'} className="sticky left-0 bg-gray-50 z-10 min-w-[140px]" />
              {viewMode !== 'monthly' && <SortHeader col="lob" label="LOB" />}
              {viewMode !== 'monthly' && !selectedWing && <SortHeader col="wingName" label="Wing" />}
              {viewMode !== 'monthly' && !selectedTeamLead && <SortHeader col="teamLeadName" label="Team Lead" />}
              {ALL_METRICS.map(m => (
                <SortHeader key={m} col={m} label={METRIC_LABELS[m]} />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id || idx} className="border-b last:border-0 hover:bg-blue-50/50">
                <td className="px-3 py-2 font-medium text-gray-900 sticky left-0 bg-white z-10">{row.name}</td>
                {viewMode !== 'monthly' && <td className="px-3 py-2 text-gray-600">{row.lob}</td>}
                {viewMode !== 'monthly' && !selectedWing && <td className="px-3 py-2 text-gray-600">{row.wingName}</td>}
                {viewMode !== 'monthly' && !selectedTeamLead && <td className="px-3 py-2 text-gray-600">{row.teamLeadName}</td>}
                {ALL_METRICS.map(m => {
                  const val = row[m];
                  // Highlight concerning values
                  let cellClass = 'text-gray-700';
                  if (m === 'csat_score' && val < 3.4) cellClass = 'text-red-600 font-semibold bg-red-50';
                  else if (m === 'litigation_rate_pct' && val > 18) cellClass = 'text-red-600 font-semibold bg-red-50';
                  else if (m === 'error_rate_pct' && val > 9) cellClass = 'text-red-600 font-semibold bg-red-50';
                  else if (m === 'reopen_rate_pct' && val > 10) cellClass = 'text-yellow-700 font-semibold bg-yellow-50';

                  return (
                    <td key={m} className={`px-3 py-2 text-right ${cellClass}`}>
                      {formatCell(m, val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
