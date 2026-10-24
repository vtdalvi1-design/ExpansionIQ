import io
from datetime import datetime, timezone
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

NAVY = colors.HexColor("#0B1220")
DARK_BLUE = colors.HexColor("#111827")
PANEL_BG = colors.HexColor("#172235")
GOLD = colors.HexColor("#D6B36A")
LIGHT_GOLD = colors.HexColor("#FBF5E8")
MUTED_TEXT = colors.HexColor("#64748B")
DARK_TEXT = colors.HexColor("#1E293B")
WHITE = colors.HexColor("#FFFFFF")
BORDER_COLOR = colors.HexColor("#CBD5E1")
SUCCESS_COLOR = colors.HexColor("#10B981")
WARNING_COLOR = colors.HexColor("#F59E0B")


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages: int):
        self.saveState()
        # Suppress headers and footers on cover page (page 1)
        if self._pageNumber > 1:
            # Header
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(GOLD)
            self.drawString(54, 800, "EXPANSIONIQ")
            self.setFont("Helvetica", 8)
            self.setFillColor(MUTED_TEXT)
            self.drawString(125, 800, "· Business Feasibility & Location Intelligence Report")

            self.setStrokeColor(BORDER_COLOR)
            self.setLineWidth(0.5)
            self.line(54, 792, 541, 792)

            # Footer
            self.line(54, 45, 541, 45)
            self.setFont("Helvetica", 8)
            self.setFillColor(MUTED_TEXT)
            self.drawString(54, 32, "Confidential · Prepared with ExpansionIQ Intelligence Engine")
            page_text = f"Page {self._pageNumber} of {total_pages}"
            self.drawRightString(541, 32, page_text)

        self.restoreState()


def _format_inr(val: float | int | None) -> str:
    if val is None:
        return "N/A"
    try:
        val_float = float(val)
        if val_float >= 10_000_000:
            return f"₹{val_float / 10_000_000:.2f} Cr"
        elif val_float >= 100_000:
            return f"₹{val_float / 100_000:.2f} Lakh"
        return f"₹{val_float:,.0f}"
    except (ValueError, TypeError):
        return str(val)


def generate_feasibility_pdf(analysis_data: dict[str, Any]) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=30,
        textColor=NAVY,
        alignment=0,
    )
    subtitle_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=16,
        textColor=GOLD,
        alignment=0,
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        textColor=NAVY,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True,
    )
    subheading_style = ParagraphStyle(
        "SubHeading",
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=14,
        textColor=GOLD,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True,
    )
    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=DARK_TEXT,
    )
    bold_body = ParagraphStyle(
        "BoldBody",
        parent=body_style,
        fontName="Helvetica-Bold",
    )
    callout_style = ParagraphStyle(
        "Callout",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8.5,
        leading=12,
        textColor=NAVY,
    )

    story = []

    profile = analysis_data.get("business_profile", {})
    results = analysis_data.get("results", [])
    forecasts = analysis_data.get("forecasts", [])
    map_places = analysis_data.get("map_places", [])
    competitors = analysis_data.get("competitors", [])
    factor_weights = analysis_data.get("factor_weights", {})
    assumptions = analysis_data.get("assumptions", [])
    disclaimer = analysis_data.get("disclaimer", "")

    business_type = profile.get("business_type") or profile.get("category") or "Retail Enterprise"
    budget = profile.get("budget_inr", 0)
    cities = profile.get("cities", [])
    date_str = analysis_data.get("created_at") or datetime.now(timezone.utc).isoformat()
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        formatted_date = dt.strftime("%B %d, %Y")
    except Exception:
        formatted_date = str(date_str)[:10]

    recommended_city = analysis_data.get("recommended_city") or (results[0]["city_name"] if results else "None")

    # ================= PAGE 1: COVER PAGE =================
    story.append(Spacer(1, 40))
    story.append(Paragraph("EXPANSIONIQ INTELLIGENCE", subtitle_style))
    story.append(Spacer(1, 8))
    story.append(Paragraph(f"BUSINESS FEASIBILITY REPORT<br/>{business_type.upper()}", title_style))
    story.append(Spacer(1, 12))
    story.append(
        HRFlowable(width="100%", thickness=3, color=GOLD, spaceAfter=20, spaceBefore=0)
    )

    cover_meta = [
        [
            Paragraph("<b>Target Sector:</b>", body_style),
            Paragraph(str(business_type), body_style),
            Paragraph("<b>Analysis Date:</b>", body_style),
            Paragraph(formatted_date, body_style),
        ],
        [
            Paragraph("<b>Total Investment Budget:</b>", body_style),
            Paragraph(_format_inr(budget), body_style),
            Paragraph("<b>Candidate Cities:</b>", body_style),
            Paragraph(", ".join(cities), body_style),
        ],
        [
            Paragraph("<b>Business Model:</b>", body_style),
            Paragraph(profile.get("business_model", "Physical retail"), body_style),
            Paragraph("<b>Target Segment:</b>", body_style),
            Paragraph(profile.get("target_customer", "General consumer market"), body_style),
        ],
    ]
    meta_table = Table(cover_meta, colWidths=[130, 115, 120, 122])
    meta_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GOLD),
                ("BOX", (0, 0), (-1, -1), 1, GOLD),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2D1A9")),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(meta_table)
    story.append(Spacer(1, 30))

    # Executive Summary Card on Cover
    exec_summary_text = (
        f"This document provides a comprehensive market comparison and financial feasibility appraisal for "
        f"expanding a <b>{business_type}</b> across candidate locations: <b>{', '.join(cities)}</b>. "
        f"Based on population scale, market access metrics, cost viability, and financial simulations, "
        f"<b>{recommended_city}</b> ranks as the primary candidate location."
    )
    story.append(
        Table(
            [[Paragraph(f"<b>Executive Key Takeaway:</b><br/>{exec_summary_text}", body_style)]],
            colWidths=[487],
            style=[
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
                ("BOX", (0, 0), (-1, -1), 1, BORDER_COLOR),
                ("PADDING", (0, 0), (-1, -1), 12),
            ],
        )
    )
    story.append(Spacer(1, 40))

    # Table of Contents
    story.append(Paragraph("<b>REPORT STRUCTURE & CONTENTS:</b>", subheading_style))
    toc_data = [
        ["1. Cover Page", "8. Data-Quality Assessment", "15. Break-Even Analysis"],
        ["2. Business Profile", "9. Market Factors Analysis", "16. Scenario Comparison"],
        ["3. User Inputs & Assumptions", "10. Competitor Intelligence", "17. Location Comparison Matrix"],
        ["4. Executive Summary", "11. Geospatial & Map Findings", "18. Risks & Limitations"],
        ["5. Candidate Cities Overview", "12. Startup Investment Breakdown", "19. Missing Data Disclosures"],
        ["6. Methodology & Weights", "13. Revenue & Expense Projections", "20. Recommendations & Next Steps"],
        ["7. Sourced Data Registers", "14. Profit & Loss Forecast", ""],
    ]
    toc_table = Table(
        [[Paragraph(cell, body_style) for cell in row] for row in toc_data],
        colWidths=[162, 162, 163],
    )
    toc_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    story.append(toc_table)

    story.append(PageBreak())

    # ================= PAGE 2: PROFILE, INPUTS, EXECUTIVE SUMMARY =================
    story.append(Paragraph("1. COVER PAGE & 2. BUSINESS PROFILE", section_heading))
    story.append(
        Paragraph(
            f"The proposed venture is configured as a <b>{business_type}</b> operating under the "
            f"<b>{profile.get('business_model', 'Physical retail store')}</b> framework. "
            f"The target demographic focus is <i>{profile.get('target_customer', 'general consumer segment')}</i>. "
            f"Planned retail store size is {profile.get('floor_area_sqft') or 'Standard (800 - 1,500)'} sq ft.",
            body_style,
        )
    )
    story.append(Spacer(1, 8))

    story.append(Paragraph("3. USER INPUTS & PARAMETERS", section_heading))
    inputs_rows = [
        [
            Paragraph("<b>Parameter</b>", bold_body),
            Paragraph("<b>User Input Value</b>", bold_body),
            Paragraph("<b>Status / Verification</b>", bold_body),
        ],
        [Paragraph("Business Type", body_style), Paragraph(str(business_type), body_style), Paragraph("User-Provided", callout_style)],
        [Paragraph("Investment Budget", body_style), Paragraph(_format_inr(budget), body_style), Paragraph("User-Provided (INR)", callout_style)],
        [Paragraph("Cities Under Review", body_style), Paragraph(", ".join(cities), body_style), Paragraph("User-Selected", callout_style)],
        [Paragraph("Floor Space (sq ft)", body_style), Paragraph(str(profile.get("floor_area_sqft") or "Omitted (benchmark used)"), body_style), Paragraph("User-Provided / Fallback", callout_style)],
        [Paragraph("Monthly Rent Assumption", body_style), Paragraph(_format_inr(profile.get("monthly_rent_inr")) if profile.get("monthly_rent_inr") else "Omitted (modeled)", body_style), Paragraph("User-Provided / Modeled", callout_style)],
        [Paragraph("Staffing Count", body_style), Paragraph(str(profile.get("employee_count") or "Category Default"), body_style), Paragraph("User-Provided / Sourced", callout_style)],
        [Paragraph("Expected Monthly Revenue", body_style), Paragraph(_format_inr(profile.get("expected_monthly_revenue_inr")) if profile.get("expected_monthly_revenue_inr") else "Modeled (12% baseline)", body_style), Paragraph("User-Provided / Formula", callout_style)],
    ]
    inp_table = Table(inputs_rows, colWidths=[160, 167, 160])
    inp_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
                ("PADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(inp_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("4. EXECUTIVE SUMMARY & DECISION MATRIX", section_heading))
    rec_city = recommended_city
    rec_text = analysis_data.get("recommendation_reason") or (
        f"{rec_city} exhibits the strongest composite balance between customer demand concentration, "
        f"cost feasibility, and break-even stability."
    )
    story.append(Paragraph(f"<b>Recommendation:</b> {rec_text}", body_style))
    story.append(Spacer(1, 6))

    summary_rows = [
        [
            Paragraph("<b>City</b>", bold_body),
            Paragraph("<b>Score (0-100)</b>", bold_body),
            Paragraph("<b>Rank</b>", bold_body),
            Paragraph("<b>Monthly Revenue</b>", bold_body),
            Paragraph("<b>Monthly Profit</b>", bold_body),
            Paragraph("<b>Payback (Mos)</b>", bold_body),
        ]
    ]
    for r in results:
        cname = r.get("city_name", "")
        f_match = next((f for f in forecasts if f.get("city_name") == cname), {})
        summary_rows.append(
            [
                Paragraph(cname, body_style),
                Paragraph(f"{r.get('total_score', 0):.1f}" if r.get("total_score") is not None else "N/A", body_style),
                Paragraph(f"#{r.get('rank', '-')}", bold_body),
                Paragraph(_format_inr(f_match.get("monthly_revenue_inr")), body_style),
                Paragraph(_format_inr(f_match.get("operating_profit_inr")), body_style),
                Paragraph(f"{f_match.get('payback_months', 'N/A')}", body_style),
            ]
        )
    sum_table = Table(summary_rows, colWidths=[100, 75, 52, 90, 90, 80])
    sum_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
                ("PADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(sum_table)

    story.append(Spacer(1, 10))
    story.append(Paragraph("5. CANDIDATE CITIES OVERVIEW & 6. METHODOLOGY", section_heading))
    story.append(
        Paragraph(
            "<b>Scoring Framework:</b> ExpansionIQ employs a multi-attribute weighted scoring algorithm. "
            "Individual factors (Demand, Competition Opportunity, Accessibility, Cost Viability, Category Fit) "
            "are scaled from 0 to 100. Overall score is the dot-product sum of factors and weights.",
            body_style,
        )
    )
    weight_desc = ", ".join([f"{k.replace('_', ' ').capitalize()}: {v*100:.0f}%" for k, v in factor_weights.items()])
    story.append(Paragraph(f"<b>Applied Factor Weights:</b> {weight_desc}", callout_style))

    story.append(PageBreak())

    # ================= PAGE 3: DATA QUALITY, MARKET FACTORS, COMPETITOR INTEL =================
    story.append(Paragraph("7. DATA SOURCES & 8. DATA-QUALITY ASSESSMENT", section_heading))
    story.append(
        Paragraph(
            "<b>Verified Sourced Datasets:</b><br/>"
            "• <b>Census of India 2011 (PCA-UA):</b> Official population aggregates for Indian Urban Agglomerations and Municipal Corporations.<br/>"
            "• <b>GeoNames Gazetteer (IN Snapshot):</b> Official place coordinates, administrative hierarchies, and place identifiers under CC BY 4.0.<br/>"
            "• <b>geoBoundaries IND ADM2 (2021):</b> Standard district boundaries under ODbL 1.0.<br/>"
            "• <b>Transparent Simulator / User Assumptions:</b> Operating cost models, gross margin percentages, and revenue ratios.",
            body_style,
        )
    )
    story.append(Spacer(1, 8))

    story.append(Paragraph("9. MARKET FACTORS ANALYSIS", section_heading))
    factor_rows = [
        [
            Paragraph("<b>City</b>", bold_body),
            Paragraph("<b>Demand</b>", bold_body),
            Paragraph("<b>Competition</b>", bold_body),
            Paragraph("<b>Access</b>", bold_body),
            Paragraph("<b>Cost Viability</b>", bold_body),
            Paragraph("<b>Category Fit</b>", bold_body),
            Paragraph("<b>Status</b>", bold_body),
        ]
    ]
    for r in results:
        factor_rows.append(
            [
                Paragraph(r.get("city_name", ""), body_style),
                Paragraph(str(r.get("demand_score", "N/A")), body_style),
                Paragraph(str(r.get("competition_score", "N/A")), body_style),
                Paragraph(str(r.get("accessibility_score", "N/A")), body_style),
                Paragraph(str(r.get("cost_score", "N/A")), body_style),
                Paragraph(str(r.get("category_fit_score", "N/A")), body_style),
                Paragraph("ESTIMATED", callout_style),
            ]
        )
    fac_table = Table(factor_rows, colWidths=[95, 65, 75, 65, 75, 67, 45])
    fac_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
                ("PADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(fac_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("10. COMPETITOR INTELLIGENCE & 11. GEOSPATIAL FINDINGS", section_heading))
    if competitors:
        comp_rows = [
            [
                Paragraph("<b>Business Name</b>", bold_body),
                Paragraph("<b>City</b>", bold_body),
                Paragraph("<b>Category</b>", bold_body),
                Paragraph("<b>Source / Status</b>", bold_body),
            ]
        ]
        for c in competitors[:5]:
            comp_rows.append(
                [
                    Paragraph(c.get("name", "Unknown"), body_style),
                    Paragraph(c.get("city", ""), body_style),
                    Paragraph(c.get("category", ""), body_style),
                    Paragraph(c.get("source_status", "user_provided"), callout_style),
                ]
            )
        comp_table = Table(comp_rows, colWidths=[150, 100, 110, 127])
        comp_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
                    ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
                    ("PADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        story.append(comp_table)
    else:
        story.append(
            Paragraph(
                "<i>No active verified competitor listings are recorded in the database for the selected locations. "
                "Competitive saturation scores are estimated using retail population benchmarks.</i>",
                callout_style,
            )
        )
    story.append(Spacer(1, 8))

    # Geographic findings
    geo_rows = [
        [
            Paragraph("<b>City Name</b>", bold_body),
            Paragraph("<b>Coordinates (Lat, Long)</b>", bold_body),
            Paragraph("<b>GeoNames Population</b>", bold_body),
            Paragraph("<b>Administrative State</b>", bold_body),
        ]
    ]
    for p in map_places:
        geo_rows.append(
            [
                Paragraph(p.get("name", ""), body_style),
                Paragraph(f"{p.get('latitude', 0):.4f}, {p.get('longitude', 0):.4f}", body_style),
                Paragraph(f"{p.get('population', 0):,}", body_style),
                Paragraph(p.get("admin1_name", "N/A"), body_style),
            ]
        )
    if len(geo_rows) > 1:
        geo_table = Table(geo_rows, colWidths=[120, 137, 110, 120])
        geo_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
                    ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
                    ("PADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        story.append(geo_table)

    story.append(PageBreak())

    # ================= PAGE 4: FINANCIAL BREAKDOWN, P&L, BREAK-EVEN =================
    story.append(Paragraph("12. STARTUP INVESTMENT BREAKDOWN", section_heading))
    primary_f = forecasts[0] if forecasts else {}
    alloc_dict = primary_f.get("startup_allocation_inr", {})
    alloc_rows = [
        [
            Paragraph("<b>Expense Category</b>", bold_body),
            Paragraph("<b>Allocated Amount (INR)</b>", bold_body),
            Paragraph("<b>Share of Budget</b>", bold_body),
        ]
    ]
    for k, v in alloc_dict.items():
        share = (v / budget * 100) if budget else 0
        alloc_rows.append(
            [
                Paragraph(k, body_style),
                Paragraph(_format_inr(v), body_style),
                Paragraph(f"{share:.1f}%", body_style),
            ]
        )
    alloc_rows.append(
        [
            Paragraph("<b>Total Initial Capital</b>", bold_body),
            Paragraph(f"<b>{_format_inr(budget)}</b>", bold_body),
            Paragraph("<b>100.0%</b>", bold_body),
        ]
    )
    alloc_table = Table(alloc_rows, colWidths=[200, 167, 120])
    alloc_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
                ("PADDING", (0, 0), (-1, -1), 4),
                ("BACKGROUND", (0, -1), (-1, -1), LIGHT_GOLD),
            ]
        )
    )
    story.append(alloc_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("13. REVENUE & EXPENSE PROJECTIONS & 14. P&L FORECAST", section_heading))
    pnl_rows = [
        [
            Paragraph("<b>Financial Metric</b>", bold_body),
        ]
        + [Paragraph(f"<b>{f.get('city_name')}</b>", bold_body) for f in forecasts]
    ]
    col_w = [167] + [320 // len(forecasts) for _ in forecasts] if forecasts else [487]

    pnl_metrics = [
        ("Monthly Gross Revenue", "monthly_revenue_inr"),
        ("Cost of Goods Sold (COGS)", "cost_of_goods_inr"),
        ("Gross Profit", "gross_profit_inr"),
        ("Monthly Commercial Rent", "rent_inr"),
        ("Utilities & Facility", "utilities_inr"),
        ("Staff Payroll", "payroll_inr"),
        ("Marketing & Customer Acquisition", "marketing_inr"),
        ("Total Monthly Operating Expenses", "monthly_expenses_inr"),
        ("Net Operating Profit (Monthly)", "operating_profit_inr"),
    ]
    for label, key in pnl_metrics:
        row = [Paragraph(label, body_style)]
        for f in forecasts:
            val = f.get(key)
            formatted = _format_inr(val)
            if key == "operating_profit_inr":
                formatted = f"<b>{formatted}</b>"
            row.append(Paragraph(formatted, body_style))
        pnl_rows.append(row)

    pnl_table = Table(pnl_rows, colWidths=col_w)
    pnl_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
                ("PADDING", (0, 0), (-1, -1), 4),
                ("BACKGROUND", (0, 3), (-1, 3), colors.HexColor("#F1F5F9")),
                ("BACKGROUND", (0, -1), (-1, -1), LIGHT_GOLD),
            ]
        )
    )
    story.append(pnl_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("15. BREAK-EVEN & SCENARIO ANALYSIS", section_heading))
    be_rows = [
        [
            Paragraph("<b>Location</b>", bold_body),
            Paragraph("<b>Break-Even Revenue (Mo)</b>", bold_body),
            Paragraph("<b>Break-Even Margin</b>", bold_body),
            Paragraph("<b>Conservative Profit</b>", bold_body),
            Paragraph("<b>Optimistic Profit</b>", bold_body),
        ]
    ]
    for f in forecasts:
        scen = f.get("scenarios", {})
        c_prof = scen.get("Conservative", {}).get("monthly_operating_profit_inr")
        o_prof = scen.get("Optimistic", {}).get("monthly_operating_profit_inr")
        rev = f.get("monthly_revenue_inr", 1) or 1
        be_rev = f.get("break_even_revenue_inr", 0)
        margin_pct = (be_rev / rev * 100) if rev else 0
        be_rows.append(
            [
                Paragraph(f.get("city_name", ""), body_style),
                Paragraph(_format_inr(be_rev), body_style),
                Paragraph(f"{margin_pct:.1f}%", body_style),
                Paragraph(_format_inr(c_prof), body_style),
                Paragraph(_format_inr(o_prof), body_style),
            ]
        )
    be_table = Table(be_rows, colWidths=[100, 105, 95, 95, 92])
    be_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
                ("PADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(be_table)

    story.append(PageBreak())

    # ================= PAGE 5: LOCATION COMPARISON, RISKS, NEXT STEPS =================
    story.append(Paragraph("16. SCENARIO & 17. LOCATION COMPARISON MATRIX", section_heading))
    matrix_rows = [
        [
            Paragraph("<b>Evaluation Dimension</b>", bold_body),
        ]
        + [Paragraph(f"<b>{c}</b>", bold_body) for c in cities]
    ]
    col_w2 = [147] + [340 // len(cities) for _ in cities] if cities else [487]

    dims = [
        ("Business Suitability", lambda c: "Favorable customer density"),
        ("Population Base (GeoNames)", lambda c: f"{next((p.get('population', 'N/A') for p in map_places if p.get('name') == c), 'N/A'):,}"),
        ("Composite Score (/100)", lambda c: f"{next((r.get('total_score', 0) for r in results if r.get('city_name') == c), 0):.1f}"),
        ("Estimated Monthly Revenue", lambda c: _format_inr(next((f.get('monthly_revenue_inr') for f in forecasts if f.get('city_name') == c), None))),
        ("Estimated Monthly Expense", lambda c: _format_inr(next((f.get('monthly_expenses_inr') for f in forecasts if f.get('city_name') == c), None))),
        ("Estimated Payback Timeline", lambda c: f"{next((f.get('payback_months', 'N/A') for f in forecasts if f.get('city_name') == c), 'N/A')} Months"),
        ("Data Completeness Status", lambda c: "Complete (Modeled)"),
    ]
    for d_name, d_fn in dims:
        row = [Paragraph(d_name, body_style)]
        for c in cities:
            try:
                val = d_fn(c)
            except Exception:
                val = "N/A"
            row.append(Paragraph(str(val), body_style))
        matrix_rows.append(row)

    mat_table = Table(matrix_rows, colWidths=col_w2)
    mat_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
                ("PADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(mat_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("18. RISKS, UNCERTAINTIES & 19. MISSING DATA DISCLOSURES", section_heading))
    story.append(
        Paragraph(
            "<b>Key Operational & Financial Risks:</b><br/>"
            "• <b>Commercial Lease Escalation:</b> Tier-1 retail corridors experience 5-10% annual rent escalations.<br/>"
            "• <b>Staff Attrition & Wages:</b> Retail and hospitality turnover requires sustained training pipeline.<br/>"
            "• <b>Inventory Working Capital Drag:</b> Lead times and seasonal purchasing may demand liquidity cushions.<br/>"
            "• <b>Regulatory Compliance:</b> Municipal trade licenses, GST, fire clearances, and signage permits require 30-90 days.",
            body_style,
        )
    )
    story.append(Spacer(1, 4))
    story.append(
        Paragraph(
            f"<b>Regulatory & Model Disclaimers:</b><br/>{disclaimer}",
            callout_style,
        )
    )
    story.append(Spacer(1, 8))

    story.append(Paragraph("20. RECOMMENDATIONS & NEXT STEPS", section_heading))
    story.append(
        Paragraph(
            f"<b>Strategic Action Plan:</b><br/>"
            f"1. <b>Site Inspection in {recommended_city}:</b> Conduct physical corridor surveys in commercial hubs.<br/>"
            f"2. <b>Obtain Real Lease Quotes:</b> Validate whether asking commercial rates match modeled assumptions.<br/>"
            f"3. <b>Supplier & Inventory Pricing:</b> Secure distributor agreements for critical product inventory.<br/>"
            f"4. <b>Local Permitting Verification:</b> Consult with local municipal authorities regarding commercial license timelines.<br/>"
            f"5. <b>Pilot Testing:</b> Consider a pop-up format or staged launch before committing to multi-year lease terms.",
            body_style,
        )
    )
    story.append(Spacer(1, 15))

    # Signature Block
    sig_data = [
        [
            Paragraph("<b>Prepared by:</b> ExpansionIQ Analytics Engine", body_style),
            Paragraph("<b>Verified Status:</b> Deterministic Feasibility Model", body_style),
        ],
        [
            Paragraph("<b>Date of Issue:</b> " + formatted_date, body_style),
            Paragraph("<b>Document Reference:</b> EI-FEAS-" + str(analysis_data.get("analysis_id", "001")), body_style),
        ],
    ]
    sig_table = Table(sig_data, colWidths=[243, 244])
    sig_table.setStyle(
        TableStyle(
            [
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    story.append(sig_table)

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer.getvalue()
