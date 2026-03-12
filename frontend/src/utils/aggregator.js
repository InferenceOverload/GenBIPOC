// Aggregate metrics across multiple handlers for executive views

/**
 * Get all handlers in the org (flat list)
 */
export function getAllHandlers(data) {
  if (!data?.wings) return [];
  const handlers = [];
  for (const wing of Object.values(data.wings)) {
    for (const tl of Object.values(wing.team_leads)) {
      for (const h of tl.handlers) {
        handlers.push({ ...h, wingName: wing.name, teamLeadName: tl.name });
      }
    }
  }
  return handlers;
}

/**
 * Get handlers for a specific wing
 */
export function getWingHandlers(data, wingId) {
  const wing = data?.wings?.[wingId];
  if (!wing) return [];
  const handlers = [];
  for (const tl of Object.values(wing.team_leads)) {
    for (const h of tl.handlers) {
      handlers.push({ ...h, wingName: wing.name, teamLeadName: tl.name });
    }
  }
  return handlers;
}

/**
 * Get handlers for a specific team lead
 */
export function getTeamHandlers(data, wingId, tlId) {
  const tl = data?.wings?.[wingId]?.team_leads?.[tlId];
  if (!tl) return [];
  return tl.handlers.map(h => ({ ...h, teamLeadName: tl.name }));
}

/**
 * Aggregate a metric across handlers for the last N months
 * Returns { current, prior, change, trend }
 */
export function aggregateMetric(handlers, metric, periodMonths = 3) {
  if (!handlers.length) return null;

  let currentSum = 0, currentCount = 0;
  let priorSum = 0, priorCount = 0;

  for (const h of handlers) {
    const metrics = h.monthly_metrics;
    if (!metrics?.length) continue;

    const recent = metrics.slice(-periodMonths);
    const prior = metrics.slice(-(periodMonths * 2), -periodMonths);

    for (const m of recent) {
      if (m[metric] !== undefined) { currentSum += m[metric]; currentCount++; }
    }
    for (const m of prior) {
      if (m[metric] !== undefined) { priorSum += m[metric]; priorCount++; }
    }
  }

  const current = currentCount > 0 ? currentSum / currentCount : 0;
  const prior = priorCount > 0 ? priorSum / priorCount : 0;
  const change = prior !== 0 ? ((current - prior) / prior) * 100 : 0;

  return {
    current: Math.round(current * 100) / 100,
    prior: Math.round(prior * 100) / 100,
    change: Math.round(change),
    trend: change > 2 ? 'up' : change < -2 ? 'down' : 'stable',
  };
}

/**
 * Aggregate all metrics in a dimension across handlers
 */
export function aggregateDimension(handlers, dimension, periodMonths = 3) {
  const results = {};
  for (const metric of dimension.metrics) {
    results[metric] = aggregateMetric(handlers, metric, periodMonths);
  }
  return results;
}

/**
 * Compute a simple health score for a dimension (0-100)
 * Based on how many metrics are trending well vs poorly
 */
export function computeDimensionHealth(handlers, dimension, periodMonths = 3) {
  const HIGHER_GOOD = new Set(['csat_score', 'closure_rate_pct', 'reserve_accuracy_pct', 'claims_closed', 'calls_handled', 'certifications_completed']);
  const LOWER_GOOD = new Set(['reopen_rate_pct', 'error_rate_pct', 'litigation_rate_pct', 'supervisor_override_pct', 'compliance_violations', 'days_absent', 'avg_handle_time_min', 'avg_settlement_amt']);

  let good = 0, bad = 0, neutral = 0;

  for (const metric of dimension.metrics) {
    const agg = aggregateMetric(handlers, metric, periodMonths);
    if (!agg) { neutral++; continue; }

    const isHigherGood = HIGHER_GOOD.has(metric);
    const isLowerGood = LOWER_GOOD.has(metric);

    if (isHigherGood) {
      if (agg.change > 2) good++;
      else if (agg.change < -5) bad++;
      else neutral++;
    } else if (isLowerGood) {
      if (agg.change < -2) good++;
      else if (agg.change > 5) bad++;
      else neutral++;
    } else {
      neutral++;
    }
  }

  const total = good + bad + neutral;
  if (total === 0) return { score: 50, status: 'stable' };
  const score = Math.round(((good * 100 + neutral * 50) / total));
  const status = bad > good ? 'needs_attention' : good > bad ? 'improving' : 'stable';
  return { score, status, good, bad, neutral };
}

/**
 * Get handler-level summary for a table view (latest month + change)
 */
export function getHandlerSummary(handler, metric, periodMonths = 3) {
  const metrics = handler.monthly_metrics;
  if (!metrics?.length) return null;

  const latest = metrics[metrics.length - 1][metric];
  const recent = metrics.slice(-periodMonths);
  const prior = metrics.slice(-(periodMonths * 2), -periodMonths);

  const recentAvg = recent.reduce((s, m) => s + (m[metric] || 0), 0) / recent.length;
  const priorAvg = prior.length ? prior.reduce((s, m) => s + (m[metric] || 0), 0) / prior.length : recentAvg;
  const change = priorAvg !== 0 ? Math.round(((recentAvg - priorAvg) / priorAvg) * 100) : 0;

  return { latest, avg: Math.round(recentAvg * 100) / 100, change };
}
