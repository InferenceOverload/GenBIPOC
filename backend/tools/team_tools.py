"""Tools for querying team-level data."""
from data.data_loader import find_team_handlers, find_team_lead


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
