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
