export function buildAgentContext({ data, selectedWing, selectedTeamLead, selectedHandler, periodMonths, handlerData }) {
  if (!handlerData) return '';

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
