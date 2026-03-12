import { useState } from 'react';

const TOOL_LABELS = {
  get_handler_metrics: 'Querying handler metrics',
  get_handler_profile: 'Looking up handler profile',
  get_team_metrics: 'Fetching team metrics',
  get_team_average: 'Computing team benchmark',
  get_wing_summary: 'Analyzing wing performance',
  compare_to_org_benchmark: 'Comparing to org benchmark',
  compare_periods: 'Comparing time periods',
  get_correlated_metrics: 'Finding correlated signals',
};

export default function ToolCallCard({ name, args, result, status }) {
  const [expanded, setExpanded] = useState(false);
  const label = TOOL_LABELS[name] || name;

  const argsPreview = args
    ? Object.entries(args).map(([k, v]) => `${k}="${v}"`).join(', ')
    : '';

  return (
    <div className={`rounded-lg border p-3 my-2 text-sm transition-all ${
      status === 'complete' ? 'border-green-200 bg-green-50'
        : status === 'error' ? 'border-red-200 bg-red-50'
        : 'border-blue-200 bg-blue-50 animate-pulse'
    }`}>
      <div className="flex items-center gap-2">
        {status === 'complete' ? (
          <span className="text-green-600">✓</span>
        ) : status === 'error' ? (
          <span className="text-red-600">⚠</span>
        ) : (
          <span className="text-blue-600 animate-spin inline-block">⟳</span>
        )}
        <span className="font-medium text-gray-800">{label}</span>
      </div>
      {argsPreview && (
        <p className="text-xs text-gray-500 mt-1 font-mono">{name}({argsPreview})</p>
      )}
      {result && status === 'complete' && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-600 mt-1 hover:underline"
        >
          {expanded ? 'Hide result' : 'Show result'}
        </button>
      )}
      {expanded && result && (
        <pre className="text-xs bg-white rounded p-2 mt-2 overflow-x-auto max-h-40 text-gray-700">
          {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
