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
