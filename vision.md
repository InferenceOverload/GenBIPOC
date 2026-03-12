# Claims Performance Narrative Engine — Prototype Spec v2.0
**Version:** 2.0 (Agentic Architecture)
**Author:** Leeladhar Gudala
**Organization:** The Hartford Insurance — EDS Claims / DAIO
**Purpose:** Demo prototype for leadership — AI agent that investigates KPI anomalies and surfaces narratives

---

## 1. Executive Summary

The **Claims Performance Narrative Engine** is an agentic prototype that demonstrates how an AI agent can autonomously investigate *why* claim handler performance metrics change — without requiring business leaders to manually cross-reference reports.

**Core differentiator from Snowflake Cortex Analyst:**
- Cortex answers "what" — it returns data for a query
- This answers "why" — the agent calls multiple tools, correlates signals, and reasons across dimensions to construct a narrative

**The agent is not fed pre-cooked answers.** It is given tools and data, and it discovers correlations at runtime through multi-step reasoning.

**Architecture positioning:** This is the intelligence layer *above* Cortex Analyst. In production, the tools can call Cortex/Snowflake directly. For this prototype, they query synthetic JSON files.

---

## 2. Demo Experience Goals

| Moment | What the user sees |
|--------|--------------------|
| Dashboard load | KPI cards with anomaly flags already surfaced across Wings/Teams/Handlers |
| Navigate to flagged handler | AI anomaly banner with 1-line proactive summary |
| Ask a question in chat | Agent visibly calls tools one by one — user watches the investigation unfold |
| Tool call cards | Each tool call renders as a live card: "🔍 Querying training data for Marcus Webb..." → result appears |
| Final narrative | Agent synthesizes all tool results into a clear business narrative |
| Follow-up question | Agent uses session memory — no need to re-explain context |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────┐
│              React Frontend                          │
│   Vite + Tailwind + Recharts + CopilotKit (AG-UI)   │
│   Port 3000                                          │
│                                                      │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │  KPI Dashboard  │  │  Agent Chat Panel        │  │
│  │  - Navigation   │  │  - Tool call cards       │  │
│  │  - KPI Cards    │  │  - Streaming response    │  │
│  │  - Anomaly flag │  │  - Context badge         │  │
│  └─────────────────┘  └──────────────────────────┘  │
└────────────────────────┬────────────────────────────┘
                         │ AG-UI / SSE
┌────────────────────────▼────────────────────────────┐
│              FastAPI Server (Python)                 │
│   google.adk.cli.fast_api.get_fast_api_app()        │
│   Port 8000                                          │
└────────────────────────┬────────────────────────────┘
                         │ ADK Runner (event stream)
┌────────────────────────▼────────────────────────────┐
│              ADK LlmAgent                            │
│   Model: gemini-2.5-flash (Vertex AI)               │
│   Tools: 8 Python functions                         │
│   Session: InMemorySessionService                   │
└────────────────────────┬────────────────────────────┘
                         │ function calls
┌────────────────────────▼────────────────────────────┐
│              Tool Layer (Python)                     │
│   8 functions querying synthetic JSON data          │
└────────────────────────┬────────────────────────────┘
                         │ reads
┌────────────────────────▼────────────────────────────┐
│              Synthetic Data (JSON files)             │
│   3 Wings / 6 Team Leads / 32 Handlers              │
│   12 months × 16 KPI metrics                        │
│   6 correlated narrative stories baked in           │
└─────────────────────────────────────────────────────┘
```

---

## 4. Tech Stack

| Component | Technology | Version / Notes |
|-----------|-----------|-----------------|
| Agent Framework | Google ADK (Python) | `google-adk` latest |
| LLM | Gemini 2.5 Flash | `gemini-2.5-flash` via Vertex AI |
| GCP Auth | Application Default Credentials | `gcloud auth application-default login` |
| Backend server | FastAPI + Uvicorn | ADK helper: `get_fast_api_app()` |
| Frontend framework | React + Vite | v18+ |
| Styling | Tailwind CSS | Core utility classes |
| Charts | Recharts | Sparklines + trend charts |
| Agent ↔ UI bridge | AG-UI protocol + CopilotKit | `ag-ui-adk`, `@copilotkit/react-core` |
| Data | Static JSON files | No database for prototype |
| Local runtime | Laptop only | No cloud deployment needed |

---

## 5. Project File Structure

```
claims-narrative-engine/
│
├── backend/
│   ├── main.py                        # FastAPI entrypoint using get_fast_api_app()
│   ├── agent/
│   │   ├── __init__.py                # Exports root_agent
│   │   └── agent.py                   # ADK LlmAgent definition with tools
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── handler_tools.py           # get_handler_metrics, get_handler_profile
│   │   ├── team_tools.py              # get_team_metrics, get_team_average
│   │   ├── wing_tools.py              # get_wing_summary
│   │   ├── comparison_tools.py        # compare_to_org_benchmark, compare_periods
│   │   └── investigation_tools.py    # get_correlated_metrics, get_anomaly_factors
│   ├── data/
│   │   ├── synthetic_data.json        # All handler data (generated)
│   │   └── data_loader.py             # Utility to load + aggregate data
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                    # Root layout
│   │   ├── components/
│   │   │   ├── Navigation.jsx         # Wing → Team → Handler tree
│   │   │   ├── Dashboard.jsx          # KPI cards + charts
│   │   │   ├── KPICard.jsx            # Metric card with sparkline + anomaly flag
│   │   │   ├── AnomalyBanner.jsx      # Proactive AI insight banner
│   │   │   ├── AgentChatPanel.jsx     # CopilotKit chat with tool card rendering
│   │   │   └── ToolCallCard.jsx       # Animated tool call visualization
│   │   ├── context/
│   │   │   └── DashboardContext.jsx   # Global state: current wing/team/handler
│   │   └── utils/
│   │       ├── anomalyDetector.js     # Client-side threshold logic
│   │       └── contextBuilder.js      # Formats current view for agent system prompt
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── data_generator/
    └── generate_synthetic_data.py     # Script to produce synthetic_data.json
```

---

## 6. ADK Agent Definition

### 6.1 Agent Setup

```python
# backend/agent/agent.py
from google.adk.agents import Agent
from backend.tools.handler_tools import get_handler_metrics, get_handler_profile
from backend.tools.team_tools import get_team_metrics, get_team_average
from backend.tools.wing_tools import get_wing_summary
from backend.tools.comparison_tools import compare_to_org_benchmark, compare_periods
from backend.tools.investigation_tools import get_correlated_metrics, get_anomaly_factors

root_agent = Agent(
    name="claims_performance_agent",
    model="gemini-2.5-flash",
    description="Investigates why claim handler KPI metrics change and surfaces narrative explanations.",
    instruction="""
    You are a Claims Performance Intelligence Agent for The Hartford Insurance Company.

    Your job is to investigate WHY claim handler performance metrics change — not just
    report what the numbers are. You do this by calling tools to gather data across
    multiple dimensions and then reasoning across the results to find correlations.

    INVESTIGATION APPROACH:
    1. Always start by fetching the specific handler/team/wing metrics being asked about
    2. Compare to team average and org benchmark to determine if the issue is individual or systemic
    3. Look for correlated signals — if volume drops, check training hours, absences, LOB complexity
    4. Compare current period to prior period to establish the direction and magnitude of change
    5. Get correlated metrics to find what else moved at the same time
    6. Synthesize your findings into a clear business narrative

    RESPONSE FORMAT:
    - Lead with the key finding in 1 sentence
    - Explain the correlated signals that support it
    - Distinguish between individual vs. systemic factors
    - End with a recommended action for the team lead
    - Keep total response to 4-6 sentences — business leaders want clarity, not essays

    TONE: Factual, constructive, data-grounded. Frame concerns as insights, not accusations.
    You are helping leaders coach and support their teams, not assign blame.

    Always use the current dashboard context provided at the start of each message to
    know which handler/team/wing the user is asking about.
    """,
    tools=[
        get_handler_metrics,
        get_handler_profile,
        get_team_metrics,
        get_team_average,
        get_wing_summary,
        compare_to_org_benchmark,
        compare_periods,
        get_correlated_metrics,
    ]
)
```

### 6.2 FastAPI Server

```python
# backend/main.py
import uvicorn
from google.adk.cli.fast_api import get_fast_api_app

AGENT_DIR = "backend"
SESSION_DB_URL = "sqlite:///sessions.db"

app = get_fast_api_app(
    agent_dir=AGENT_DIR,
    session_db_url=SESSION_DB_URL,
    allow_origins=["http://localhost:3000"],
    web=False,  # Disable ADK dev UI — we have our own React frontend
)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## 7. Tool Definitions

### 7.1 Tool Catalog

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_handler_metrics` | Returns all KPI metrics for a handler for a given period | `handler_id`, `months` (1–12) |
| `get_handler_profile` | Returns handler metadata: LOB, tenure, team, wing | `handler_id` |
| `get_team_metrics` | Returns aggregated metrics for a team lead's team | `team_lead_id`, `months` |
| `get_team_average` | Returns average KPIs for handlers on a team (for benchmarking) | `team_lead_id`, `metric`, `months` |
| `get_wing_summary` | Returns rolled-up metrics across a whole wing | `wing_id`, `months` |
| `compare_to_org_benchmark` | Compares a specific metric for a handler against org-wide average | `handler_id`, `metric`, `months` |
| `compare_periods` | Compares metrics for two time periods (MoM, QoQ) | `handler_id`, `metric`, `period_a`, `period_b` |
| `get_correlated_metrics` | Returns all metrics that moved significantly in the same period | `handler_id`, `anchor_month`, `threshold_pct` |

### 7.2 Example Tool Implementation

```python
# backend/tools/handler_tools.py
from backend.data.data_loader import load_data

def get_handler_metrics(handler_id: str, months: int = 3) -> dict:
    """
    Returns KPI metrics for a specific claim handler for the last N months.
    Use this to understand a handler's recent performance across all dimensions.

    Args:
        handler_id: The unique handler identifier (e.g. 'h_marcus_webb')
        months: Number of recent months to return (default 3, max 12)

    Returns:
        dict with handler name, LOB, and monthly metrics array
    """
    data = load_data()
    handler = find_handler(data, handler_id)
    if not handler:
        return {"error": f"Handler {handler_id} not found"}

    recent = handler["monthly_metrics"][-months:]
    return {
        "handler_id": handler_id,
        "handler_name": handler["name"],
        "lob": handler["lob"],
        "metrics": recent
    }


def get_correlated_metrics(handler_id: str, anchor_month: str, threshold_pct: float = 15.0) -> dict:
    """
    Finds all KPI metrics for a handler that changed by more than threshold_pct
    in the given month compared to the prior month. Used to discover correlated signals.

    Args:
        handler_id: The unique handler identifier
        anchor_month: Month to analyze in YYYY-MM format (e.g. '2024-09')
        threshold_pct: Minimum % change to flag as significant (default 15%)

    Returns:
        dict with list of metrics that moved significantly and their direction/magnitude
    """
    # Implementation reads synthetic data and computes MoM delta per metric
    ...
```

---

## 8. Data Model

### 8.1 Organizational Structure

```
The Hartford Claims (Prototype)
├── Wing 1: Auto & Workers Comp East
│   ├── Team Lead: Sarah Mitchell → 5 handlers
│   └── Team Lead: David Park    → 6 handlers
├── Wing 2: Property & GL Central
│   ├── Team Lead: Karen Torres  → 5 handlers
│   └── Team Lead: James Liu     → 5 handlers
└── Wing 3: Workers Comp West
    ├── Team Lead: Monica Reed   → 6 handlers
    └── Team Lead: Brian Scott   → 5 handlers

Total: 3 Wings | 6 Team Leads | 32 Handlers | 12 months | 16 KPIs
```

### 8.2 KPI Metrics (16 total)

**Volume:** `claims_assigned`, `claims_closed`, `calls_handled`, `avg_handle_time_min`, `closure_rate_pct`

**Quality:** `reopen_rate_pct`, `csat_score`, `error_rate_pct`, `supervisor_override_pct`

**Financial:** `avg_settlement_amt`, `reserve_accuracy_pct`, `litigation_rate_pct`

**Development:** `training_hours`, `certifications_completed`, `compliance_violations`, `days_absent`

### 8.3 Synthetic Data Stories (Agent Must Discover These)

The data generator embeds these correlated patterns. The agent is **not told about them** — it must find them through tool calls and reasoning.

| Story | Handler | Wing/Team | Months | Correlated Signals |
|-------|---------|-----------|--------|--------------------|
| Training Dip | Marcus Webb | Wing 1 / Sarah Mitchell | Sep–Oct 2024 | training_hours ↑5x, calls_handled ↓28%, full recovery Nov |
| Burnout Signal | Lisa Crane | Wing 2 / Karen Torres | Jul–Sep 2024 | csat ↓21%, error_rate ↑3x, handle_time ↓, absences ↑ |
| Star Performer | Andre Johnson | Wing 3 / Monica Reed | All year | litigation_rate 3x below avg, csat 4.7, consistent high reserve accuracy |
| LOB Complexity Spike | All Wing 2 PROP handlers | Wing 2 | Oct–Nov 2024 | claims_assigned ↑48%, settlement ↑2x, systemic not individual |
| New Hire Ramp | Priya Nair | Wing 1 / David Park | Jan–Apr 2024 | error_rate ↓ each month, override_rate ↓, training_hours ↑3x onboarding |
| Quiet Risk | Tom Beckett | Wing 3 / Brian Scott | Aug–Dec 2024 | litigation_rate 8%→22% silent climb, surface metrics look fine |

---

## 9. Frontend Components

### 9.1 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Hartford Logo]  Claims Performance Intelligence        [Month ▼]  │
│  Wing 2 > Karen Torres > Lisa Crane                                 │
├─────────────────────┬───────────────────────────────────────────────┤
│  NAVIGATION (left)  │  KPI DASHBOARD (center)                       │
│                     │                                               │
│  ▼ Wing 1           │  ⚠️ AI Insight ─────────────────────────────  │
│    Sarah Mitchell   │  "3-month declining quality trend detected.   │
│      Marcus Webb    │   Ask the agent for full investigation →"     │
│      Priya Nair     │  ─────────────────────────────────────────── │
│      ...            │                                               │
│  ▼ Wing 2  ← active │  [CSAT 3.3 ↓21%🔴] [Error Rate 9% ↑🔴]      │
│    Karen Torres ←   │  [Handle Time 14m ↓🟡] [Reopen 11% ↑🔴]      │
│      Lisa Crane ←   │  [Calls 242 ↓18%🟡] [Compliance Flags 2 🔴]  │
│      ...            │                                               │
│  ▼ Wing 3           │  [Trend chart: 6-month sparklines]           │
│    Monica Reed      │                                               │
│    Brian Scott      │                                               │
├─────────────────────┴───────────────────────────────────────────────┤
│  AGENT CHAT (right panel — collapsible)                             │
│                                                                     │
│  Context: Lisa Crane | Wing 2 | Last 3 months                      │
│  ─────────────────────────────────────────────────────────────────  │
│  [Why did performance change?] [Is this systemic?] [What to do?]   │
│                                                                     │
│  > Why is her performance declining?                               │
│                                                                     │
│  ┌─ 🔍 get_handler_metrics(handler_id="h_lisa_crane", months=3) ─┐ │
│  │  ✓ Retrieved 3 months of KPI data                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌─ 🔍 get_team_average(team_lead_id="tl_karen_torres") ──────────┐ │
│  │  ✓ Team benchmark retrieved                                    │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌─ 🔍 get_correlated_metrics(handler_id="h_lisa_crane") ─────────┐ │
│  │  ✓ Found 5 correlated metric shifts                            │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Lisa Crane shows a consistent 3-month declining pattern...        │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.2 Tool Call Card Component

Each tool call renders as an animated card in the chat panel:

**States:**
- `calling` → Pulsing spinner: "🔍 Querying handler metrics..."
- `done` → Green checkmark: "✓ Retrieved 3 months of KPI data" + collapsible result preview
- `error` → Red: "⚠ Tool failed — retrying"

This is implemented via CopilotKit's `useRenderToolCall` hook.

### 9.3 Context Badge

A persistent badge at the top of the chat panel always shows what the agent knows:

```
📍 Lisa Crane  |  Wing 2  |  AUTO  |  Jul–Sep 2024
```

This context is injected into every message automatically via a system prompt prefix. The user never has to say "I'm looking at Lisa Crane."

### 9.4 Anomaly Detection (Client-Side)

Runs on dashboard load and navigation change. Flags KPI cards and triggers the proactive banner.

| Metric | 🟡 Watch | 🔴 Anomaly |
|--------|---------|----------|
| closure_rate_pct | < 80% | < 70% |
| csat_score | < 3.8 | < 3.4 |
| error_rate_pct | > 6% | > 9% |
| litigation_rate_pct | > 14% | > 18% |
| reopen_rate_pct | > 7% | > 10% |
| training_hours | > 12 (spike) | — |
| days_absent | > 2 | > 4 |

---

## 10. Context Injection Pattern

Every chat message sent to the agent includes a system prompt prefix built from the current dashboard state:

```
=== CURRENT DASHBOARD CONTEXT ===
Level: Handler
Wing: Wing 2 — Property & GL Central
Team Lead: Karen Torres
Handler: Lisa Crane (ID: h_lisa_crane)
LOB: AUTO
Tenure: 3.2 years
Selected Period: Last 3 Months (Jul–Sep 2024)

Latest KPI Snapshot (vs prior 3 months):
- calls_handled: 242 (↓18%)
- csat_score: 3.3 (↓21%)
- error_rate_pct: 9.1% (↑125%)
- reopen_rate_pct: 11.2% (↑175%)
- avg_handle_time_min: 14 (↓36%)
- days_absent: 3 (was 0)
- compliance_violations: 2 (was 0)
- training_hours: 3 (team avg: 6)
=================================

User question:
```

The agent uses this to know *who* the user is asking about without being told explicitly.

---

## 11. Development Phases (for Claude Code)

### Phase 1 — Synthetic Data Generator
- Python script: `data_generator/generate_synthetic_data.py`
- Output: `backend/data/synthetic_data.json`
- Must embed all 6 correlated stories faithfully
- Non-story handlers: realistic random variation ±15% monthly drift
- Include `data_loader.py` with aggregation utilities

### Phase 2 — Tool Layer
- Implement all 8 tools in `backend/tools/`
- Each tool must have complete docstrings (ADK uses these as tool descriptions to the model)
- Include unit tests for each tool against the synthetic data
- Verify the 6 stories are discoverable through tool calls

### Phase 3 — ADK Agent + FastAPI Backend
- Define `root_agent` in `backend/agent/agent.py`
- Wire up FastAPI server in `backend/main.py` using `get_fast_api_app()`
- Test agent locally using ADK dev UI first (`adk web`)
- Verify agent discovers each story through multi-step tool calling

### Phase 4 — React Frontend (Dashboard)
- Navigation tree with Wing/Team/Handler drill-down
- KPI cards with MoM variance + anomaly color coding
- 6-month sparklines per metric using Recharts
- Period selector (1M / 3M / 6M / 12M)
- Anomaly banner with proactive 1-line summary

### Phase 5 — Agent Chat Integration (AG-UI)
- Install CopilotKit + ag-ui-adk
- Wire `AgentChatPanel` to backend via AG-UI protocol
- Implement `ToolCallCard` with `useRenderToolCall` hook
- Context badge showing current navigation state
- Starter prompt chips
- Inject dashboard context into every message via `useCopilotReadable`

### Phase 6 — Polish + Demo Mode
- Hartford color scheme: primary `#1F4E79`, accent `#2E75B6`
- Smooth transitions on drill-down navigation
- Demo tour: pre-scripted walk through all 6 stories
- README with local setup instructions

---

## 12. Local Setup & Run Instructions

```bash
# Prerequisites
# - Python 3.11+
# - Node 18+
# - GCP project with Vertex AI API enabled
# - gcloud CLI authenticated

# 1. GCP Auth
gcloud auth application-default login
export GOOGLE_CLOUD_PROJECT=your-project-id
export GOOGLE_CLOUD_LOCATION=us-central1

# 2. Backend
cd backend
pip install -r requirements.txt
python data_generator/generate_synthetic_data.py  # generates synthetic_data.json
uvicorn main:app --reload --port 8000

# 3. Frontend
cd frontend
npm install
npm run dev  # starts on http://localhost:3000
```

**requirements.txt**
```
google-adk
google-cloud-aiplatform
fastapi
uvicorn[standard]
sqlalchemy
python-dotenv
```

**package.json dependencies**
```json
{
  "@copilotkit/react-core": "latest",
  "@copilotkit/react-ui": "latest",
  "ag-ui-adk": "latest",
  "recharts": "latest",
  "react": "^18.0.0",
  "tailwindcss": "latest"
}
```

---

## 13. Demo Script (for Boss Presentation)

**Opening — Wing level:**
*"Here's a live view of our Claims operations. The AI has already flagged anomalies. Let me show you how it investigates them — not just flags them."*

**Beat 1 — Navigate to Lisa Crane (Wing 2):**
Show red anomaly banner. Ask: *"Why is her performance declining?"*
Watch the agent call 3 tools live → synthesize the burnout narrative.
*"Notice the agent is actively investigating — it's not reading from a script."*

**Beat 2 — Navigate to Marcus Webb (Wing 1):**
Ask: *"His call volume dropped 28% in September. Is this a problem?"*
Agent calls training data tool → discovers the certification spike → explains the training investment + November recovery.
*"It found the reason in data we weren't even looking at."*

**Beat 3 — Navigate to Tom Beckett (Wing 3):**
*"This one is subtle."* Surface metrics look fine. Ask: *"Any hidden risks?"*
Agent discovers the silent litigation climb.
*"Top-line metrics looked normal. The agent found what a manual review would miss."*

**Close:**
*"Snowflake Cortex Analyst can tell you what the numbers are. This tells you the story behind them. And it can do it for every handler, every team, every month — automatically."*

---

## 14. Production Migration Path

| Prototype | Production |
|-----------|-----------|
| Synthetic JSON files | Snowflake queries via Cortex Analyst or direct SQL |
| InMemorySessionService | Cloud-based session service (Vertex AI Agent Engine) |
| Local Uvicorn | Cloud Run (containerized) |
| Single agent | Multi-agent: Coordinator + specialized sub-agents per LOB |
| Static anomaly thresholds | ML-driven anomaly detection (Vertex AI) |
| React prototype | Integrated into Hartford BI platform or standalone app |

---

## 15. Out of Scope (Prototype)

- Real Snowflake/database connections
- Authentication and user roles
- Write-back or action tracking
- Mobile optimization
- Multi-year data
- Export features

---

*Spec Status: Ready for Claude Code Implementation*
*The Hartford EDS Claims — DAIO*
*v2.0 — Agentic Architecture with Google ADK + Gemini 2.5 Flash + AG-UI*