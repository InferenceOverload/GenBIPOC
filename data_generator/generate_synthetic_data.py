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
                    {"id": "h_derek_cole", "name": "Derek Cole", "lob": "AUTO", "tenure_years": 6.2},
                    {"id": "h_anna_brooks", "name": "Anna Brooks", "lob": "WC", "tenure_years": 3.1},
                    {"id": "h_ryan_foster", "name": "Ryan Foster", "lob": "AUTO", "tenure_years": 5.0},
                    {"id": "h_jessica_lane", "name": "Jessica Lane", "lob": "AUTO", "tenure_years": 2.7},
                ]
            },
            "tl_david_park": {
                "name": "David Park",
                "handlers": [
                    {"id": "h_priya_nair", "name": "Priya Nair", "lob": "AUTO", "tenure_years": 0.3},
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


HARD_CAPS = {
    "csat_score": (1.0, 5.0),
    "closure_rate_pct": (30, 99),
    "reopen_rate_pct": (0, 25),
    "error_rate_pct": (0, 20),
    "supervisor_override_pct": (0, 30),
    "reserve_accuracy_pct": (50, 100),
    "litigation_rate_pct": (0, 30),
}


def gen_metric(baseline_range, prev_value=None, drift_pct=15, metric_key=None):
    """Generate a metric value with optional drift from previous."""
    low, high = baseline_range
    if prev_value is not None:
        drift = prev_value * (drift_pct / 100)
        val = prev_value + random.uniform(-drift, drift)
        val = max(low * 0.7, min(high * 1.3, val))
    else:
        val = random.uniform(low, high)
    # Apply hard caps for realistic bounds
    if metric_key and metric_key in HARD_CAPS:
        cap_low, cap_high = HARD_CAPS[metric_key]
        val = max(cap_low, min(cap_high, val))
    return val


def gen_int_metric(baseline_range, prev_value=None, drift_pct=15, metric_key=None):
    return max(0, int(round(gen_metric(baseline_range, prev_value, drift_pct, metric_key))))


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
                m[key] = round(gen_metric(rng, p, metric_key=key), 1)
            elif key in ("avg_settlement_amt",):
                m[key] = round(gen_metric(rng, p, metric_key=key), -2)
            elif key in ("avg_handle_time_min",):
                m[key] = round(gen_metric(rng, p, metric_key=key), 1)
            else:
                m[key] = gen_int_metric(rng, p, metric_key=key)
            prev[key] = m[key]

        m["month"] = month
        months_data.append(m)

    months_data = apply_stories(handler_id, lob, months_data)
    return months_data


def apply_stories(handler_id, lob, months_data):
    """Embed the 6 correlated narrative stories into specific handlers."""

    # Story 1: Training Dip — Marcus Webb, Sep-Oct 2024 (index 8-9)
    if handler_id == "h_marcus_webb":
        aug = months_data[7]
        sep = months_data[8]
        sep["training_hours"] = int(aug.get("training_hours", 6) * 5)
        sep["calls_handled"] = int(aug["calls_handled"] * 0.72)
        sep["claims_closed"] = int(aug["claims_closed"] * 0.75)
        sep["certifications_completed"] = 2
        oct_d = months_data[9]
        oct_d["training_hours"] = int(aug.get("training_hours", 6) * 3)
        oct_d["calls_handled"] = int(aug["calls_handled"] * 0.82)
        oct_d["claims_closed"] = int(aug["claims_closed"] * 0.85)
        oct_d["certifications_completed"] = 1
        nov = months_data[10]
        nov["training_hours"] = 6
        nov["calls_handled"] = int(aug["calls_handled"] * 1.05)
        nov["claims_closed"] = int(aug["claims_closed"] * 1.02)
        nov["csat_score"] = round(min(5.0, aug["csat_score"] + 0.3), 1)
        nov["certifications_completed"] = 0

    # Story 2: Burnout Signal — Lisa Crane, Jul-Sep 2024 (index 6-8)
    if handler_id == "h_lisa_crane":
        jun = months_data[5]
        for i, idx in enumerate([6, 7, 8]):
            m = months_data[idx]
            decay = 1 + i
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
    if handler_id == "h_priya_nair":
        for i, idx in enumerate([0, 1, 2, 3]):
            m = months_data[idx]
            ramp = i
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
            m["litigation_rate_pct"] = round(8 + 2.8 * (i + 1), 1)
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

    total = sum(
        len(tl["handlers"])
        for wing in data["wings"].values()
        for tl in wing["team_leads"].values()
    )
    print(f"Generated {total} handlers across {len(data['wings'])} wings")
    print(f"Output: {out_path}")


if __name__ == "__main__":
    main()
