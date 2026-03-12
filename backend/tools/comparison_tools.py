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
        period_a_months: Comma-separated months for period A (e.g. '2024-07,2024-08,2024-09')
        period_b_months: Comma-separated months for period B (e.g. '2024-04,2024-05,2024-06')

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
