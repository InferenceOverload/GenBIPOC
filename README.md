# Claims Performance Narrative Engine

AI agent that investigates *why* claim handler performance metrics change — bridging the gap between executive dashboards and actionable insight.

Built with Google ADK (Gemini 3.1 Pro) + FastAPI + React/Vite.

## Quick Start

```bash
# 1. Clone and setup
git clone https://github.com/InferenceOverload/GenBIPOC.git
cd GenBIPOC
./setup.sh

# 2. Configure GCP credentials
#    Edit backend/.env with your GCP project ID
#    Then authenticate:
gcloud auth application-default login

# 3. Start servers
./start.sh
```

Open http://localhost:3000

## Prerequisites

- Python 3.11+
- Node 18+
- GCP project with Vertex AI API enabled
- `gcloud` CLI installed and authenticated

## Architecture

```
React (Vite + Tailwind + Recharts) :3000
  ↕ SSE via Vite proxy → /api/adk/*
FastAPI (ADK get_fast_api_app) :8000
  ↕ ADK Runner
LlmAgent (Gemini 3.1 Pro, Vertex AI)
  ↕ function calls
8 Python tool functions → Synthetic JSON Data
```

### How It Works

1. **Executive Scorecard** shows org/wing/team KPIs across 4 dimensions (Customer Experience, Handler Efficiency, Financial Performance, Development & Compliance)
2. Executive sees a metric flagged → asks "Why is efficiency down?"
3. **AI agent investigates live** — calls tools to pull wing summaries, team metrics, handler data, and correlation analysis
4. Returns a **narrative explanation** identifying root causes, naming specific handlers, and recommending actions
5. All discovered through tool calls, not pre-cooked

### Frontend

- **Report Card tab**: Dimension-based KPI cards with health indicators, sparklines, trends
- **Raw Data tab**: Sortable table with all 16 metrics, conditional highlighting
- **AI Chat panel**: Active at every level (org, wing, team, handler) with context-aware starter prompts
- **Navigation**: Drill-down from Organization → Wing → Team Lead → Handler

### Backend

- **8 agent tools**: `get_handler_metrics`, `get_handler_profile`, `get_team_metrics`, `get_team_average`, `get_wing_summary`, `compare_to_org_benchmark`, `compare_periods`, `get_correlated_metrics`
- **ADK SSE streaming**: Real-time tool call visibility in the chat panel
- **Synthetic data**: 32 handlers, 3 wings, 12 months, 16 KPIs with 6 embedded narrative stories

## Demo Stories

1. **Lisa Crane** (Property & GL Central > Karen Torres): Burnout — declining CSAT, rising errors, absences
2. **Marcus Webb** (Auto & Workers Comp East > Sarah Mitchell): Training dip — certification spike explains volume drop
3. **Tom Beckett** (Workers Comp West > Brian Scott): Quiet risk — silent litigation climb under normal surface metrics
4. **Andre Johnson** (Workers Comp West > Monica Reed): Star performer — consistently exceptional
5. **Wing 2 PROP handlers**: LOB complexity spike — systemic capacity issue, not individual failure
6. **Priya Nair** (Auto & Workers Comp East > David Park): New hire ramp — progressive improvement

## Configuration

All settings in `backend/.env`:

```
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=global
GOOGLE_GENAI_USE_VERTEXAI=TRUE
GEMINI_MODEL=gemini-3.1-pro-preview
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

## Manual Setup

If you prefer not to use the scripts:

```bash
# Python deps
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# Generate data
python3 data_generator/generate_synthetic_data.py

# Frontend deps
cd frontend && npm install && cd ..

# Start backend (terminal 1)
source .venv/bin/activate
cd backend && uvicorn main:app --host 0.0.0.0 --port 8000

# Start frontend (terminal 2)
cd frontend && npm run dev
```
