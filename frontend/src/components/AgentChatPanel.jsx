import { CopilotChat } from '@copilotkit/react-ui';
import { useCopilotReadable, useCopilotAction } from '@copilotkit/react-core';
import { useDashboard } from '../context/DashboardContext';
import { buildAgentContext } from '../utils/contextBuilder';
import ToolCallCard from './ToolCallCard';

const TOOL_NAMES = [
  'get_handler_metrics', 'get_handler_profile', 'get_team_metrics',
  'get_team_average', 'get_wing_summary', 'compare_to_org_benchmark',
  'compare_periods', 'get_correlated_metrics',
];

const STARTER_PROMPTS = [
  { title: "Why did performance change?", message: "Why did this handler's performance change recently?" },
  { title: "Is this systemic?", message: "Is this an individual issue or a team/wing-wide pattern?" },
  { title: "What should we do?", message: "What action should the team lead take based on the data?" },
  { title: "Hidden risks?", message: "Are there any hidden risks in the metrics that look normal on the surface?" },
];

function ToolRenderers() {
  for (const toolName of TOOL_NAMES) {
    useCopilotAction({
      name: toolName,
      available: "disabled",
      parameters: [],
      render: ({ args, result, status }) => (
        <ToolCallCard name={toolName} args={args} result={result} status={status} />
      ),
    });
  }
  return null;
}

export default function AgentChatPanel() {
  const { data, selectedWing, selectedTeamLead, selectedHandler,
          getSelectedHandlerData, periodMonths } = useDashboard();

  const handlerData = getSelectedHandlerData();
  const wing = data?.wings?.[selectedWing];

  useCopilotReadable({
    description: "Current dashboard context showing which handler/team/wing the user is viewing",
    value: handlerData
      ? buildAgentContext({ data, selectedWing, selectedTeamLead, selectedHandler, periodMonths, handlerData })
      : "No handler selected. User is viewing the overview.",
  });

  return (
    <div className="w-96 border-l border-gray-200 flex flex-col h-full bg-white shrink-0">
      <ToolRenderers />

      {/* Context Badge */}
      <div className="px-4 py-3 border-b bg-gray-50 text-xs text-gray-600 shrink-0">
        {handlerData ? (
          <span>
            📍 {handlerData.name} | {wing?.name} | {handlerData.lob} | Last {periodMonths}M
          </span>
        ) : (
          <span>📍 Select a handler to start investigating</span>
        )}
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <CopilotChat
          className="h-full"
          instructions="You are investigating claims handler performance. Use the dashboard context to know who the user is asking about."
          labels={{
            title: "Claims Intelligence Agent",
            initial: handlerData
              ? `I'm ready to investigate ${handlerData.name}'s performance. What would you like to know?`
              : "Select a handler from the navigation to start.",
          }}
          suggestions={handlerData ? STARTER_PROMPTS : []}
        />
      </div>
    </div>
  );
}
