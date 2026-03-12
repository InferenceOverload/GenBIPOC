import { createContext, useContext, useState, useEffect } from 'react';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWing, setSelectedWing] = useState(null);
  const [selectedTeamLead, setSelectedTeamLead] = useState(null);
  const [selectedHandler, setSelectedHandler] = useState(null);
  const [periodMonths, setPeriodMonths] = useState(3);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load data:', err);
        setLoading(false);
      });
  }, []);

  const selectWing = (wingId) => {
    setSelectedWing(wingId);
    setSelectedTeamLead(null);
    setSelectedHandler(null);
  };

  const selectTeamLead = (wingId, tlId) => {
    setSelectedWing(wingId);
    setSelectedTeamLead(tlId);
    setSelectedHandler(null);
  };

  const selectHandler = (wingId, tlId, handlerId) => {
    setSelectedWing(wingId);
    setSelectedTeamLead(tlId);
    setSelectedHandler(handlerId);
  };

  const getSelectedHandlerData = () => {
    if (!data || !selectedWing || !selectedTeamLead || !selectedHandler) return null;
    const wing = data.wings[selectedWing];
    if (!wing) return null;
    const tl = wing.team_leads[selectedTeamLead];
    if (!tl) return null;
    return tl.handlers.find(h => h.handler_id === selectedHandler) || null;
  };

  const getSelectedTeamData = () => {
    if (!data || !selectedWing || !selectedTeamLead) return null;
    return data.wings[selectedWing]?.team_leads[selectedTeamLead] || null;
  };

  return (
    <DashboardContext.Provider value={{
      data, loading, periodMonths, setPeriodMonths,
      selectedWing, selectedTeamLead, selectedHandler,
      selectWing, selectTeamLead, selectHandler,
      getSelectedHandlerData, getSelectedTeamData,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => useContext(DashboardContext);
