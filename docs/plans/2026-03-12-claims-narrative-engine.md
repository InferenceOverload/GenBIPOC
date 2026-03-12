# Claims Performance Narrative Engine — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an agentic prototype where an AI agent investigates WHY claim handler KPIs change, using Google ADK + Gemini 3.1 Pro + React/CopilotKit.

**Architecture:** Python FastAPI backend serves an ADK agent with 8 tools that query synthetic JSON data. React/Vite frontend renders a KPI dashboard with navigation tree, anomaly detection, and an agent chat panel via CopilotKit + AG-UI protocol. A small Express server bridges CopilotKit to the ADK backend.

**Tech Stack:** Python 3.13, Google ADK, Gemini 3.1 Pro (Vertex AI, global), FastAPI, React 18, Vite, Tailwind CSS, Recharts, CopilotKit, AG-UI, Express (runtime bridge)

---

## Task 1: Project Scaffolding + Git Init

**Files:**
- Create: `.gitignore`
- Create: `backend/.env`
- Create: `backend/requirements.txt`
- Create: `backend/__init__.py`
- Create: `backend/agent/__init__.py`
- Create: `backend/tools/__init__.py`
- Create: `backend/data/.gitkeep`
- Create: `data_generator/__init__.py`

**Step 1: Initialize git and create .gitignore**

```bash
cd /Users/imperfecto/Documents/Dev/GenBIPOC
git init
```

Create `.gitignore`:
```
__pycache__/
*.pyc
.venv/
venv/
node_modules/
dist/
.env
*.db
sessions.db
.DS_Store
```

**Step 2: Create backend directory structure + .env**

```bash
mkdir -p backend/agent backend/tools backend/data data_generator
```

Create `backend/.env`:
```
GOOGLE_CLOUD_PROJECT=insurance-claims-poc
GOOGLE_CLOUD_LOCATION=global
GEMINI_MODEL=gemini-3.1-pro-preview
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

Create `backend/requirements.txt`:
```
google-adk>=1.0.0
google-cloud-aiplatform
fastapi
uvicorn[standard]
python-dotenv
ag-ui-adk>=0.4.2
```

Create empty `__init__.py` files in `backend/`, `backend/agent/`, `backend/tools/`, `data_generator/`.

**Step 3: Create Python virtual environment and install deps**

```bash
cd /Users/imperfecto/Documents/Dev/GenBIPOC
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

**Step 4: Commit**

```bash
git add .gitignore backend/ data_generator/__init__.py docs/
git commit -m "chore: scaffold project structure with backend dirs, .env, and requirements"
```

---

## Task 2: Synthetic Data Generator

**Files:**
- Create: `data_generator/generate_synthetic_data.py`
- Output: `backend/data/synthetic_data.json`

**Step 1: Write the data generator script**

This script produces a JSON file with 3 Wings, 6 Team Leads, 32 Handlers, 12 months of 16 KPI metrics each, and 6 embedded correlated stories.

Create `data_generator/generate_synthetic_data.py`:

```python
"""
Synthetic data generator for Claims Performance Narrative Engine.
Produces 32 handlers across 3 wings with 12 months of 16 KPI metrics.
Embeds 6 correlated narrative stories the agent must discover.
"""
import json
import random
import os
from datetime import datetime
from pathlib import Path

random.seed(42)

# Organizational structure
ORG_STRUCTURE = {
    "wing_1": {
        "name": "Auto & Workers Comp East",
        "team_leads": {
            "tl_sarah_mitchell": {
                "name": "Sarah Mitchell",
                "handlers": [
                    {"id": "h_marcus_webb", "name": "Marcus Webb", "lob": "WC", "tenure_years": 4.5},
                    {"id": "h_priya_nair", "name": "Priya Nair", "lob": "AUTO", "tenure_years": 0.8},
                    {"id": "h_derek_cole", "name": "Derek Cole", "lob": "AUTO", "tenure_years": 6.2},
                    {"id": "h_anna_brooks", "name": "Anna Brooks", "lob": "WC", "tenure_years": 3.1},
                    {"id": "h_ryan_foster", "name": "Ryan Foster", "lob": "AUTO", "tenure_years": 5.0},
                ]
            },
            "tl_david_park": {
                "name": "David Park",
                "handlers": [
                    {"id": "h_priya_nair_dp", "name": "Priya Nair", "lob": "AUTO", "tenure_years": 0.3},
                    {"id": "h_sam_ortiz", "name": "Sam Ortiz", "lob": "WC", "tenure_years": 7.1},
                    {"id": "h_jenny_kim", "name": "Jenny Kim", "lob": "AUTO", "tenure_years": 2.5},
                    {"id": "h_carlos_reyes", "name": "Carlos Reyes", "lob": "WC", "tenure_years": 4.8},
                    {"id": "h_tanya_bell", "name": "Tanya Bell", "lob": "AUTO", "tenure_years": 1.9},
                    {"id": "h_mike_chen", "name": "Mike Chen", "lob": "WC", "tenure_years": 3.6},
                ]
            }
        }
    },
    "wing_2": {
        "name": "Property & GL Central",
        "team_leads": {
            "tl_karen_torres": {
                "name": "Karen Torres",
                "handlers": [
                    {"id": "h_lisa_crane", "name": "Lisa Crane", "lob": "AUTO", "tenure_years": 3.2},
                    {"id": "h_omar_hassan", "name": "Omar Hassan", "lob": "PROP", "tenure_years": 5.5},
                    {"id": "h_emily_watts", "name": "Emily Watts", "lob": "GL", "tenure_years": 2.8},
                    {"id": "h_victor_diaz", "name": "Victor Diaz", "lob": "PROP", "tenure_years": 4.1},
                    {"id": "h_rachel_green", "name": "Rachel Green", "lob": "GL", "tenure_years": 6.0},
                ]
            },
            "tl_james_liu": {
                "name": "James Liu",
                "handlers": [
                    {"id": "h_sophia_martin", "name": "Sophia Martin", "lob": "PROP", "tenure_years": 3.9},
                    {"id": "h_noah_wright", "name": "Noah Wright", "lob": "GL", "tenure_years": 2.1},
                    {"id": "h_grace_taylor", "name": "Grace Taylor", "lob": "PROP", "tenure_years": 5.3},
                    {"id": "h_ethan_brown", "name": "Ethan Brown", "lob": "PROP", "tenure_years": 1.5},
                    {"id": "h_mia_johnson", "name": "Mia Johnson", "lob": "GL", "tenure_years": 4.4},
                ]
            }
        }
    },
    "wing_3": {
        "name": "Workers Comp West",
        "team_leads": {
            "tl_monica_reed": {
                "name": "Monica Reed",
                "handlers": [
                    {"id": "h_andre_johnson", "name": "Andre Johnson", "lob": "WC", "tenure_years": 8.2},
                    {"id": "h_diana_ruiz", "name": "Diana Ruiz", "lob": "WC", "tenure_years": 3.5},
                    {"id": "h_kevin_patel", "name": "Kevin Patel", "lob": "WC", "tenure_years": 5.7},
                    {"id": "h_sarah_wong", "name": "Sarah Wong", "lob": "WC", "tenure_years": 2.0},
                    {"id": "h_james_murphy", "name": "James Murphy", "lob": "WC", "tenure_years": 6.8},
                    {"id": "h_linda_garcia", "name": "Linda Garcia", "lob": "WC", "tenure_years": 4.3},
                ]
            },
            "tl_brian_scott": {
                "name": "Brian Scott",
                "handlers": [
                    {"id": "h_tom_beckett", "name": "Tom Beckett", "lob": "WC", "tenure_years": 5.1},
                    {"id": "h_nina_patel", "name": "Nina Patel", "lob": "WC", "tenure_years": 3.8},
                    {"id": "h_alex_turner", "name": "Alex Turner", "lob": "WC", "tenure_years": 2.6},
                    {"id": "h_maria_santos", "name": "Maria Santos", "lob": "WC", "tenure_years": 7.4},
                    {"id": "h_chris_lee", "name": "Chris Lee", "lob": "WC", "tenure_years": 4.9},
                ]
            }
        }
    }
}

MONTHS = [f"2024-{m:02d}" for m in range(1, 13)]

# Baseline KPI ranges by LOB
BASELINES = {
    "AUTO": {
        "claims_assigned": (45, 65), "claims_closed": (38, 58), "calls_handled": (280, 350),
        "avg_handle_time_min": (18, 24), "closure_rate_pct": (78, 92),
        "reopen_rate_pct": (3, 7), "csat_score": (3.8, 4.5), "error_rate_pct": (2, 5),
        "supervisor_override_pct": (4, 8), "avg_settlement_amt": (8000, 15000),
        "reserve_accuracy_pct": (85, 95), "litigation_rate_pct": (6, 12),
        "training_hours": (4, 8), "certifications_completed": (0, 1),
        "compliance_violations": (0, 1), "days_absent": (0, 2),
    },
    "WC": {
        "claims_assigned": (35, 55), "claims_closed": (28, 48), "calls_handled": (240, 310),
        "avg_handle_time_min": (20, 28), "closure_rate_pct": (75, 90),
        "reopen_rate_pct": (4, 8), "csat_score": (3.6, 4.4), "error_rate_pct": (2, 6),
        "supervisor_override_pct": (5, 10), "avg_settlement_amt": (12000, 25000),
        "reserve_accuracy_pct": (82, 93), "litigation_rate_pct": (8, 14),
        "training_hours": (4, 8), "certifications_completed": (0, 1),
        "compliance_violations": (0, 1), "days_absent": (0, 2),
    },
    "PROP": {
        "claims_assigned": (30, 50), "claims_closed": (25, 42), "calls_handled": (200, 280),
        "avg_handle_time_min": (22, 30), "closure_rate_pct": (76, 88),
        "reopen_rate_pct": (3, 6), "csat_score": (3.7, 4.5), "error_rate_pct": (2, 5),
        "supervisor_override_pct": (4, 9), "avg_settlement_amt": (15000, 35000),
        "reserve_accuracy_pct": (80, 92), "litigation_rate_pct": (5, 10),
        "training_hours": (4, 8), "certifications_completed": (0, 1),
        "compliance_violations": (0, 1), "days_absent": (0, 2),
    },
    "GL": {
        "claims_assigned": (25, 45), "claims_closed": (20, 38), "calls_handled": (180, 260),
        "avg_handle_time_min": (24, 32), "closure_rate_pct": (74, 88),
        "reopen_rate_pct": (4, 7), "csat_score": (3.6, 4.3), "error_rate_pct": (3, 6),
        "supervisor_override_pct": (5, 10), "avg_settlement_amt": (20000, 50000),
        "reserve_accuracy_pct": (78, 90), "litigation_rate_pct": (10, 16),
        "training_hours": (4, 8), "certifications_completed": (0, 1),
        "compliance_violations": (0, 1), "days_absent": (0, 2),
    },
}


def gen_metric(baseline_range, prev_value=None, drift_pct=15):
    """Generate a metric value with optional drift from previous."""
    low, high = baseline_range
    if prev_value is not None:
        drift = prev_value * (drift_pct / 100)
        val = prev_value + random.uniform(-drift, drift)
        val = max(low * 0.7, min(high * 1.3, val))
    else:
        val = random.uniform(low, high)
    return val


def gen_int_metric(baseline_range, prev_value=None, drift_pct=15):
    return int(round(gen_metric(baseline_range, prev_value, drift_pct)))


def gen_monthly_metrics(lob, handler_id):
    """Generate 12 months of metrics for a handler."""
    baselines = BASELINES[lob]
    months_data = []
    prev = {}

    for month in MONTHS:
        m = {}
        for key, rng in baselines.items():
            p = prev.get(key)
            if key in ("csat_score", "closure_rate_pct", "reopen_rate_pct", "error_rate_pct",
                        "supervisor_override_pct", "reserve_accuracy_pct", "litigation_rate_pct"):
                m[key] = round(gen_metric(rng, p), 1)
            elif key in ("avg_settlement_amt",):
                m[key] = round(gen_metric(rng, p), -2)  # round to nearest 100
            elif key in ("avg_handle_time_min",):
                m[key] = round(gen_metric(rng, p), 1)
            else:
                m[key] = gen_int_metric(rng, p)
            prev[key] = m[key]

        m["month"] = month
        months_data.append(m)

    # Apply stories
    months_data = apply_stories(handler_id, lob, months_data)
    return months_data


def apply_stories(handler_id, lob, months_data):
    """Embed the 6 correlated narrative stories into specific handlers."""

    # Story 1: Training Dip — Marcus Webb, Sep-Oct 2024 (index 8-9)
    if handler_id == "h_marcus_webb":
        # Sep: training spikes 5x, calls drop 28%
        sep = months_data[8]
        aug = months_data[7]
        sep["training_hours"] = int(aug.get("training_hours", 6) * 5)
        sep["calls_handled"] = int(aug["calls_handled"] * 0.72)
        sep["claims_closed"] = int(aug["claims_closed"] * 0.75)
        sep["certifications_completed"] = 2
        # Oct: still in training but improving
        oct_d = months_data[9]
        oct_d["training_hours"] = int(aug.get("training_hours", 6) * 3)
        oct_d["calls_handled"] = int(aug["calls_handled"] * 0.82)
        oct_d["claims_closed"] = int(aug["claims_closed"] * 0.85)
        oct_d["certifications_completed"] = 1
        # Nov: full recovery
        nov = months_data[10]
        nov["training_hours"] = 6
        nov["calls_handled"] = int(aug["calls_handled"] * 1.05)
        nov["claims_closed"] = int(aug["claims_closed"] * 1.02)
        nov["csat_score"] = round(aug["csat_score"] + 0.3, 1)
        nov["certifications_completed"] = 0

    # Story 2: Burnout Signal — Lisa Crane, Jul-Sep 2024 (index 6-8)
    if handler_id == "h_lisa_crane":
        jun = months_data[5]
        for i, idx in enumerate([6, 7, 8]):
            m = months_data[idx]
            decay = 1 + i  # progressive worsening
            m["csat_score"] = round(max(2.8, jun["csat_score"] - 0.35 * decay), 1)
            m["error_rate_pct"] = round(min(12, jun["error_rate_pct"] + 2.0 * decay), 1)
            m["avg_handle_time_min"] = round(max(10, jun["avg_handle_time_min"] - 1.5 * decay), 1)
            m["calls_handled"] = int(jun["calls_handled"] * (1 - 0.06 * decay))
            m["reopen_rate_pct"] = round(min(14, jun["reopen_rate_pct"] + 1.5 * decay), 1)
            m["days_absent"] = min(6, i + 1)
            m["compliance_violations"] = min(3, i)
            m["training_hours"] = max(1, int(jun.get("training_hours", 6) - decay))

    # Story 3: Star Performer — Andre Johnson, all year
    if handler_id == "h_andre_johnson":
        for m in months_data:
            m["litigation_rate_pct"] = round(random.uniform(2.5, 4.5), 1)
            m["csat_score"] = round(random.uniform(4.5, 4.9), 1)
            m["reserve_accuracy_pct"] = round(random.uniform(93, 98), 1)
            m["error_rate_pct"] = round(random.uniform(1.0, 2.5), 1)
            m["closure_rate_pct"] = round(random.uniform(90, 96), 1)
            m["reopen_rate_pct"] = round(random.uniform(1.5, 3.0), 1)

    # Story 4: LOB Complexity Spike — All Wing 2 PROP handlers, Oct-Nov (index 9-10)
    if handler_id in ("h_omar_hassan", "h_victor_diaz", "h_sophia_martin", "h_grace_taylor", "h_ethan_brown") and lob == "PROP":
        sep = months_data[8]
        for idx in [9, 10]:
            m = months_data[idx]
            m["claims_assigned"] = int(sep["claims_assigned"] * 1.48)
            m["avg_settlement_amt"] = round(sep["avg_settlement_amt"] * 2.0, -2)
            m["avg_handle_time_min"] = round(sep["avg_handle_time_min"] * 1.3, 1)
            m["closure_rate_pct"] = round(max(65, sep["closure_rate_pct"] - 8), 1)
            m["error_rate_pct"] = round(min(10, sep["error_rate_pct"] + 2.5), 1)

    # Story 5: New Hire Ramp — Priya Nair (David Park's team), Jan-Apr (index 0-3)
    if handler_id == "h_priya_nair_dp":
        for i, idx in enumerate([0, 1, 2, 3]):
            m = months_data[idx]
            ramp = i  # 0,1,2,3 — progressive improvement
            m["error_rate_pct"] = round(max(2, 12 - 2.5 * ramp), 1)
            m["supervisor_override_pct"] = round(max(4, 18 - 3.5 * ramp), 1)
            m["training_hours"] = int(max(4, 20 - 4 * ramp))
            m["csat_score"] = round(min(4.3, 3.2 + 0.25 * ramp), 1)
            m["closure_rate_pct"] = round(min(88, 65 + 6 * ramp), 1)
            m["claims_closed"] = int(max(15, 18 + 5 * ramp))

    # Story 6: Quiet Risk — Tom Beckett, Aug-Dec (index 7-11)
    if handler_id == "h_tom_beckett":
        for i, idx in enumerate([7, 8, 9, 10, 11]):
            m = months_data[idx]
            # Litigation silently climbs while surface metrics stay fine
            m["litigation_rate_pct"] = round(8 + 2.8 * (i + 1), 1)
            # Surface metrics stay normal/good
            m["csat_score"] = round(random.uniform(3.9, 4.3), 1)
            m["closure_rate_pct"] = round(random.uniform(82, 90), 1)
            m["error_rate_pct"] = round(random.uniform(2.5, 4.5), 1)
            m["calls_handled"] = random.randint(250, 300)

    return months_data


def generate():
    """Generate the full synthetic dataset."""
    data = {"generated_at": datetime.now().isoformat(), "months": MONTHS, "wings": {}}

    for wing_id, wing in ORG_STRUCTURE.items():
        wing_data = {"name": wing["name"], "team_leads": {}}

        for tl_id, tl in wing["team_leads"].items():
            tl_data = {"name": tl["name"], "handlers": []}

            for handler in tl["handlers"]:
                handler_data = {
                    "handler_id": handler["id"],
                    "name": handler["name"],
                    "lob": handler["lob"],
                    "tenure_years": handler["tenure_years"],
                    "wing_id": wing_id,
                    "wing_name": wing["name"],
                    "team_lead_id": tl_id,
                    "team_lead_name": tl["name"],
                    "monthly_metrics": gen_monthly_metrics(handler["lob"], handler["id"]),
                }
                tl_data["handlers"].append(handler_data)

            wing_data["team_leads"][tl_id] = tl_data
        data["wings"][wing_id] = wing_data

    return data


def main():
    data = generate()
    out_path = Path(__file__).parent.parent / "backend" / "data" / "synthetic_data.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(data, f, indent=2)

    # Count handlers
    total = sum(
        len(tl["handlers"])
        for wing in data["wings"].values()
        for tl in wing["team_leads"].values()
    )
    print(f"Generated {total} handlers across {len(data['wings'])} wings")
    print(f"Output: {out_path}")


if __name__ == "__main__":
    main()
```

**Step 2: Run the generator**

```bash
cd /Users/imperfecto/Documents/Dev/GenBIPOC
source .venv/bin/activate
python data_generator/generate_synthetic_data.py
```

Expected: "Generated 32 handlers across 3 wings"

**Step 3: Verify the data has stories embedded**

```bash
python -c "
import json
data = json.load(open('backend/data/synthetic_data.json'))
# Check Marcus Webb training dip
for w in data['wings'].values():
    for tl in w['team_leads'].values():
        for h in tl['handlers']:
            if h['handler_id'] == 'h_marcus_webb':
                sep = h['monthly_metrics'][8]
                print(f\"Marcus Webb Sep training_hours: {sep['training_hours']}, calls: {sep['calls_handled']}\")
            if h['handler_id'] == 'h_tom_beckett':
                dec = h['monthly_metrics'][11]
                print(f\"Tom Beckett Dec litigation_rate: {dec['litigation_rate_pct']}\")
"
```

Expected: Marcus training_hours ~30, calls reduced; Tom litigation ~22%.

**Step 4: Commit**

```bash
git add data_generator/generate_synthetic_data.py backend/data/synthetic_data.json
git commit -m "feat: add synthetic data generator with 32 handlers and 6 embedded stories"
```

---

## Task 3: Data Loader Utility

**Files:**
- Create: `backend/data/data_loader.py`

**Step 1: Write data_loader.py**

```python
"""Utility to load and aggregate synthetic claims data."""
import json
from pathlib import Path
from functools import lru_cache
from typing import Optional

DATA_PATH = Path(__file__).parent / "synthetic_data.json"


@lru_cache(maxsize=1)
def load_data() -> dict:
    """Load the synthetic data file. Cached after first call."""
    with open(DATA_PATH) as f:
        return json.load(f)


def find_handler(handler_id: str) -> Optional[dict]:
    """Find a handler by ID across all wings/teams."""
    data = load_data()
    for wing in data["wings"].values():
        for tl in wing["team_leads"].values():
            for handler in tl["handlers"]:
                if handler["handler_id"] == handler_id:
                    return handler
    return None


def find_team_handlers(team_lead_id: str) -> list[dict]:
    """Get all handlers for a team lead."""
    data = load_data()
    for wing in data["wings"].values():
        if team_lead_id in wing["team_leads"]:
            return wing["team_leads"][team_lead_id]["handlers"]
    return []


def find_team_lead(team_lead_id: str) -> Optional[dict]:
    """Find team lead metadata."""
    data = load_data()
    for wing_id, wing in data["wings"].items():
        if team_lead_id in wing["team_leads"]:
            tl = wing["team_leads"][team_lead_id]
            return {
                "team_lead_id": team_lead_id,
                "name": tl["name"],
                "wing_id": wing_id,
                "wing_name": wing["name"],
                "handler_count": len(tl["handlers"]),
            }
    return None


def find_wing(wing_id: str) -> Optional[dict]:
    """Find wing metadata."""
    data = load_data()
    if wing_id in data["wings"]:
        wing = data["wings"][wing_id]
        return {
            "wing_id": wing_id,
            "name": wing["name"],
            "team_leads": {
                tl_id: {"name": tl["name"], "handler_count": len(tl["handlers"])}
                for tl_id, tl in wing["team_leads"].items()
            },
        }
    return None


def get_all_handlers() -> list[dict]:
    """Get flat list of all handlers with their org context."""
    data = load_data()
    handlers = []
    for wing in data["wings"].values():
        for tl in wing["team_leads"].values():
            handlers.extend(tl["handlers"])
    return handlers


def compute_org_average(metric: str, months: int = 3) -> float:
    """Compute org-wide average for a metric over last N months."""
    all_handlers = get_all_handlers()
    values = []
    for h in all_handlers:
        for m in h["monthly_metrics"][-months:]:
            if metric in m:
                values.append(m[metric])
    return round(sum(values) / len(values), 2) if values else 0.0
```

**Step 2: Verify it works**

```bash
python -c "
from backend.data.data_loader import load_data, find_handler, find_team_handlers
h = find_handler('h_lisa_crane')
print(f\"Found: {h['name']}, LOB: {h['lob']}\")
team = find_team_handlers('tl_karen_torres')
print(f\"Karen Torres team size: {len(team)}\")
"
```

Expected: "Found: Lisa Crane, LOB: AUTO" and "Karen Torres team size: 5"

**Step 3: Commit**

```bash
git add backend/data/data_loader.py
git commit -m "feat: add data loader utility with find/aggregate functions"
```

---

## Task 4: Tool Layer — Handler Tools

**Files:**
- Create: `backend/tools/handler_tools.py`

**Step 1: Write handler_tools.py**

```python
"""Tools for querying individual handler data."""
from backend.data.data_loader import find_handler


def get_handler_metrics(handler_id: str, months: int = 3) -> dict:
    """
    Returns KPI metrics for a specific claim handler for the last N months.
    Use this to understand a handler's recent performance across all dimensions
    including volume, quality, financial, and development metrics.

    Args:
        handler_id: The unique handler identifier (e.g. 'h_marcus_webb')
        months: Number of recent months to return (default 3, max 12)

    Returns:
        dict with handler name, LOB, and monthly metrics array
    """
    handler = find_handler(handler_id)
    if not handler:
        return {"error": f"Handler {handler_id} not found"}

    months = max(1, min(12, months))
    recent = handler["monthly_metrics"][-months:]
    return {
        "handler_id": handler_id,
        "handler_name": handler["name"],
        "lob": handler["lob"],
        "tenure_years": handler["tenure_years"],
        "months_returned": len(recent),
        "metrics": recent,
    }


def get_handler_profile(handler_id: str) -> dict:
    """
    Returns handler metadata including LOB, tenure, team, and wing assignment.
    Use this to understand a handler's organizational context and experience level.

    Args:
        handler_id: The unique handler identifier (e.g. 'h_marcus_webb')

    Returns:
        dict with handler name, LOB, tenure, team lead, and wing info
    """
    handler = find_handler(handler_id)
    if not handler:
        return {"error": f"Handler {handler_id} not found"}

    return {
        "handler_id": handler_id,
        "name": handler["name"],
        "lob": handler["lob"],
        "tenure_years": handler["tenure_years"],
        "team_lead_id": handler["team_lead_id"],
        "team_lead_name": handler["team_lead_name"],
        "wing_id": handler["wing_id"],
        "wing_name": handler["wing_name"],
    }
```

**Step 2: Verify**

```bash
python -c "
from backend.tools.handler_tools import get_handler_metrics, get_handler_profile
m = get_handler_metrics('h_marcus_webb', 3)
print(f\"Got {m['months_returned']} months for {m['handler_name']}\")
p = get_handler_profile('h_lisa_crane')
print(f\"Lisa Crane: {p['wing_name']} / {p['team_lead_name']}\")
"
```

**Step 3: Commit**

```bash
git add backend/tools/handler_tools.py
git commit -m "feat: add handler tools (get_handler_metrics, get_handler_profile)"
```

---

## Task 5: Tool Layer — Team Tools

**Files:**
- Create: `backend/tools/team_tools.py`

**Step 1: Write team_tools.py**

```python
"""Tools for querying team-level data."""
from backend.data.data_loader import find_team_handlers, find_team_lead


def get_team_metrics(team_lead_id: str, months: int = 3) -> dict:
    """
    Returns aggregated metrics for all handlers on a team lead's team.
    Use this to see overall team performance and identify team-wide patterns.

    Args:
        team_lead_id: The team lead identifier (e.g. 'tl_karen_torres')
        months: Number of recent months to aggregate (default 3, max 12)

    Returns:
        dict with team lead info and per-handler summary metrics
    """
    tl = find_team_lead(team_lead_id)
    if not tl:
        return {"error": f"Team lead {team_lead_id} not found"}

    handlers = find_team_handlers(team_lead_id)
    months = max(1, min(12, months))

    handler_summaries = []
    for h in handlers:
        recent = h["monthly_metrics"][-months:]
        # Compute averages for key metrics
        avg = {}
        for key in recent[0]:
            if key == "month":
                continue
            vals = [m[key] for m in recent]
            avg[key] = round(sum(vals) / len(vals), 2)
        handler_summaries.append({
            "handler_id": h["handler_id"],
            "handler_name": h["name"],
            "lob": h["lob"],
            "avg_metrics": avg,
        })

    return {
        "team_lead_id": team_lead_id,
        "team_lead_name": tl["name"],
        "wing_id": tl["wing_id"],
        "wing_name": tl["wing_name"],
        "handler_count": len(handler_summaries),
        "period_months": months,
        "handlers": handler_summaries,
    }


def get_team_average(team_lead_id: str, metric: str, months: int = 3) -> dict:
    """
    Returns the average value of a specific KPI metric across all handlers on a team.
    Use this to benchmark an individual handler against their team peers.

    Args:
        team_lead_id: The team lead identifier (e.g. 'tl_karen_torres')
        metric: The KPI metric name (e.g. 'csat_score', 'error_rate_pct')
        months: Number of recent months to average (default 3, max 12)

    Returns:
        dict with team average, per-handler values, and min/max range
    """
    handlers = find_team_handlers(team_lead_id)
    if not handlers:
        return {"error": f"Team lead {team_lead_id} not found"}

    months = max(1, min(12, months))
    handler_values = []
    all_values = []

    for h in handlers:
        recent = h["monthly_metrics"][-months:]
        vals = [m.get(metric, 0) for m in recent]
        avg = round(sum(vals) / len(vals), 2) if vals else 0
        handler_values.append({
            "handler_id": h["handler_id"],
            "handler_name": h["name"],
            "average": avg,
        })
        all_values.extend(vals)

    team_avg = round(sum(all_values) / len(all_values), 2) if all_values else 0

    return {
        "team_lead_id": team_lead_id,
        "metric": metric,
        "period_months": months,
        "team_average": team_avg,
        "team_min": round(min(all_values), 2) if all_values else 0,
        "team_max": round(max(all_values), 2) if all_values else 0,
        "handler_averages": handler_values,
    }
```

**Step 2: Verify**

```bash
python -c "
from backend.tools.team_tools import get_team_metrics, get_team_average
tm = get_team_metrics('tl_karen_torres', 3)
print(f\"Team: {tm['team_lead_name']}, {tm['handler_count']} handlers\")
ta = get_team_average('tl_karen_torres', 'csat_score', 3)
print(f\"CSAT avg: {ta['team_average']}\")
"
```

**Step 3: Commit**

```bash
git add backend/tools/team_tools.py
git commit -m "feat: add team tools (get_team_metrics, get_team_average)"
```

---

## Task 6: Tool Layer — Wing Tools

**Files:**
- Create: `backend/tools/wing_tools.py`

**Step 1: Write wing_tools.py**

```python
"""Tools for querying wing-level data."""
from backend.data.data_loader import load_data, find_wing


def get_wing_summary(wing_id: str, months: int = 3) -> dict:
    """
    Returns rolled-up metrics across an entire wing (all teams, all handlers).
    Use this to understand wing-level performance trends and compare across wings.

    Args:
        wing_id: The wing identifier (e.g. 'wing_1', 'wing_2', 'wing_3')
        months: Number of recent months to aggregate (default 3, max 12)

    Returns:
        dict with wing info, team summaries, and aggregated KPIs
    """
    wing_meta = find_wing(wing_id)
    if not wing_meta:
        return {"error": f"Wing {wing_id} not found"}

    data = load_data()
    wing = data["wings"][wing_id]
    months = max(1, min(12, months))

    team_summaries = []
    all_metrics = {}

    for tl_id, tl in wing["team_leads"].items():
        team_values = {}
        for handler in tl["handlers"]:
            recent = handler["monthly_metrics"][-months:]
            for m in recent:
                for key, val in m.items():
                    if key == "month":
                        continue
                    if key not in team_values:
                        team_values[key] = []
                    team_values[key].append(val)
                    if key not in all_metrics:
                        all_metrics[key] = []
                    all_metrics[key].append(val)

        team_avg = {k: round(sum(v) / len(v), 2) for k, v in team_values.items()}
        team_summaries.append({
            "team_lead_id": tl_id,
            "team_lead_name": tl["name"],
            "handler_count": len(tl["handlers"]),
            "avg_metrics": team_avg,
        })

    wing_avg = {k: round(sum(v) / len(v), 2) for k, v in all_metrics.items()}

    return {
        "wing_id": wing_id,
        "wing_name": wing_meta["name"],
        "period_months": months,
        "wing_avg_metrics": wing_avg,
        "teams": team_summaries,
    }
```

**Step 2: Verify**

```bash
python -c "
from backend.tools.wing_tools import get_wing_summary
ws = get_wing_summary('wing_2', 3)
print(f\"Wing: {ws['wing_name']}, teams: {len(ws['teams'])}\")
print(f\"Wing avg CSAT: {ws['wing_avg_metrics']['csat_score']}\")
"
```

**Step 3: Commit**

```bash
git add backend/tools/wing_tools.py
git commit -m "feat: add wing tools (get_wing_summary)"
```

---

## Task 7: Tool Layer — Comparison + Investigation Tools

**Files:**
- Create: `backend/tools/comparison_tools.py`
- Create: `backend/tools/investigation_tools.py`

**Step 1: Write comparison_tools.py**

```python
"""Tools for comparing handler performance across dimensions."""
from backend.data.data_loader import find_handler, compute_org_average


def compare_to_org_benchmark(handler_id: str, metric: str, months: int = 3) -> dict:
    """
    Compares a specific metric for a handler against the organization-wide average.
    Use this to determine if a handler's performance is above or below the org norm.

    Args:
        handler_id: The unique handler identifier
        metric: The KPI metric name (e.g. 'csat_score', 'litigation_rate_pct')
        months: Number of recent months to compare (default 3, max 12)

    Returns:
        dict with handler value, org average, variance, and assessment
    """
    handler = find_handler(handler_id)
    if not handler:
        return {"error": f"Handler {handler_id} not found"}

    months = max(1, min(12, months))
    recent = handler["monthly_metrics"][-months:]
    handler_vals = [m.get(metric, 0) for m in recent]
    handler_avg = round(sum(handler_vals) / len(handler_vals), 2) if handler_vals else 0

    org_avg = compute_org_average(metric, months)
    variance_pct = round(((handler_avg - org_avg) / org_avg) * 100, 1) if org_avg else 0

    # Determine if higher is better or worse
    lower_is_better = metric in (
        "error_rate_pct", "reopen_rate_pct", "litigation_rate_pct",
        "supervisor_override_pct", "avg_handle_time_min", "compliance_violations",
        "days_absent"
    )

    if lower_is_better:
        assessment = "better than org" if handler_avg < org_avg else "worse than org"
    else:
        assessment = "better than org" if handler_avg > org_avg else "worse than org"

    return {
        "handler_id": handler_id,
        "handler_name": handler["name"],
        "metric": metric,
        "period_months": months,
        "handler_average": handler_avg,
        "org_average": org_avg,
        "variance_pct": variance_pct,
        "assessment": assessment,
    }


def compare_periods(handler_id: str, metric: str, period_a_months: str, period_b_months: str) -> dict:
    """
    Compares a metric for a handler between two time periods (e.g. MoM or QoQ).
    Use this to measure the direction and magnitude of change over time.

    Args:
        handler_id: The unique handler identifier
        metric: The KPI metric name
        period_a_months: Comma-separated month indices for period A (e.g. '2024-07,2024-08,2024-09')
        period_b_months: Comma-separated month indices for period B (e.g. '2024-04,2024-05,2024-06')

    Returns:
        dict with period A avg, period B avg, change amount, change %, and direction
    """
    handler = find_handler(handler_id)
    if not handler:
        return {"error": f"Handler {handler_id} not found"}

    metrics = handler["monthly_metrics"]
    month_lookup = {m["month"]: m for m in metrics}

    def avg_for_period(period_str):
        months = [m.strip() for m in period_str.split(",")]
        vals = [month_lookup[m].get(metric, 0) for m in months if m in month_lookup]
        return round(sum(vals) / len(vals), 2) if vals else 0

    avg_a = avg_for_period(period_a_months)
    avg_b = avg_for_period(period_b_months)
    change = round(avg_a - avg_b, 2)
    change_pct = round((change / avg_b) * 100, 1) if avg_b else 0

    return {
        "handler_id": handler_id,
        "handler_name": handler["name"],
        "metric": metric,
        "period_a": period_a_months,
        "period_b": period_b_months,
        "period_a_average": avg_a,
        "period_b_average": avg_b,
        "change": change,
        "change_pct": change_pct,
        "direction": "increased" if change > 0 else "decreased" if change < 0 else "unchanged",
    }
```

**Step 2: Write investigation_tools.py**

```python
"""Tools for investigating correlated metric changes."""
from backend.data.data_loader import find_handler


def get_correlated_metrics(handler_id: str, anchor_month: str, threshold_pct: float = 15.0) -> dict:
    """
    Finds all KPI metrics for a handler that changed by more than threshold_pct
    in the given month compared to the prior month. Used to discover correlated signals
    that explain why a specific metric changed.

    Args:
        handler_id: The unique handler identifier
        anchor_month: Month to analyze in YYYY-MM format (e.g. '2024-09')
        threshold_pct: Minimum % change to flag as significant (default 15%)

    Returns:
        dict with list of metrics that moved significantly and their direction/magnitude
    """
    handler = find_handler(handler_id)
    if not handler:
        return {"error": f"Handler {handler_id} not found"}

    metrics = handler["monthly_metrics"]
    month_lookup = {m["month"]: m for m in metrics}

    if anchor_month not in month_lookup:
        return {"error": f"Month {anchor_month} not found in data"}

    # Find prior month
    months = [m["month"] for m in metrics]
    idx = months.index(anchor_month)
    if idx == 0:
        return {"error": "No prior month to compare against"}

    prior_month = months[idx - 1]
    current = month_lookup[anchor_month]
    prior = month_lookup[prior_month]

    significant_changes = []
    for key in current:
        if key == "month":
            continue
        curr_val = current[key]
        prev_val = prior[key]
        if prev_val == 0:
            if curr_val != 0:
                significant_changes.append({
                    "metric": key,
                    "prior_value": prev_val,
                    "current_value": curr_val,
                    "change_pct": 100.0,
                    "direction": "increased",
                })
            continue
        change_pct = round(((curr_val - prev_val) / abs(prev_val)) * 100, 1)
        if abs(change_pct) >= threshold_pct:
            significant_changes.append({
                "metric": key,
                "prior_value": prev_val,
                "current_value": curr_val,
                "change_pct": change_pct,
                "direction": "increased" if change_pct > 0 else "decreased",
            })

    # Sort by absolute change magnitude
    significant_changes.sort(key=lambda x: abs(x["change_pct"]), reverse=True)

    return {
        "handler_id": handler_id,
        "handler_name": handler["name"],
        "anchor_month": anchor_month,
        "prior_month": prior_month,
        "threshold_pct": threshold_pct,
        "significant_changes": significant_changes,
        "total_flagged": len(significant_changes),
    }
```

**Step 3: Verify both**

```bash
python -c "
from backend.tools.comparison_tools import compare_to_org_benchmark, compare_periods
from backend.tools.investigation_tools import get_correlated_metrics

bench = compare_to_org_benchmark('h_andre_johnson', 'litigation_rate_pct', 3)
print(f\"Andre litigation: {bench['handler_average']} vs org {bench['org_average']} — {bench['assessment']}\")

corr = get_correlated_metrics('h_marcus_webb', '2024-09', 15.0)
print(f\"Marcus Sep correlated changes: {corr['total_flagged']}\")
for c in corr['significant_changes'][:3]:
    print(f\"  {c['metric']}: {c['change_pct']}%\")
"
```

Expected: Andre litigation well below org avg; Marcus Sep shows training spike + calls drop.

**Step 4: Update tools __init__.py**

```python
# backend/tools/__init__.py
from backend.tools.handler_tools import get_handler_metrics, get_handler_profile
from backend.tools.team_tools import get_team_metrics, get_team_average
from backend.tools.wing_tools import get_wing_summary
from backend.tools.comparison_tools import compare_to_org_benchmark, compare_periods
from backend.tools.investigation_tools import get_correlated_metrics
```

**Step 5: Commit**

```bash
git add backend/tools/
git commit -m "feat: add comparison and investigation tools, wire up tools __init__"
```

---

## Task 8: ADK Agent Definition

**Files:**
- Create: `backend/agent/agent.py`
- Modify: `backend/agent/__init__.py`

**Step 1: Write agent.py**

```python
"""ADK Agent definition for Claims Performance Narrative Engine."""
import os
from dotenv import load_dotenv
from google.adk.agents import Agent
from backend.tools.handler_tools import get_handler_metrics, get_handler_profile
from backend.tools.team_tools import get_team_metrics, get_team_average
from backend.tools.wing_tools import get_wing_summary
from backend.tools.comparison_tools import compare_to_org_benchmark, compare_periods
from backend.tools.investigation_tools import get_correlated_metrics

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-pro-preview")

root_agent = Agent(
    name="claims_performance_agent",
    model=MODEL,
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
    ],
)
```

**Step 2: Update agent __init__.py**

```python
# backend/agent/__init__.py
from backend.agent.agent import root_agent
```

**Step 3: Commit**

```bash
git add backend/agent/
git commit -m "feat: add ADK agent definition with 8 tools and investigation instruction"
```

---

## Task 9: FastAPI Server

**Files:**
- Create: `backend/main.py`

**Step 1: Write main.py**

```python
"""FastAPI entrypoint for the Claims Performance Narrative Engine."""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load env before any google imports
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

# Set GCP environment variables
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", os.getenv("GOOGLE_CLOUD_PROJECT", ""))
os.environ.setdefault("GOOGLE_CLOUD_LOCATION", os.getenv("GOOGLE_CLOUD_LOCATION", "global"))

from google.adk.cli.fast_api import get_fast_api_app
import uvicorn

AGENT_DIR = str(Path(__file__).parent)

app = get_fast_api_app(
    agent_dir=AGENT_DIR,
    session_db_url="sqlite:///sessions.db",
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    web=False,
)

# Also serve the synthetic data as a REST endpoint for the frontend dashboard
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json

data_path = Path(__file__).parent / "data" / "synthetic_data.json"


@app.get("/api/data")
async def get_data():
    """Serve synthetic data to the frontend for dashboard rendering."""
    with open(data_path) as f:
        return json.load(f)


if __name__ == "__main__":
    port = int(os.getenv("BACKEND_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
```

**Step 2: Test the server starts**

```bash
cd /Users/imperfecto/Documents/Dev/GenBIPOC
source .venv/bin/activate
timeout 10 python -m backend.main || true
```

Expected: Server starts on port 8000 (will timeout after 10s, that's fine).

**Step 3: Commit**

```bash
git add backend/main.py
git commit -m "feat: add FastAPI server with ADK agent and data API endpoint"
```

---

## Task 10: React Frontend Scaffolding

**Files:**
- Create: `frontend/` (via Vite scaffolding)
- Modify: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/src/index.css`

**Step 1: Scaffold Vite React project**

```bash
cd /Users/imperfecto/Documents/Dev/GenBIPOC
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

**Step 2: Install dependencies**

```bash
cd /Users/imperfecto/Documents/Dev/GenBIPOC/frontend
npm install @copilotkit/react-core @copilotkit/react-ui recharts tailwindcss @tailwindcss/vite
```

**Step 3: Configure Tailwind + Vite**

Update `frontend/vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api/copilotkit': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/api/data': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

Replace `frontend/src/index.css`:
```css
@import "tailwindcss";
@import "@copilotkit/react-ui/styles.css";

:root {
  --hartford-primary: #1F4E79;
  --hartford-accent: #2E75B6;
  --hartford-light: #D6E4F0;
  --hartford-dark: #0D2840;
}
```

**Step 4: Commit**

```bash
cd /Users/imperfecto/Documents/Dev/GenBIPOC
git add frontend/
git commit -m "feat: scaffold React frontend with Vite, Tailwind, CopilotKit, Recharts"
```

---

## Task 11: Dashboard Context + Data Fetching

**Files:**
- Create: `frontend/src/context/DashboardContext.jsx`
- Create: `frontend/src/utils/anomalyDetector.js`
- Create: `frontend/src/utils/contextBuilder.js`

**Step 1: Write DashboardContext.jsx**

```jsx
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
```

**Step 2: Write anomalyDetector.js**

```javascript
const THRESHOLDS = {
  closure_rate_pct:    { watch: v => v < 80, anomaly: v => v < 70, direction: 'lower_bad' },
  csat_score:          { watch: v => v < 3.8, anomaly: v => v < 3.4, direction: 'lower_bad' },
  error_rate_pct:      { watch: v => v > 6, anomaly: v => v > 9, direction: 'higher_bad' },
  litigation_rate_pct: { watch: v => v > 14, anomaly: v => v > 18, direction: 'higher_bad' },
  reopen_rate_pct:     { watch: v => v > 7, anomaly: v => v > 10, direction: 'higher_bad' },
  training_hours:      { watch: v => v > 12, anomaly: () => false, direction: 'spike' },
  days_absent:         { watch: v => v > 2, anomaly: v => v > 4, direction: 'higher_bad' },
};

export function detectAnomalies(metrics, periodMonths = 3) {
  if (!metrics || metrics.length === 0) return [];
  const recent = metrics.slice(-periodMonths);
  const anomalies = [];

  for (const [metric, rules] of Object.entries(THRESHOLDS)) {
    const values = recent.map(m => m[metric]).filter(v => v !== undefined);
    if (values.length === 0) continue;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const latest = values[values.length - 1];

    // Calculate MoM change
    let momChange = null;
    if (metrics.length >= periodMonths + 1) {
      const prior = metrics.slice(-(periodMonths + 1), -1);
      const priorVals = prior.map(m => m[metric]).filter(v => v !== undefined);
      if (priorVals.length > 0) {
        const priorAvg = priorVals.reduce((a, b) => a + b, 0) / priorVals.length;
        momChange = priorAvg !== 0 ? Math.round(((avg - priorAvg) / priorAvg) * 100) : null;
      }
    }

    let severity = 'normal';
    if (rules.anomaly(latest)) severity = 'anomaly';
    else if (rules.watch(latest)) severity = 'watch';

    anomalies.push({ metric, latest, avg: Math.round(avg * 100) / 100, severity, momChange, direction: rules.direction });
  }

  return anomalies;
}

export function hasAnomalies(metrics, periodMonths = 3) {
  return detectAnomalies(metrics, periodMonths).some(a => a.severity === 'anomaly');
}

export function getAnomalySummary(metrics, periodMonths = 3) {
  const anomalies = detectAnomalies(metrics, periodMonths);
  const red = anomalies.filter(a => a.severity === 'anomaly');
  const yellow = anomalies.filter(a => a.severity === 'watch');
  return { red, yellow, all: anomalies };
}
```

**Step 3: Write contextBuilder.js**

```javascript
export function buildAgentContext({ data, selectedWing, selectedTeamLead, selectedHandler, periodMonths, handlerData }) {
  if (!handlerData) return '';

  const wing = data?.wings?.[selectedWing];
  const tl = wing?.team_leads?.[selectedTeamLead];
  const recent = handlerData.monthly_metrics.slice(-periodMonths);
  const prior = handlerData.monthly_metrics.slice(-(periodMonths * 2), -periodMonths);

  let snapshot = '';
  if (recent.length > 0 && prior.length > 0) {
    const metrics = Object.keys(recent[0]).filter(k => k !== 'month');
    for (const m of metrics) {
      const currAvg = recent.reduce((a, r) => a + r[m], 0) / recent.length;
      const priorAvg = prior.reduce((a, r) => a + r[m], 0) / prior.length;
      const pct = priorAvg !== 0 ? Math.round(((currAvg - priorAvg) / priorAvg) * 100) : 0;
      const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→';
      const formatted = Number.isInteger(currAvg) ? currAvg : currAvg.toFixed(1);
      snapshot += `- ${m}: ${formatted} (${arrow}${Math.abs(pct)}%)\n`;
    }
  }

  const monthRange = recent.length > 0
    ? `${recent[0].month} to ${recent[recent.length - 1].month}`
    : 'N/A';

  return `=== CURRENT DASHBOARD CONTEXT ===
Level: Handler
Wing: ${selectedWing} — ${wing?.name || ''}
Team Lead: ${tl?.name || ''} (ID: ${selectedTeamLead})
Handler: ${handlerData.name} (ID: ${handlerData.handler_id})
LOB: ${handlerData.lob}
Tenure: ${handlerData.tenure_years} years
Selected Period: Last ${periodMonths} Months (${monthRange})

Latest KPI Snapshot (vs prior ${periodMonths} months):
${snapshot}=================================`;
}
```

**Step 4: Commit**

```bash
git add frontend/src/context/ frontend/src/utils/
git commit -m "feat: add dashboard context, anomaly detector, and agent context builder"
```

---

## Task 12: Navigation Component

**Files:**
- Create: `frontend/src/components/Navigation.jsx`

**Step 1: Write Navigation.jsx**

```jsx
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
    <nav className="w-64 bg-[var(--hartford-dark)] text-white overflow-y-auto h-full">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/60">Organization</h2>
      </div>
      {Object.entries(data.wings).map(([wingId, wing]) => (
        <div key={wingId}>
          <button
            onClick={() => { toggleWing(wingId); selectWing(wingId); }}
            className={`w-full text-left px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-white/10 transition ${
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
                className={`w-full text-left pl-8 pr-4 py-1.5 text-sm flex items-center gap-2 hover:bg-white/10 transition ${
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
                    className={`w-full text-left pl-14 pr-4 py-1 text-sm hover:bg-white/10 transition flex items-center gap-2 ${
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
```

**Step 2: Commit**

```bash
git add frontend/src/components/Navigation.jsx
git commit -m "feat: add navigation tree with wing/team/handler drill-down and anomaly flags"
```

---

## Task 13: KPI Card + Dashboard Components

**Files:**
- Create: `frontend/src/components/KPICard.jsx`
- Create: `frontend/src/components/AnomalyBanner.jsx`
- Create: `frontend/src/components/Dashboard.jsx`

**Step 1: Write KPICard.jsx**

```jsx
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const METRIC_LABELS = {
  claims_assigned: 'Claims Assigned', claims_closed: 'Claims Closed',
  calls_handled: 'Calls Handled', avg_handle_time_min: 'Avg Handle Time',
  closure_rate_pct: 'Closure Rate', reopen_rate_pct: 'Reopen Rate',
  csat_score: 'CSAT Score', error_rate_pct: 'Error Rate',
  supervisor_override_pct: 'Supervisor Override', avg_settlement_amt: 'Avg Settlement',
  reserve_accuracy_pct: 'Reserve Accuracy', litigation_rate_pct: 'Litigation Rate',
  training_hours: 'Training Hours', certifications_completed: 'Certifications',
  compliance_violations: 'Compliance Violations', days_absent: 'Days Absent',
};

const SEVERITY_COLORS = {
  normal: 'border-gray-200 bg-white',
  watch: 'border-yellow-400 bg-yellow-50',
  anomaly: 'border-red-400 bg-red-50',
};

const SEVERITY_BADGES = {
  normal: null,
  watch: <span className="text-yellow-600 text-xs font-medium px-1.5 py-0.5 bg-yellow-100 rounded">Watch</span>,
  anomaly: <span className="text-red-600 text-xs font-medium px-1.5 py-0.5 bg-red-100 rounded">Anomaly</span>,
};

export default function KPICard({ metric, anomalyInfo, monthlyMetrics }) {
  const label = METRIC_LABELS[metric] || metric;
  const severity = anomalyInfo?.severity || 'normal';
  const sparkData = monthlyMetrics.slice(-6).map((m, i) => ({ i, v: m[metric] }));
  const latest = anomalyInfo?.latest ?? monthlyMetrics[monthlyMetrics.length - 1]?.[metric];
  const momChange = anomalyInfo?.momChange;

  const sparkColor = severity === 'anomaly' ? '#ef4444' : severity === 'watch' ? '#eab308' : '#2E75B6';

  return (
    <div className={`rounded-lg border-2 p-4 ${SEVERITY_COLORS[severity]} transition-all`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
        {SEVERITY_BADGES[severity]}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-2xl font-bold text-gray-900">
            {typeof latest === 'number' ? (Number.isInteger(latest) ? latest : latest.toFixed(1)) : '—'}
          </span>
          {momChange !== null && momChange !== undefined && (
            <span className={`ml-2 text-sm font-medium ${
              momChange > 0 ? 'text-green-600' : momChange < 0 ? 'text-red-600' : 'text-gray-400'
            }`}>
              {momChange > 0 ? '↑' : momChange < 0 ? '↓' : '→'}{Math.abs(momChange)}%
            </span>
          )}
        </div>
        <div className="w-20 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Write AnomalyBanner.jsx**

```jsx
import { getAnomalySummary } from '../utils/anomalyDetector';
import { useDashboard } from '../context/DashboardContext';

export default function AnomalyBanner() {
  const { getSelectedHandlerData, periodMonths } = useDashboard();
  const handler = getSelectedHandlerData();
  if (!handler) return null;

  const { red, yellow } = getAnomalySummary(handler.monthly_metrics, periodMonths);
  if (red.length === 0 && yellow.length === 0) return null;

  const topIssues = [...red, ...yellow].slice(0, 3).map(a => a.metric.replace(/_/g, ' ')).join(', ');
  const severity = red.length > 0 ? 'red' : 'yellow';

  return (
    <div className={`rounded-lg p-4 mb-4 flex items-start gap-3 ${
      severity === 'red' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
    }`}>
      <span className="text-xl">{severity === 'red' ? '⚠️' : '👀'}</span>
      <div>
        <p className={`font-medium text-sm ${severity === 'red' ? 'text-red-800' : 'text-yellow-800'}`}>
          AI Insight: {red.length + yellow.length} metric{red.length + yellow.length > 1 ? 's' : ''} flagged
        </p>
        <p className={`text-sm mt-0.5 ${severity === 'red' ? 'text-red-600' : 'text-yellow-600'}`}>
          Significant changes detected in {topIssues}. Ask the agent for a full investigation.
        </p>
      </div>
    </div>
  );
}
```

**Step 3: Write Dashboard.jsx**

```jsx
import { useDashboard } from '../context/DashboardContext';
import { detectAnomalies } from '../utils/anomalyDetector';
import KPICard from './KPICard';
import AnomalyBanner from './AnomalyBanner';

const DISPLAY_METRICS = [
  'claims_assigned', 'claims_closed', 'calls_handled', 'avg_handle_time_min',
  'closure_rate_pct', 'reopen_rate_pct', 'csat_score', 'error_rate_pct',
  'supervisor_override_pct', 'avg_settlement_amt', 'reserve_accuracy_pct', 'litigation_rate_pct',
  'training_hours', 'certifications_completed', 'compliance_violations', 'days_absent',
];

const PERIOD_OPTIONS = [
  { label: '1M', value: 1 },
  { label: '3M', value: 3 },
  { label: '6M', value: 6 },
  { label: '12M', value: 12 },
];

export default function Dashboard() {
  const { data, loading, selectedWing, selectedTeamLead, selectedHandler,
          getSelectedHandlerData, getSelectedTeamData, periodMonths, setPeriodMonths } = useDashboard();

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-500">Loading data...</div>;
  }

  const handler = getSelectedHandlerData();
  const team = getSelectedTeamData();
  const wing = data?.wings?.[selectedWing];

  // Build breadcrumb
  const breadcrumbs = [];
  if (wing) breadcrumbs.push(wing.name);
  if (team) breadcrumbs.push(team.name);
  if (handler) breadcrumbs.push(handler.name);

  const anomalies = handler ? detectAnomalies(handler.monthly_metrics, periodMonths) : [];
  const anomalyMap = Object.fromEntries(anomalies.map(a => [a.metric, a]));

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {handler ? handler.name : team ? team.name : wing ? wing.name : 'Claims Performance Intelligence'}
          </h1>
          {breadcrumbs.length > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">{breadcrumbs.join(' > ')}</p>
          )}
          {handler && (
            <p className="text-xs text-gray-400 mt-1">
              {handler.lob} | {handler.tenure_years}yr tenure | {handler.team_lead_name}
            </p>
          )}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriodMonths(opt.value)}
              className={`px-3 py-1 text-sm rounded-md transition ${
                periodMonths === opt.value
                  ? 'bg-[var(--hartford-primary)] text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Anomaly Banner */}
      {handler && <AnomalyBanner />}

      {/* KPI Grid */}
      {handler ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {DISPLAY_METRICS.map(metric => (
            <KPICard
              key={metric}
              metric={metric}
              anomalyInfo={anomalyMap[metric]}
              monthlyMetrics={handler.monthly_metrics}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 mt-20">
          <p className="text-lg">Select a handler from the navigation</p>
          <p className="text-sm mt-1">Drill down through Wings → Team Leads → Handlers</p>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add frontend/src/components/KPICard.jsx frontend/src/components/AnomalyBanner.jsx frontend/src/components/Dashboard.jsx
git commit -m "feat: add KPI cards with sparklines, anomaly banner, and dashboard layout"
```

---

## Task 14: Agent Chat Panel + Tool Call Cards

**Files:**
- Create: `frontend/src/components/ToolCallCard.jsx`
- Create: `frontend/src/components/AgentChatPanel.jsx`

**Step 1: Write ToolCallCard.jsx**

```jsx
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
```

**Step 2: Write AgentChatPanel.jsx**

```jsx
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

export default function AgentChatPanel() {
  const { data, selectedWing, selectedTeamLead, selectedHandler,
          getSelectedHandlerData, periodMonths } = useDashboard();

  const handlerData = getSelectedHandlerData();
  const wing = data?.wings?.[selectedWing];
  const tl = wing?.team_leads?.[selectedTeamLead];

  // Inject dashboard context into every agent message
  useCopilotReadable({
    description: "Current dashboard context showing which handler/team/wing the user is viewing",
    value: handlerData
      ? buildAgentContext({ data, selectedWing, selectedTeamLead, selectedHandler, periodMonths, handlerData })
      : "No handler selected. User is viewing the overview.",
  });

  // Register tool renderers
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

  return (
    <div className="w-96 border-l border-gray-200 flex flex-col h-full bg-white">
      {/* Context Badge */}
      <div className="px-4 py-3 border-b bg-gray-50 text-xs text-gray-600">
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
```

**Step 3: Commit**

```bash
git add frontend/src/components/ToolCallCard.jsx frontend/src/components/AgentChatPanel.jsx
git commit -m "feat: add agent chat panel with tool call cards and context injection"
```

---

## Task 15: CopilotKit Runtime Bridge

**Files:**
- Create: `frontend/server.js`
- Modify: `frontend/package.json` (add scripts)

The CopilotKit runtime needs a server-side Node process to bridge the frontend to the ADK backend via AG-UI.

**Step 1: Install server dependencies**

```bash
cd /Users/imperfecto/Documents/Dev/GenBIPOC/frontend
npm install @copilotkit/runtime @ag-ui/client express cors
```

**Step 2: Write server.js**

```javascript
import express from 'express';
import cors from 'cors';
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNodeHttpEndpoint,
} from '@copilotkit/runtime';
import { HttpAgent } from '@ag-ui/client';

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

const serviceAdapter = new ExperimentalEmptyAdapter();
const runtime = new CopilotRuntime({
  agents: {
    claims_performance_agent: new HttpAgent({
      url: `${BACKEND_URL}/`,
    }),
  },
});

app.use('/api/copilotkit', (req, res) => {
  const handler = copilotRuntimeNodeHttpEndpoint({
    runtime,
    serviceAdapter,
    endpoint: '/api/copilotkit',
  });
  return handler(req, res);
});

const PORT = process.env.COPILOT_RUNTIME_PORT || 4000;
app.listen(PORT, () => {
  console.log(`CopilotKit runtime bridge running on http://localhost:${PORT}`);
});
```

**Step 3: Update package.json scripts**

Add to `frontend/package.json` scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "dev:runtime": "node server.js",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:runtime\"",
    "build": "vite build",
    "preview": "vite preview"
  },
  "type": "module"
}
```

Install concurrently:
```bash
npm install -D concurrently
```

**Step 4: Commit**

```bash
git add frontend/server.js frontend/package.json
git commit -m "feat: add CopilotKit runtime bridge server for AG-UI protocol"
```

---

## Task 16: App Root + Layout Assembly

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/index.html`

**Step 1: Write App.jsx**

```jsx
import { CopilotKit } from '@copilotkit/react-core';
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
```

**Step 2: Clean up index.html title**

Update the `<title>` in `frontend/index.html` to:
```html
<title>Claims Performance Intelligence — The Hartford</title>
```

**Step 3: Remove default Vite boilerplate**

Delete `frontend/src/App.css` and any default counter code from the scaffolded Vite project.

**Step 4: Verify frontend compiles**

```bash
cd /Users/imperfecto/Documents/Dev/GenBIPOC/frontend
npm run build
```

Expected: Build succeeds with no errors.

**Step 5: Commit**

```bash
git add frontend/
git commit -m "feat: assemble App layout with navigation, dashboard, and agent chat panel"
```

---

## Task 17: End-to-End Integration Test

**Step 1: Start backend**

```bash
cd /Users/imperfecto/Documents/Dev/GenBIPOC
source .venv/bin/activate
python -m backend.main &
```

**Step 2: Start CopilotKit runtime bridge**

```bash
cd /Users/imperfecto/Documents/Dev/GenBIPOC/frontend
npm run dev:runtime &
```

**Step 3: Start frontend**

```bash
cd /Users/imperfecto/Documents/Dev/GenBIPOC/frontend
npm run dev
```

**Step 4: Manual verification checklist**

Open http://localhost:3000 in browser and verify:
- [ ] Navigation tree loads with 3 wings, 6 team leads, 32 handlers
- [ ] Clicking a handler shows KPI cards with sparklines
- [ ] Anomaly flags (red dots) appear on handlers with data stories
- [ ] Lisa Crane shows red anomaly banner
- [ ] Period selector (1M/3M/6M/12M) updates cards
- [ ] Chat panel shows context badge with selected handler
- [ ] Typing a question triggers agent tool calls with animated cards
- [ ] Agent responds with a narrative synthesis

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: integration fixes from end-to-end testing"
```

---

## Task 18: Polish — Hartford Branding + Demo Mode

**Files:**
- Modify: `frontend/src/index.css` (fine-tune styles)
- Modify: `frontend/src/App.jsx` (smooth transitions)

**Step 1: Add transition polish**

Add to `frontend/src/index.css`:
```css
/* Smooth transitions for drill-down navigation */
.transition-all { transition: all 0.2s ease-in-out; }

/* Custom scrollbar for nav */
nav::-webkit-scrollbar { width: 4px; }
nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }

/* Pulse animation for tool calls in progress */
@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
.animate-pulse { animation: pulse-subtle 1.5s ease-in-out infinite; }
```

**Step 2: Commit**

```bash
git add frontend/
git commit -m "style: add Hartford branding polish and transition animations"
```

---

## Task 19: README + Final Commit

**Files:**
- Create: `README.md`

**Step 1: Write README**

```markdown
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
# 1. Clone and enter project
cd claims-narrative-engine

# 2. Create .env in backend/
# Edit backend/.env with your GCP project ID
cp backend/.env.example backend/.env

# 3. Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python data_generator/generate_synthetic_data.py

# 4. Frontend
cd frontend
npm install
cd ..
```

### Run

Three terminals:

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

React (Vite + Tailwind + Recharts + CopilotKit) → AG-UI → FastAPI → ADK Agent (Gemini 3.1 Pro) → 8 Tool Functions → Synthetic JSON Data

## Demo Script

1. **Lisa Crane** (Wing 2): Burnout signal — declining CSAT, rising errors, absences
2. **Marcus Webb** (Wing 1): Training dip — certification spike explains volume drop
3. **Tom Beckett** (Wing 3): Quiet risk — silent litigation climb under normal surface metrics
```

**Step 2: Create .env.example**

```bash
# backend/.env.example
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=global
GEMINI_MODEL=gemini-3.1-pro-preview
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

**Step 3: Final commit**

```bash
git add README.md backend/.env.example
git commit -m "docs: add README with setup instructions and demo script"
```

---

Plan complete and saved to `docs/plans/2026-03-12-claims-narrative-engine.md`. Two execution options:

**1. Subagent-Driven (this session)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — Open new session with executing-plans, batch execution with checkpoints

Which approach?
