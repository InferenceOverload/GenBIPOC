import { useDashboard } from '../context/DashboardContext';
import { hasAnomalies } from '../utils/anomalyDetector';
import { useState } from 'react';

export default function Navigation() {
  const { data, selectedWing, selectedTeamLead, selectedHandler,
          selectWing, selectTeamLead, selectHandler, periodMonths } = useDashboard();
  const [expandedWings, setExpandedWings] = useState({});
  const [expandedTeams, setExpandedTeams] = useState({});

  if (!data) return null;

  const toggleWing = (wingId) => {
    setExpandedWings(prev => ({ ...prev, [wingId]: !prev[wingId] }));
  };

  const toggleTeam = (tlId) => {
    setExpandedTeams(prev => ({ ...prev, [tlId]: !prev[tlId] }));
  };

  return (
    <nav className="w-64 bg-[var(--hartford-dark)] text-white overflow-y-auto h-full shrink-0">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/60">Organization</h2>
      </div>
      {Object.entries(data.wings).map(([wingId, wing]) => (
        <div key={wingId}>
          <button
            onClick={() => { toggleWing(wingId); selectWing(wingId); }}
            className={`w-full text-left px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-white/10 transition-colors ${
              selectedWing === wingId ? 'bg-white/15 text-white' : 'text-white/80'
            }`}
          >
            <span className="text-xs">{expandedWings[wingId] ? '▼' : '▶'}</span>
            {wing.name}
          </button>

          {expandedWings[wingId] && Object.entries(wing.team_leads).map(([tlId, tl]) => (
            <div key={tlId}>
              <button
                onClick={() => { toggleTeam(tlId); selectTeamLead(wingId, tlId); }}
                className={`w-full text-left pl-8 pr-4 py-1.5 text-sm flex items-center gap-2 hover:bg-white/10 transition-colors ${
                  selectedTeamLead === tlId ? 'text-[var(--hartford-accent)] font-medium' : 'text-white/70'
                }`}
              >
                <span className="text-xs">{expandedTeams[tlId] ? '▼' : '▶'}</span>
                {tl.name}
              </button>

              {expandedTeams[tlId] && tl.handlers.map(handler => {
                const flagged = hasAnomalies(handler.monthly_metrics, periodMonths);
                return (
                  <button
                    key={handler.handler_id}
                    onClick={() => selectHandler(wingId, tlId, handler.handler_id)}
                    className={`w-full text-left pl-14 pr-4 py-1 text-sm hover:bg-white/10 transition-colors flex items-center gap-2 ${
                      selectedHandler === handler.handler_id
                        ? 'text-white font-medium bg-white/10'
                        : 'text-white/60'
                    }`}
                  >
                    {flagged && <span className="text-red-400 text-xs">●</span>}
                    {handler.name}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </nav>
  );
}
