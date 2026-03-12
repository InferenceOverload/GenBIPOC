import { getAllHandlers, getWingHandlers, getTeamHandlers, aggregateMetric } from './aggregator';

const KEY_METRICS = [
  'csat_score', 'closure_rate_pct', 'reopen_rate_pct', 'avg_handle_time_min',
  'error_rate_pct', 'litigation_rate_pct', 'avg_settlement_amt', 'reserve_accuracy_pct',
  'supervisor_override_pct', 'claims_assigned', 'claims_closed', 'calls_handled',
  'training_hours', 'certifications_completed', 'compliance_violations', 'days_absent',
];

function buildMetricSnapshot(handlers, periodMonths) {
  let snapshot = '';
  for (const m of KEY_METRICS) {
    const agg = aggregateMetric(handlers, m, periodMonths);
    if (!agg) continue;
    const arrow = agg.change > 0 ? '↑' : agg.change < 0 ? '↓' : '→';
    const formatted = Number.isInteger(agg.current) ? agg.current : agg.current.toFixed(1);
    snapshot += `- ${m}: ${formatted} (${arrow}${Math.abs(agg.change)}%)\n`;
  }
  return snapshot;
}

export function buildAgentContext({ data, selectedWing, selectedTeamLead, selectedHandler, periodMonths, handlerData }) {
  if (!data) return '';

  // Handler level
  if (handlerData) {
    const wing = data?.wings?.[selectedWing];
    const tl = wing?.team_leads?.[selectedTeamLead];
    const recent = handlerData.monthly_metrics.slice(-periodMonths);
    const prior = handlerData.monthly_metrics.slice(-(periodMonths * 2), -periodMonths);

    let snapshot = '';
    if (recent.length > 0 && prior.length > 0) {
      const metrics = Object.keys(recent[0]).filter(k => k !== 'month');
      for (const m of metrics) {
        const currAvg = recent.reduce((a, r) => a + r[m], 0) / recent.length;
        const priorAvg = prior.reduce((a, r) => a + r[m], 0) / prior.length;
        const pct = priorAvg !== 0 ? Math.round(((currAvg - priorAvg) / priorAvg) * 100) : 0;
        const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→';
        const formatted = Number.isInteger(currAvg) ? currAvg : currAvg.toFixed(1);
        snapshot += `- ${m}: ${formatted} (${arrow}${Math.abs(pct)}%)\n`;
      }
    }

    const monthRange = recent.length > 0
      ? `${recent[0].month} to ${recent[recent.length - 1].month}`
      : 'N/A';

    return `=== CURRENT DASHBOARD CONTEXT ===
Level: Handler
Wing: ${selectedWing} — ${wing?.name || ''}
Team Lead: ${tl?.name || ''} (ID: ${selectedTeamLead})
Handler: ${handlerData.name} (ID: ${handlerData.handler_id})
LOB: ${handlerData.lob}
Tenure: ${handlerData.tenure_years} years
Selected Period: Last ${periodMonths} Months (${monthRange})

Latest KPI Snapshot (vs prior ${periodMonths} months):
${snapshot}=================================`;
  }

  // Team level
  if (selectedTeamLead && selectedWing) {
    const wing = data.wings[selectedWing];
    const tl = wing?.team_leads?.[selectedTeamLead];
    const handlers = getTeamHandlers(data, selectedWing, selectedTeamLead);
    const snapshot = buildMetricSnapshot(handlers, periodMonths);

    return `=== CURRENT DASHBOARD CONTEXT ===
Level: Team
Wing: ${selectedWing} — ${wing?.name || ''}
Team Lead: ${tl?.name || ''} (ID: ${selectedTeamLead})
Handlers in scope: ${handlers.length} (${handlers.map(h => h.name).join(', ')})
Selected Period: Last ${periodMonths} Months

Aggregated KPI Snapshot (vs prior ${periodMonths} months):
${snapshot}
The user is looking at team-level aggregated metrics. They want to understand patterns, correlations, and root causes across this team. Use the tools to investigate individual handlers and find what's driving the aggregate numbers.
=================================`;
  }

  // Wing level
  if (selectedWing) {
    const wing = data.wings[selectedWing];
    const handlers = getWingHandlers(data, selectedWing);
    const teamLeads = Object.values(wing?.team_leads || {}).map(tl => tl.name);
    const snapshot = buildMetricSnapshot(handlers, periodMonths);

    return `=== CURRENT DASHBOARD CONTEXT ===
Level: Wing
Wing: ${selectedWing} — ${wing?.name || ''}
Team Leads: ${teamLeads.join(', ')}
Handlers in scope: ${handlers.length}
Selected Period: Last ${periodMonths} Months

Aggregated KPI Snapshot (vs prior ${periodMonths} months):
${snapshot}
The user is looking at wing-level aggregated metrics. They want to understand which teams or handlers are driving the trends. Use the tools to drill into individual handlers and teams to find correlations and root causes.
=================================`;
  }

  // Org level
  const handlers = getAllHandlers(data);
  const wings = Object.values(data.wings || {}).map(w => w.name);
  const snapshot = buildMetricSnapshot(handlers, periodMonths);

  return `=== CURRENT DASHBOARD CONTEXT ===
Level: Organization
Wings: ${wings.join(', ')}
Total Handlers: ${handlers.length}
Selected Period: Last ${periodMonths} Months

Aggregated KPI Snapshot (vs prior ${periodMonths} months):
${snapshot}
The user is an executive looking at organization-wide metrics. They want to understand what's driving the numbers — which wings, teams, or individual handlers are causing the trends. Use the tools to drill down and find correlations, root causes, and actionable patterns.
=================================`;
}
