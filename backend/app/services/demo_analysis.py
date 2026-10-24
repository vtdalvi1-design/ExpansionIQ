import hashlib
from typing import Any

from app.schemas import DemoAnalysisRequest
from app.services.scoring import CATEGORY_WEIGHTS, calculate_score, rank_results

FACTOR_NAMES = (
    "demand",
    "competition_opportunity",
    "accessibility",
    "cost_viability",
    "category_fit",
)

GROSS_MARGIN_BY_CATEGORY: dict[str, float] = {
    "Grocery": 0.24,
    "Grocery store": 0.24,
    "Fashion": 0.48,
    "Clothing store": 0.48,
    "Electronics": 0.27,
    "Café or restaurant": 0.65,
    "Retail store": 0.32,
    "Pharmacy": 0.28,
    "Fitness centre": 0.75,
    "Salon": 0.70,
    "Educational institute": 0.60,
    "Service business": 0.40,
    "Other business": 0.35,
}

STAFFING_BY_CATEGORY: dict[str, int] = {
    "Grocery": 8,
    "Grocery store": 8,
    "Fashion": 6,
    "Clothing store": 5,
    "Electronics": 5,
    "Café or restaurant": 6,
    "Retail store": 5,
    "Pharmacy": 4,
    "Fitness centre": 6,
    "Salon": 5,
    "Educational institute": 7,
    "Service business": 4,
    "Other business": 5,
}


def _stable_ratio(seed: str) -> float:
    digest = hashlib.sha256(seed.encode("utf-8")).digest()
    return int.from_bytes(digest[:4], "big") / (2**32 - 1)


def _simulated_factors(city: str, category: str) -> dict[str, float]:
    factors: dict[str, float] = {}
    for factor in FACTOR_NAMES:
        ratio = _stable_ratio(f"{city.casefold()}|{category}|{factor}")
        factors[factor] = round(42 + ratio * 46, 1)
    return factors


def _money(value: float) -> float:
    return round(value, 2)


def _resolve_category(category: str) -> str:
    if category in CATEGORY_WEIGHTS:
        return category
    for key in CATEGORY_WEIGHTS:
        if key.casefold() == category.casefold():
            return key
    return "Other business"


def _forecast_for_city(
    city: str,
    request: DemoAnalysisRequest,
) -> dict[str, Any]:
    norm_cat = _resolve_category(request.category)
    city_factor = 0.88 + _stable_ratio(
        f"{city.casefold()}|{request.category}|financial"
    ) * 0.24

    if request.expected_monthly_revenue_inr is not None:
        monthly_revenue = request.expected_monthly_revenue_inr * city_factor
        revenue_basis = "User-entered monthly revenue assumption, adjusted by a simulated city factor."
    elif request.expected_average_ticket_inr and request.expected_customers_per_day:
        base_rev = request.expected_average_ticket_inr * request.expected_customers_per_day * 30
        monthly_revenue = base_rev * city_factor
        revenue_basis = (
            f"Calculated from user inputs: {request.expected_customers_per_day} customers/day @ "
            f"INR {request.expected_average_ticket_inr} avg ticket, adjusted by a simulated city factor."
        )
    else:
        monthly_revenue = (request.budget_inr * 0.12) * city_factor
        revenue_basis = "Illustrative revenue assumption: 12% of available investment budget per month, adjusted by a simulated city factor."

    rent = (
        request.monthly_rent_inr
        if request.monthly_rent_inr is not None
        else request.budget_inr * 0.008 * city_factor
    )
    utilities = (
        request.floor_area_sqft * 18
        if request.floor_area_sqft is not None
        else request.budget_inr * 0.0015 * city_factor
    )

    staffing = request.employee_count or STAFFING_BY_CATEGORY.get(norm_cat, 5)
    monthly_payroll = staffing * 22_000
    marketing = monthly_revenue * 0.05
    gross_margin = GROSS_MARGIN_BY_CATEGORY.get(norm_cat, 0.35)
    cost_of_goods = monthly_revenue * (1 - gross_margin)

    other_expenses = request.monthly_operating_expenses_inr or 0.0
    monthly_expenses = cost_of_goods + rent + utilities + monthly_payroll + marketing + other_expenses

    gross_profit = monthly_revenue - cost_of_goods
    operating_profit = monthly_revenue - monthly_expenses
    contribution_margin = gross_margin - 0.05
    break_even_revenue = (
        (rent + utilities + monthly_payroll + other_expenses) / contribution_margin
        if contribution_margin > 0
        else 0
    )

    # Allocations
    allocations = {
        "Fit-out and equipment": 0.35,
        "Initial inventory": 0.30,
        "Deposits and setup": 0.15,
        "Working capital reserve": 0.20,
    }
    startup_allocation = {
        label: _money(request.budget_inr * share)
        for label, share in allocations.items()
    }

    # Capital requirement vs Budget
    if request.floor_area_sqft is not None:
        estimated_capex = request.floor_area_sqft * 1600 + (rent * 4) + (request.budget_inr * 0.15)
        startup_capital_required = _money(max(estimated_capex, request.budget_inr * 0.85))
    else:
        startup_capital_required = _money(request.budget_inr)

    budget_shortfall = _money(max(0.0, startup_capital_required - request.budget_inr))
    remaining_capital = _money(max(0.0, request.budget_inr - startup_capital_required))

    # Runway & break-even months
    working_cap = startup_allocation.get("Working capital reserve", request.budget_inr * 0.20)
    if operating_profit < 0:
        cash_runway_months = _money(working_cap / abs(operating_profit))
    else:
        cash_runway_months = 24.0

    break_even_months = (
        _money(break_even_revenue / monthly_revenue)
        if monthly_revenue > 0
        else None
    )

    scenarios: dict[str, dict[str, float]] = {}
    for name, revenue_factor, expense_factor in (
        ("Conservative", 0.85, 1.10),
        ("Base", 1.0, 1.0),
        ("Optimistic", 1.15, 0.95),
    ):
        scenario_revenue = monthly_revenue * revenue_factor
        scenario_expenses = monthly_expenses * expense_factor
        scenarios[name] = {
            "monthly_revenue_inr": _money(scenario_revenue),
            "monthly_expenses_inr": _money(scenario_expenses),
            "monthly_operating_profit_inr": _money(
                scenario_revenue - scenario_expenses
            ),
        }

    projections = []
    cumulative_cashflow = -request.budget_inr
    for month in range(1, 13):
        month_revenue = monthly_revenue * (1 + 0.01) ** (month - 1)
        month_expenses = (
            month_revenue * (monthly_expenses / monthly_revenue)
            if monthly_revenue
            else monthly_expenses
        )
        month_operating_profit = month_revenue - month_expenses
        cumulative_cashflow += month_operating_profit
        projections.append(
            {
                "month": month,
                "revenue_inr": _money(month_revenue),
                "expense_inr": _money(month_expenses),
                "operating_profit_inr": _money(month_operating_profit),
                "cashflow_after_startup_inr": _money(cumulative_cashflow),
            }
        )

    # City-specific advantages, disadvantages, risks
    advantages = [
        f"Strong customer accessibility index with favorable market entry timing in {city}.",
        f"Projected gross margin of {gross_margin:.0%} supports viable commercial expansion.",
        f"Operating cash flow estimates reach positive territory under base and optimistic projections.",
    ]
    disadvantages = [
        f"Commercial setup and initial lease deposit require careful liquidity allocation in {city}.",
        "Marketing and customer acquisition expenditures needed to establish initial brand recognition.",
    ]
    risks = [
        "Lease rate escalation and renewal lock-in commitments in high-footfall corridors.",
        "Working capital depletion during initial 3-6 month customer ramp-up period.",
        "Competitive response from entrenched local providers.",
    ]

    return {
        "city_name": city,
        "revenue_basis": revenue_basis,
        "rent_basis": (
            "User-entered monthly rent; same amount applied to each city."
            if request.monthly_rent_inr is not None
            else "Simulated at 0.8% of the entered investment budget per month, adjusted by the city multiplier."
        ),
        "utilities_basis": (
            "Calculated from user-entered floor area at INR 18 per square foot per month."
            if request.floor_area_sqft is not None
            else "Simulated at 0.15% of the entered budget per month, adjusted by the city multiplier."
        ),
        "payroll_basis": (
            f"User-entered staffing assumption: {staffing} employees at INR 22,000 per employee per month."
            if request.employee_count is not None
            else f"Simulated category staffing assumption: {staffing} employees at INR 22,000 per employee per month."
        ),
        "cost_of_goods_basis": (
            f"Simulated {gross_margin:.0%} gross margin for {request.category}."
        ),
        "marketing_basis": "Simulated at 5% of monthly revenue.",
        "monthly_revenue_inr": _money(monthly_revenue),
        "cost_of_goods_inr": _money(cost_of_goods),
        "gross_profit_inr": _money(gross_profit),
        "rent_inr": _money(rent),
        "utilities_inr": _money(utilities),
        "payroll_inr": _money(monthly_payroll),
        "marketing_inr": _money(marketing),
        "monthly_expenses_inr": _money(monthly_expenses),
        "operating_profit_inr": _money(operating_profit),
        "break_even_revenue_inr": _money(break_even_revenue),
        "payback_months": (
            _money(request.budget_inr / operating_profit)
            if operating_profit > 0
            else None
        ),
        "startup_allocation_inr": startup_allocation,
        "scenarios": scenarios,
        "projections": projections,
        "startup_capital_required_inr": startup_capital_required,
        "budget_shortfall_inr": budget_shortfall,
        "remaining_capital_inr": remaining_capital,
        "cash_runway_months": cash_runway_months,
        "break_even_months": break_even_months,
        "data_completeness_pct": 100.0,
        "advantages": advantages,
        "disadvantages": disadvantages,
        "risks": risks,
        "recommendation_text": "",
        "is_recommended": False,
    }


def build_demo_analysis(request: DemoAnalysisRequest) -> dict[str, Any]:
    norm_cat = _resolve_category(request.category)
    rows: list[dict[str, Any]] = []
    for city in request.cities:
        factors = _simulated_factors(city, norm_cat)
        score = calculate_score(factors, norm_cat)
        rows.append(
            {
                "name": city,
                "city_name": city,
                "category": request.category,
                "total_score": score["total_score"],
                "score_status": "complete",
                "missing_factors": [],
                "source_status": "simulated",
                "source": "ExpansionIQ deterministic demo simulator",
                "notes": (
                    "Synthetic demo values; not sourced, independently verified, "
                    "or suitable for real investment decisions."
                ),
                "demand_score": factors["demand"],
                "competition_score": factors["competition_opportunity"],
                "accessibility_score": factors["accessibility"],
                "cost_score": factors["cost_viability"],
                "category_fit_score": factors["category_fit"],
            }
        )

    ranked = rank_results(rows)
    forecasts = [
        _forecast_for_city(city, request)
        for city in request.cities
    ]

    # Assign recommendation
    recommended_city = None
    recommendation_reason = None
    if ranked and ranked[0].get("total_score") is not None:
        top_city = ranked[0]["city_name"]
        # Check if score is strictly differentiated
        if len(ranked) > 1 and ranked[0]["total_score"] == ranked[1]["total_score"]:
            recommended_city = None
            recommendation_reason = (
                "Insufficient data for a reliable final recommendation. "
                "Review the available comparisons and missing information."
            )
        else:
            recommended_city = top_city
            recommendation_reason = (
                f"{top_city} is the recommended expansion location with a composite opportunity score "
                f"of {ranked[0]['total_score']:.1f}/100, favorable cost-to-revenue ratio, and strong demographic reach."
            )
            for f in forecasts:
                if f["city_name"] == top_city:
                    f["is_recommended"] = True
                    f["recommendation_text"] = recommendation_reason

    factor_weights = calculate_score(
        _simulated_factors(request.cities[0], norm_cat),
        norm_cat,
    )["weights"]

    return {
        "category": request.category,
        "business_profile": request.model_dump(),
        "results": ranked,
        "forecasts": forecasts,
        "factor_weights": factor_weights,
        "demo_mode": True,
        "recommended_city": recommended_city,
        "recommendation_reason": recommendation_reason,
        "pdf_report_available": True,
        "disclaimer": (
            "DEMO SIMULATION: market factors, location differences, and any "
            "financial values not directly entered by the user are deterministic "
            "synthetic estimates. No AI model or verified city market dataset "
            "generated these values. They are not facts, forecasts, or investment advice."
        ),
        "assumptions": [
            "Category weights use the existing ExpansionIQ scoring methodology.",
            "Each synthetic market factor is a stable 42-88 value derived from the city, category, and factor name; it is not based on measured city data.",
            "Monthly revenue defaults to 12% of the entered investment budget, then uses a deterministic 0.88–1.12 city multiplier; a user-entered revenue assumption is adjusted by the same multiplier.",
            "Rent defaults to 0.8% of the budget per month times the city multiplier; a user-entered rent is used directly.",
            "Utilities default to INR 18 per entered square foot or 0.15% of budget times the city multiplier when floor area is omitted.",
            "Payroll uses ₹22,000 per employee per month and a category-based default employee count when the user omits staffing.",
            f"Illustrative gross margins are {GROSS_MARGIN_BY_CATEGORY.get(norm_cat, 0.35):.0%} for {request.category}; marketing is 5% of revenue.",
            "City-level variation, gross margins, operating cost ratios, and 1% monthly growth are assumptions, not sourced market data.",
            "The entered business model and customer segment are stored as context.",
            "The 12-month projection applies 1% monthly growth to both revenue and expenses.",
            "Startup allocations divide the entered budget; they are not quotations or actual project costs.",
            "The 12-month outlook is hypothetical and does not guarantee performance.",
        ],
    }
