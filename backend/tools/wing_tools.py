"""Tools for querying wing-level data."""
from data.data_loader import load_data, find_wing


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
