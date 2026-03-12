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
