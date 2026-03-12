import { useState, useRef, useEffect, useCallback } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { buildAgentContext } from '../utils/contextBuilder';
import ToolCallCard from './ToolCallCard';

const ADK_BASE = '/api/adk';
const APP_NAME = 'agent';

const HANDLER_PROMPTS = [
  { title: "Why did performance change?", message: "Why did this handler's performance change recently?" },
  { title: "Is this systemic?", message: "Is this an individual issue or a team/wing-wide pattern?" },
  { title: "What should we do?", message: "What action should the team lead take based on the data?" },
  { title: "Hidden risks?", message: "Are there any hidden risks in the metrics that look normal on the surface?" },
];

const TEAM_PROMPTS = [
  { title: "Why is the team trending down?", message: "What's driving the declining metrics on this team? Find the root cause across handlers." },
  { title: "Who needs attention?", message: "Which handlers on this team need the most attention right now and why?" },
  { title: "Correlation check", message: "Are there any correlated patterns across this team's handlers — like training dips coinciding with error spikes?" },
];

const WING_PROMPTS = [
  { title: "Wing performance drivers", message: "What's driving the performance trends in this wing? Which teams or handlers are the biggest contributors?" },
  { title: "Cross-team patterns", message: "Are there patterns that cut across teams in this wing — like an LOB-wide issue?" },
  { title: "Biggest risks", message: "What are the biggest risks in this wing that need executive attention?" },
];

const ORG_PROMPTS = [
  { title: "Why is efficiency down?", message: "Handler efficiency is flagged — what's driving the decline across the organization?" },
  { title: "Which wing needs help?", message: "Which wing has the most concerning trends and why?" },
  { title: "Hidden correlations", message: "Are there any cross-wing patterns or correlations that aren't obvious from the high-level numbers?" },
  { title: "Top risks", message: "What are the top 3 risks across the organization that need executive action?" },
];

function parseSSEEvent(line) {
  if (!line.startsWith('data: ')) return null;
  try {
    return JSON.parse(line.slice(6));
  } catch {
    return null;
  }
}

function getLevel(selectedWing, selectedTeamLead, selectedHandler) {
  if (selectedHandler) return 'handler';
  if (selectedTeamLead) return 'team';
  if (selectedWing) return 'wing';
  return 'org';
}

function getPrompts(level) {
  switch (level) {
    case 'handler': return HANDLER_PROMPTS;
    case 'team': return TEAM_PROMPTS;
    case 'wing': return WING_PROMPTS;
    default: return ORG_PROMPTS;
  }
}

function ThinkingSteps({ steps }) {
  const [expanded, setExpanded] = useState(false);
  if (!steps || steps.length === 0) return null;

  return (
    <div className="border border-blue-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
      >
        <span className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
        <span className="font-medium">Agent Reasoning</span>
        <span className="text-blue-500">({steps.length} step{steps.length !== 1 ? 's' : ''})</span>
      </button>
      {expanded && (
        <div className="px-3 py-2 space-y-2 bg-white border-t border-blue-100">
          {steps.map((step, i) => (
            <div key={i} className="text-xs text-gray-700 border-l-2 border-blue-200 pl-2 whitespace-pre-wrap">
              {step}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AgentChatPanel() {
  const { data, selectedWing, selectedTeamLead, selectedHandler,
          getSelectedHandlerData, getSelectedTeamData, periodMonths } = useDashboard();

  const handlerData = getSelectedHandlerData();
  const teamData = getSelectedTeamData();
  const wing = data?.wings?.[selectedWing];
  const level = getLevel(selectedWing, selectedTeamLead, selectedHandler);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [activeToolCalls, setActiveToolCalls] = useState([]);
  const [activeThinking, setActiveThinking] = useState(null);
  const messagesEndRef = useRef(null);
  const userId = useRef(`ui-${Date.now()}`);

  // Reset session when scope changes
  useEffect(() => {
    setSessionId(null);
    setMessages([]);
    setActiveToolCalls([]);
  }, [selectedWing, selectedTeamLead, selectedHandler]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeToolCalls]);

  const ensureSession = useCallback(async () => {
    if (sessionId) return sessionId;
    const res = await fetch(`${ADK_BASE}/apps/${APP_NAME}/users/${userId.current}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const session = await res.json();
    setSessionId(session.id);
    return session.id;
  }, [sessionId]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    // Build context for whatever level we're at
    const context = buildAgentContext({ data, selectedWing, selectedTeamLead, selectedHandler, periodMonths, handlerData });
    const enrichedText = context
      ? `${context}\n\nUser question: ${text}`
      : text;

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setIsLoading(true);
    setActiveToolCalls([]);

    try {
      const sid = await ensureSession();

      const response = await fetch(`${ADK_BASE}/run_sse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_name: APP_NAME,
          user_id: userId.current,
          session_id: sid,
          new_message: {
            role: 'user',
            parts: [{ text: enrichedText }],
          },
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const textParts = []; // Accumulate all text parts in order
      let hasSeenToolCall = false;
      const toolCallMap = new Map();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const event = parseSSEEvent(line.trim());
          if (!event?.content?.parts) continue;

          for (const part of event.content.parts) {
            if (part.functionCall) {
              hasSeenToolCall = true;
              const { id, name, args } = part.functionCall;
              toolCallMap.set(id, { id, name, args, status: 'calling' });
              setActiveToolCalls(Array.from(toolCallMap.values()));
            }

            if (part.functionResponse) {
              const { id, name, response: result } = part.functionResponse;
              if (toolCallMap.has(id)) {
                toolCallMap.set(id, { ...toolCallMap.get(id), result, status: 'complete' });
              } else {
                toolCallMap.set(id, { id, name, result, status: 'complete' });
              }
              setActiveToolCalls(Array.from(toolCallMap.values()));
            }

            if (part.text) {
              // Classify: text before/between tool calls = thinking, text after last tool call = narrative
              textParts.push({ text: part.text, isThinking: !hasSeenToolCall || toolCallMap.size > 0 });
              // Show live thinking updates
              setActiveThinking(part.text);
            }
          }
        }
      }

      // The last text part is the final narrative; everything else is thinking
      const thinkingSteps = textParts.slice(0, -1).map(p => p.text);
      const finalText = textParts.length > 0 ? textParts[textParts.length - 1].text : '';
      const finalToolCalls = Array.from(toolCallMap.values());
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: finalText, toolCalls: finalToolCalls, thinkingSteps },
      ]);
      setActiveToolCalls([]);
      setActiveThinking(null);

    } catch (err) {
      console.error('Agent SSE error:', err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: `Error: ${err.message}. Please try again.`, toolCalls: [] },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, handlerData, data, selectedWing, selectedTeamLead, selectedHandler, periodMonths, ensureSession]);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Context badge label
  let contextLabel;
  if (handlerData) {
    contextLabel = `${handlerData.name} | ${wing?.name} | ${handlerData.lob} | Last ${periodMonths}M`;
  } else if (teamData && wing) {
    contextLabel = `${teamData.name}'s Team | ${wing.name} | Last ${periodMonths}M`;
  } else if (wing) {
    contextLabel = `${wing.name} | Last ${periodMonths}M`;
  } else {
    contextLabel = `Organization-Wide | Last ${periodMonths}M`;
  }

  // Greeting message
  let greeting;
  if (handlerData) {
    greeting = `I'm ready to investigate ${handlerData.name}'s performance. What would you like to know?`;
  } else if (teamData) {
    greeting = `I can investigate ${teamData.name}'s team performance — ask me about trends, risks, or what's driving the numbers.`;
  } else if (wing) {
    greeting = `I can analyze ${wing.name} performance — ask me why metrics are moving, who needs attention, or where the risks are.`;
  } else {
    greeting = `I'm ready to investigate organization-wide performance. Ask me about any metric, wing, or pattern you see on the scorecard.`;
  }

  const prompts = getPrompts(level);

  return (
    <div className="w-96 border-l border-gray-200 flex flex-col h-full bg-white shrink-0">
      {/* Context Badge */}
      <div className="px-4 py-3 border-b bg-gray-50 text-xs text-gray-600 shrink-0">
        <span>📍 {contextLabel}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
            {greeting}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === 'user' ? (
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-[80%] text-sm">
                  {msg.text}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Thinking steps — investigation plan & reasoning breadcrumbs */}
                {msg.thinkingSteps?.length > 0 && (
                  <ThinkingSteps steps={msg.thinkingSteps} />
                )}
                {msg.toolCalls?.length > 0 && (
                  <div className="space-y-1">
                    {msg.toolCalls.map((tc) => (
                      <ToolCallCard
                        key={tc.id}
                        name={tc.name}
                        args={tc.args}
                        result={tc.result}
                        status={tc.status}
                      />
                    ))}
                  </div>
                )}
                {msg.text && (
                  <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Live thinking text while streaming */}
        {isLoading && activeThinking && (
          <div className="border-l-2 border-blue-300 bg-blue-50/50 rounded-r-lg px-3 py-2 text-xs text-blue-800 whitespace-pre-wrap">
            {activeThinking}
          </div>
        )}

        {isLoading && activeToolCalls.length > 0 && (
          <div className="space-y-1">
            {activeToolCalls.map((tc) => (
              <ToolCallCard
                key={tc.id}
                name={tc.name}
                args={tc.args}
                result={tc.result}
                status={tc.status}
              />
            ))}
          </div>
        )}

        {isLoading && activeToolCalls.length === 0 && !activeThinking && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="animate-spin inline-block">&#8635;</span>
            Thinking...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompts */}
      {messages.length === 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {prompts.map((sp) => (
            <button
              key={sp.title}
              onClick={() => sendMessage(sp.message)}
              className="text-xs border border-gray-300 rounded-full px-3 py-1.5 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              {sp.title}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t px-4 py-3 flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the metrics..."
          disabled={isLoading}
          className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
