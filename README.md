# Claims Performance Narrative Engine

AI agent prototype that investigates *why* claim handler performance metrics change.
Built for The Hartford Insurance — EDS Claims / DAIO.

## Quick Start

### Prerequisites
- Python 3.11+
- Node 18+
- GCP project with Vertex AI API enabled
- `gcloud auth application-default login` completed

### Setup

```bash
# 1. Backend
cd backend
cp .env.example .env  # Edit with your GCP project ID
cd ..
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python data_generator/generate_synthetic_data.py

# 2. Frontend
cd frontend
npm install
cd ..
```

### Run (3 terminals)

```bash
# Terminal 1: Backend (port 8000)
source .venv/bin/activate
python -m backend.main

# Terminal 2: CopilotKit Runtime (port 4000)
cd frontend && npm run dev:runtime

# Terminal 3: Frontend (port 3000)
cd frontend && npm run dev
```

Open http://localhost:3000

## Architecture

```
React (Vite + Tailwind + Recharts + CopilotKit) :3000
  ↕ AG-UI / SSE via CopilotKit Runtime :4000
FastAPI (ADK get_fast_api_app) :8000
  ↕ ADK Runner
LlmAgent (Gemini 3.1 Pro, Vertex AI)
  ↕ function calls
8 Python tool functions → Synthetic JSON Data
```

## Demo Script

1. **Lisa Crane** (Wing 2 > Karen Torres): Burnout signal — declining CSAT, rising errors, absences
2. **Marcus Webb** (Wing 1 > Sarah Mitchell): Training dip — certification spike explains volume drop
3. **Tom Beckett** (Wing 3 > Brian Scott): Quiet risk — silent litigation climb under normal surface metrics
4. **Andre Johnson** (Wing 3 > Monica Reed): Star performer — consistently exceptional across all metrics
5. **Wing 2 PROP handlers**: LOB complexity spike — systemic, not individual
6. **Priya Nair** (Wing 1 > David Park): New hire ramp — progressive improvement over first 4 months

## Configuration

All settings in `backend/.env`:
```
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=global
GEMINI_MODEL=gemini-3.1-pro-preview
BACKEND_PORT=8000
```
