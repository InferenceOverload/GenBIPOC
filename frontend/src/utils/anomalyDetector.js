const THRESHOLDS = {
  closure_rate_pct:    { watch: v => v < 80, anomaly: v => v < 70, direction: 'lower_bad' },
  csat_score:          { watch: v => v < 3.8, anomaly: v => v < 3.4, direction: 'lower_bad' },
  error_rate_pct:      { watch: v => v > 6, anomaly: v => v > 9, direction: 'higher_bad' },
  litigation_rate_pct: { watch: v => v > 14, anomaly: v => v > 18, direction: 'higher_bad' },
  reopen_rate_pct:     { watch: v => v > 7, anomaly: v => v > 10, direction: 'higher_bad' },
  training_hours:      { watch: v => v > 12, anomaly: () => false, direction: 'spike' },
  days_absent:         { watch: v => v > 2, anomaly: v => v > 4, direction: 'higher_bad' },
};

export function detectAnomalies(metrics, periodMonths = 3) {
  if (!metrics || metrics.length === 0) return [];
  const recent = metrics.slice(-periodMonths);
  const anomalies = [];

  for (const [metric, rules] of Object.entries(THRESHOLDS)) {
    const values = recent.map(m => m[metric]).filter(v => v !== undefined);
    if (values.length === 0) continue;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const latest = values[values.length - 1];

    let momChange = null;
    if (metrics.length >= periodMonths + 1) {
      const prior = metrics.slice(-(periodMonths + 1), -1);
      const priorVals = prior.map(m => m[metric]).filter(v => v !== undefined);
      if (priorVals.length > 0) {
        const priorAvg = priorVals.reduce((a, b) => a + b, 0) / priorVals.length;
        momChange = priorAvg !== 0 ? Math.round(((avg - priorAvg) / priorAvg) * 100) : null;
      }
    }

    let severity = 'normal';
    if (rules.anomaly(latest)) severity = 'anomaly';
    else if (rules.watch(latest)) severity = 'watch';

    anomalies.push({ metric, latest, avg: Math.round(avg * 100) / 100, severity, momChange, direction: rules.direction });
  }

  return anomalies;
}

export function hasAnomalies(metrics, periodMonths = 3) {
  return detectAnomalies(metrics, periodMonths).some(a => a.severity === 'anomaly');
}

export function getAnomalySummary(metrics, periodMonths = 3) {
  const anomalies = detectAnomalies(metrics, periodMonths);
  const red = anomalies.filter(a => a.severity === 'anomaly');
  const yellow = anomalies.filter(a => a.severity === 'watch');
  return { red, yellow, all: anomalies };
}
