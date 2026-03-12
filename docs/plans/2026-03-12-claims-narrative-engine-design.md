# Claims Performance Narrative Engine — Design

**Date:** 2026-03-12
**Status:** Approved

## Overview

AI agent prototype that investigates WHY claim handler performance metrics change. Built with Google ADK + Gemini 3.1 Pro + React/CopilotKit. Queries synthetic data through 8 tools, reasons across dimensions, and surfaces narratives.

## Architecture

```
React (Vite + Tailwind + Recharts + CopilotKit) :3000
  ↕ AG-UI / SSE
FastAPI (google.adk.cli.fast_api.get_fast_api_app()) :8000
  ↕ ADK Runner
ADK LlmAgent (gemini-3.1-pro-preview via Vertex AI, location=global)
  ↕ function calls
8 Python tool functions → synthetic JSON data
```

## Key Decisions

- **Model**: `gemini-3.1-pro-preview` (latest Gemini, requires `global` location)
- **Config**: All parameters via `.env` (project, location, model, ports)
- **Data**: 3 Wings / 6 Team Leads / 32 Handlers / 12 months / 16 KPIs
- **Stories**: 6 correlated patterns embedded in synthetic data, agent discovers them at runtime
- **Frontend**: Hartford brand colors (#1F4E79 primary, #2E75B6 accent)

## Build Phases

1. Synthetic data generator script
2. Tool layer (8 functions + data_loader)
3. ADK Agent + FastAPI backend
4. React frontend (dashboard, navigation, KPI cards, sparklines)
5. Agent chat integration (CopilotKit + AG-UI + tool call cards)
6. Polish + demo mode

## File Structure

Per vision.md Section 5 — `claims-narrative-engine/` with `backend/`, `frontend/`, `data_generator/` directories.

## Reference

Full spec: `vision.md` (root directory)
