import { CopilotKit } from '@copilotkit/react-core';
import '@copilotkit/react-ui/styles.css';
import { DashboardProvider } from './context/DashboardContext';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import AgentChatPanel from './components/AgentChatPanel';

export default function App() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="claims_performance_agent">
      <DashboardProvider>
        <div className="h-screen flex flex-col">
          {/* Top Bar */}
          <header className="bg-[var(--hartford-primary)] text-white px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center text-sm font-bold">H</div>
              <span className="text-lg font-semibold">Claims Performance Intelligence</span>
            </div>
            <span className="text-sm text-white/60">The Hartford — EDS Claims / DAIO</span>
          </header>

          {/* Main Content */}
          <div className="flex flex-1 overflow-hidden">
            <Navigation />
            <Dashboard />
            <AgentChatPanel />
          </div>
        </div>
      </DashboardProvider>
    </CopilotKit>
  );
}
