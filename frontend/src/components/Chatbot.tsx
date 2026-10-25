import { useState, useRef, useEffect, useMemo } from "react";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  HelpCircle,
  TrendingUp,
  DollarSign,
  Compass,
  Store,
  ChevronRight,
  RotateCcw,
  Bot,
  User,
  Lightbulb,
  Search,
  BookOpen,
  Layers,
  MapPin,
  FileText,
  BarChart2,
  ShieldAlert,
} from "lucide-react";

export interface GlossaryTerm {
  keywords: string[];
  term: string;
  category: "financial" | "market" | "geospatial" | "realestate" | "data";
  shortDefinition: string;
  fullDefinition: string;
  businessImpact: string;
  expansionIqContext: string;
  proTip: string;
  relatedTerms: string[];
}

export const COMPREHENSIVE_GLOSSARY: GlossaryTerm[] = [
  // =========================================================================
  // 1. FINANCIAL & BUDGETING TERMS
  // =========================================================================
  {
    keywords: ["cash runway", "runway", "liquid runway", "survival months", "cash buffer"],
    term: "Cash Runway",
    category: "financial",
    shortDefinition: "The number of months your business can survive before running out of money.",
    fullDefinition:
      "Cash Runway represents the number of months your retail store can continue operations before completely depleting its liquid cash reserves, assuming monthly expenses exceed revenues or during early customer ramp-up.",
    businessImpact:
      "Running out of cash runway is the #1 cause of new retail business death in India. Even an intrinsically viable concept will shut down if customer discovery takes 6 months while the owner only kept 2 months of working capital reserve.",
    expansionIqContext:
      "In ExpansionIQ's Financial Forecast view (Tab 03), cash runway is modeled as (Working Capital Reserve ÷ Monthly Operating Deficit). A runway exceeding 12 months is flagged as Healthy Buffer, while under 4 months triggers a High Liquidity Risk alert.",
    proTip:
      "Always set aside at least 20% of your total budget as an untouched liquid cash reserve to ensure a minimum 6-to-9 month cash runway.",
    relatedTerms: ["Break-Even Period & Revenue", "Working Capital Reserve", "Capex vs Opex"],
  },
  {
    keywords: ["break even", "breakeven", "break-even", "break even revenue", "break even period", "break-even months"],
    term: "Break-Even Period & Revenue",
    category: "financial",
    shortDefinition: "The point where monthly sales exactly cover all monthly operating expenses (zero profit, zero loss).",
    fullDefinition:
      "Break-even revenue is the exact rupee sales volume required every month to pay for cost of goods, rent, staff payroll, utilities, and marketing with zero net loss. The break-even period is the number of operating months it takes to reach that sales level.",
    businessImpact:
      "Until your store crosses the break-even milestone, you are burning your personal savings every day. A lower break-even revenue requirement lowers failure risk and shields you against bad monsoon or seasonal dips.",
    expansionIqContext:
      "ExpansionIQ plots your 12-month P&L trajectory and displays a green intercept marker where monthly gross profit overtakes monthly operating expenses, calculating your exact estimated break-even month.",
    proTip:
      "For cafes, pharmacies, and retail shops, aim for break-even within 4 to 8 months. If break-even requires more than 14 months, renegotiate your lease rent or trim unnecessary overhead.",
    relatedTerms: ["Cash Runway", "Gross Margin", "Opex (Operating Expenses)"],
  },
  {
    keywords: ["capex", "capital expenditure", "setup cost", "initial investment", "fit out cost", "equipment cost"],
    term: "Capex (Capital Expenditure)",
    category: "financial",
    shortDefinition: "One-time upfront capital spent to build, equip, and launch the store before opening day.",
    fullDefinition:
      "Capex consists of all non-recurring launch investments: civil interior architectural fit-out, HVAC air-conditioning, electricals, kitchen/counter equipment, external commercial signage, commercial lease deposits, and initial inventory stock.",
    businessImpact:
      "Capex does not repeat every month, but overspending on Capex starves your working capital. If you spend 90% of your budget on opulent decor, you will have zero cash left to pay staff salaries during slow opening months.",
    expansionIqContext:
      "Visualized in Tab 03 as an interactive Capex Donut allocating: Fit-out & Equipment (35%), Initial Inventory (30%), Lease Deposits & Setup (15%), and Working Capital Reserve (20%).",
    proTip:
      "Never commit more than 75% of your total available capital to upfront Capex. Keep at least 25% liquid for working capital and unforeseen fit-out overruns.",
    relatedTerms: ["Opex (Operating Expenses)", "Payback Period", "Working Capital Reserve"],
  },
  {
    keywords: ["opex", "operating expense", "monthly expense", "fixed costs", "monthly burn"],
    term: "Opex (Operating Expenses)",
    category: "financial",
    shortDefinition: "Recurring monthly costs required to keep the store running day-to-day.",
    fullDefinition:
      "Opex includes commercial shop rent, staff wages/payroll, electricity, water, internet utilities, local marketing, inventory restocking, housekeeping, and maintenance.",
    businessImpact:
      "Fixed Opex (especially steep high-street rent) cannot be reduced when sales drop during bad weather or seasonal lulls. Keeping fixed monthly Opex low gives your store immense survival stamina.",
    expansionIqContext:
      "ExpansionIQ models city-specific Opex based on local rent benchmarks (e.g. ₹60–₹160/sq.ft/mo) and category staffing benchmarks (₹22,000/employee/month) to compute your true monthly operating cost.",
    proTip:
      "Commercial store rent should ideally never exceed 12% to 15% of your projected monthly revenue for F&B/cafes, or 8% to 10% for retail stores.",
    relatedTerms: ["Capex (Capital Expenditure)", "Gross Margin", "Break-Even Period & Revenue"],
  },
  {
    keywords: ["gross margin", "gross profit", "cogs", "cost of goods", "product margin"],
    term: "Gross Profit & Gross Margin %",
    category: "financial",
    shortDefinition: "The percentage of sales left over after paying for the raw materials or wholesale inventory sold.",
    fullDefinition:
      "Gross Margin % is calculated as ((Revenue - Cost of Goods Sold) ÷ Revenue) × 100. It measures the fundamental pricing power and profitability of your products before store rent and salaries are deducted.",
    businessImpact:
      "High gross margin categories (e.g. Cafes at 65%–75%, Fashion at 50%–60%) can afford prime high-street rent because every customer transaction leaves healthy gross profit. Low gross margin categories (e.g. Grocery at 22%–28%) require massive sales volume to cover store rent.",
    expansionIqContext:
      "ExpansionIQ applies category-specific benchmark margins (70% for Cafes, 24% for Grocery, 55% for Salons, 32% for Electronics) to project your monthly gross profit.",
    proTip:
      "Watch inventory shrinkage, supplier price increases, and spoilage. A 3% drop in gross margin can wipe out 30% of your bottom-line net profit.",
    relatedTerms: ["Cost of Goods Sold (COGS)", "Opex (Operating Expenses)", "Operating Margin"],
  },
  {
    keywords: ["operating margin", "operating profit", "ebitda", "net profit", "bottom line"],
    term: "Operating Profit & Operating Margin %",
    category: "financial",
    shortDefinition: "The net money left over each month after paying all operational expenses.",
    fullDefinition:
      "Operating Profit is calculated as Monthly Revenue minus Total Operating Expenses (COGS, rent, payroll, utilities, marketing). Operating Margin % is (Operating Profit ÷ Revenue) × 100.",
    businessImpact:
      "This is your true bottom-line earnings before taxes. If operating margin is negative, your business is losing money every month and depleting cash reserves.",
    expansionIqContext:
      "ExpansionIQ calculates monthly operating profit across Base, Conservative, and Optimistic scenarios, highlighting whether your projected profit is healthy, marginal, or negative.",
    proTip:
      "Target an operating profit margin of 15% to 22% in mature retail operations. Anything below 8% leaves you vulnerable to sudden rent hikes or inflation.",
    relatedTerms: ["Gross Margin", "Break-Even Period & Revenue", "Scenario Analysis"],
  },
  {
    keywords: ["cogs", "cost of goods sold", "inventory cost", "raw material cost"],
    term: "Cost of Goods Sold (COGS)",
    category: "financial",
    shortDefinition: "The direct wholesale cost of raw materials or stock required to produce the items you sell.",
    fullDefinition:
      "COGS encompasses coffee beans, milk, syrups, packaging, or wholesale apparel. It excludes store rent, staff salaries, and electricity.",
    businessImpact:
      "If raw material supplier costs jump by 10% and you cannot raise retail menu prices, COGS expands and directly crushes your gross margin.",
    expansionIqContext:
      "ExpansionIQ calculates COGS as Monthly Revenue × (1 - Gross Margin %) for your selected retail category.",
    proTip:
      "Negotiate volume discounts and local supplier contracts in cities like Kolhapur or Pune to lower COGS by 3–5% compared to importing goods from distant metros.",
    relatedTerms: ["Gross Margin", "Opex (Operating Expenses)"],
  },
  {
    keywords: ["contribution margin", "unit economics"],
    term: "Contribution Margin",
    category: "financial",
    shortDefinition: "The portion of each sale that contributes toward paying fixed store rent and overhead.",
    fullDefinition:
      "Contribution Margin is calculated as Gross Margin minus variable sales costs (such as 5% marketing or payment gateway fees). It represents the net revenue available to pay fixed monthly store rent and staff salaries.",
    businessImpact:
      "A higher contribution margin means each customer walking through the door pays off your monthly store rent faster.",
    expansionIqContext:
      "Used in ExpansionIQ's financial engine to compute the exact break-even revenue formula: Fixed Costs ÷ Contribution Margin.",
    proTip:
      "Focus on selling high-contribution items (like beverages or accessories) alongside core staple items to accelerate break-even.",
    relatedTerms: ["Gross Margin", "Break-Even Period & Revenue"],
  },
  {
    keywords: ["payback period", "payback months", "capital recoup", "roi timeline"],
    term: "Payback Period",
    category: "financial",
    shortDefinition: "The total number of months needed for cumulative store profits to completely repay your initial startup investment.",
    fullDefinition:
      "Payback Period = Total Startup Capex ÷ Average Monthly Net Operating Profit. It tells an investor or founder when their original capital is 100% recovered.",
    businessImpact:
      "A shorter payback period (e.g. 18 months) lowers investor risk and enables you to reinvest those profits to open your 2nd or 3rd branch.",
    expansionIqContext:
      "Displayed in Tab 03 Financial Forecast. Shows estimated payback months under Base, Conservative, and Optimistic trajectories.",
    proTip:
      "A healthy retail business should recoup Capex within 18 to 30 months. If payback stretches beyond 36 months, initial setup costs are too bloated.",
    relatedTerms: ["Capex (Capital Expenditure)", "Cumulative Cash Flow", "Cash Runway"],
  },
  {
    keywords: ["working capital reserve", "working capital", "cash reserve", "liquidity buffer"],
    term: "Working Capital Reserve",
    category: "financial",
    shortDefinition: "Emergency liquid funds set aside to fund initial monthly deficits while building customer footfall.",
    fullDefinition:
      "A dedicated cash pool retained in the business bank account, strictly reserved for monthly operational shortfalls, emergency repairs, and supplier payments during the first 3 to 6 months of store ramp-up.",
    businessImpact:
      "Founders who spend 100% of their money on interior civil fit-out with zero working capital face immediate cash-flow strangulation in Month 2.",
    expansionIqContext:
      "ExpansionIQ automatically reserves 20% of your entered investment budget specifically for Working Capital Reserve.",
    proTip:
      "Never treat your working capital reserve as available money for fancier furniture or extra lighting fixtures.",
    relatedTerms: ["Cash Runway", "Capex (Capital Expenditure)"],
  },
  {
    keywords: ["budget shortfall", "capital shortfall", "funding gap", "underfunded"],
    term: "Budget Shortfall",
    category: "financial",
    shortDefinition: "The financial gap when estimated startup setup costs exceed your entered investment budget.",
    fullDefinition:
      "Calculated as Max(0, Estimated Startup Capital Required - Available Investment Budget). Indicates how much additional funding is required before opening.",
    businessImpact:
      "Underestimating required capital leads to stalled fit-outs, delayed store launches, and compromised locations.",
    expansionIqContext:
      "In Tab 03, if your floor area and rental deposits exceed your entered budget, ExpansionIQ displays a prominent Budget Shortfall alert.",
    proTip:
      "If you face a budget shortfall, reduce floor area (e.g. 1,000 sq.ft instead of 1,800 sq.ft) rather than cutting your working capital buffer.",
    relatedTerms: ["Startup Capital Required", "Remaining Capital", "Capex (Capital Expenditure)"],
  },
  {
    keywords: ["remaining capital", "surplus capital", "unallocated funds"],
    term: "Remaining Capital",
    category: "financial",
    shortDefinition: "Surplus funds remaining from your budget after all startup Capex and setup reserves are allocated.",
    fullDefinition:
      "Calculated as Available Budget minus Estimated Startup Capital Required. Represents unencumbered cash available for aggressive local marketing.",
    businessImpact:
      "Provides financial peace of mind and enables proactive promotional campaigns to capture market share rapidly.",
    expansionIqContext:
      "Shown on the Capital Allocation summary card in Tab 03 as positive surplus capital.",
    proTip:
      "Deploy surplus capital into digital hyper-local advertising (Instagram/Google Maps promotions) within a 3km radius during your opening week.",
    relatedTerms: ["Budget Shortfall", "Working Capital Reserve"],
  },
  {
    keywords: ["startup capital required", "total capital required", "launch budget"],
    term: "Startup Capital Required",
    category: "financial",
    shortDefinition: "The realistic total money needed to complete store fit-out, pay security deposits, and launch.",
    fullDefinition:
      "Calculated dynamically based on floor area (₹1,600/sq.ft for civil fit-out), commercial lease deposit (4 months rent), opening inventory, and setup reserves.",
    businessImpact:
      "Prevents founders from under-capitalizing their retail project based on wishful thinking.",
    expansionIqContext:
      "Calculated in `demo_analysis.py` and compared directly against your entered budget in Tab 03.",
    proTip:
      "Add a 10% contingency buffer to any contractor's interior quotation for hidden plumbing and electrical work.",
    relatedTerms: ["Capex (Capital Expenditure)", "Budget Shortfall"],
  },
  {
    keywords: ["cumulative cash flow", "cashflow", "cumulative cashflow"],
    term: "Cumulative Cash Flow",
    category: "financial",
    shortDefinition: "The net total cash balance of the business over time, starting from negative initial investment.",
    fullDefinition:
      "Begins at negative initial budget (Month 0: -₹25,00,000) and tracks monthly net profits added over time. When cumulative cash flow reaches ₹0, your store has fully paid back its initial investment.",
    businessImpact:
      "Illustrates the 'J-Curve' of business investment: initial cash dip followed by steady upward accumulation.",
    expansionIqContext:
      "Plotted across the 12-Month Projections chart in Tab 03 Financial Forecast.",
    proTip:
      "Focus on speeding up positive monthly cash generation rather than just paper accounting profit.",
    relatedTerms: ["Payback Period", "Cash Runway"],
  },
  {
    keywords: ["scenario analysis", "conservative scenario", "base scenario", "optimistic scenario", "what if"],
    term: "Scenario Analysis (Conservative vs Base vs Optimistic)",
    category: "financial",
    shortDefinition: "Stress-testing your financial plan against slow sales (Conservative), expected sales (Base), and boom sales (Optimistic).",
    fullDefinition:
      "Conservative scenario models 15% lower revenue and 10% higher expenses. Base scenario represents standard projections. Optimistic scenario models 15% higher revenue and 5% cost efficiencies.",
    businessImpact:
      "Ensures your business survives worst-case economic downturns. If a business fails catastrophically under the Conservative scenario, the site selection is too fragile.",
    expansionIqContext:
      "Tab 03 provides an interactive Scenario Switcher that updates monthly revenue, monthly expenses, and net profit dynamically.",
    proTip:
      "Always budget your store survival around the Conservative scenario, and treat Optimistic scenario profits as an unexpected bonus.",
    relatedTerms: ["Break-Even Period & Revenue", "Operating Margin"],
  },
  {
    keywords: ["average ticket", "ticket size", "aov", "average order value", "average spend"],
    term: "Average Ticket Size (AOV)",
    category: "financial",
    shortDefinition: "The average rupee amount spent by a single customer during one transaction.",
    fullDefinition:
      "Total Monthly Revenue ÷ Total Monthly Customer Invoices. Represents the typical basket size per buying customer.",
    businessImpact:
      "To generate ₹6,00,000 monthly sales: at a ₹150 ticket size you need 4,000 customer visits (133/day). At a ₹400 ticket size, you only need 1,500 customer visits (50/day). Higher ticket size reduces labor pressure while increasing profit.",
    expansionIqContext:
      "You can enter Expected Average Ticket Size in the input form to drive bottom-up customer footfall revenue modeling.",
    proTip:
      "Train staff on cross-selling combos and beverage add-ons. Adding just ₹35 to your average ticket size across 3,000 customers yields ₹1,05,000 in pure extra profit.",
    relatedTerms: ["Customers per Day", "Gross Margin"],
  },
  {
    keywords: ["customers per day", "daily customers", "customer volume", "daily transactions"],
    term: "Customers per Day",
    category: "financial",
    shortDefinition: "The number of paying customer transactions completed every day.",
    fullDefinition:
      "Daily transaction count. Calculated from pedestrian footfall multiplied by store walk-in conversion rate.",
    businessImpact:
      "Directly determines staffing requirements, seating capacity turnover, and inventory replenishment frequency.",
    expansionIqContext:
      "Used in bottom-up revenue calculations: (Customers/Day × Average Ticket × 30 Days × City Multiplier).",
    proTip:
      "Ensure store seating and kitchen counter capacity can handle peak rush hour (1:00–3:00 PM and 7:00–10:00 PM) without creating frustrating customer wait times.",
    relatedTerms: ["Average Ticket Size (AOV)", "Primary & Secondary Trade Catchment"],
  },

  // =========================================================================
  // 2. MARKET OPPORTUNITY & SCORING TERMS
  // =========================================================================
  {
    keywords: ["composite score", "viability score", "opportunity score", "overall score", "market ranking"],
    term: "Composite Viability Score",
    category: "market",
    shortDefinition: "The overall 0–100 health score ranking how attractive an expansion city is for your business.",
    fullDefinition:
      "A mathematically weighted multi-factor score synthesizing Demand, Competition Opportunity, Transit Accessibility, Cost Viability, and Category Fit into an institutional-grade 0–100 ranking.",
    businessImpact:
      "Eliminates emotional bias (e.g. picking a city simply because you grew up there or because shop rent is cheap). Gives an objective benchmark of commercial success odds.",
    expansionIqContext:
      "Displayed on the Executive Summary (Tab 01), comparison matrix (Tab 06), and city map pins. Scores >80 indicate High Viability, 65–79 indicate Viable with Risks, and <60 signal High Caution.",
    proTip:
      "Always inspect the 5 underlying factor scores. A city with an 82 composite score but a low Cost Viability score may demand too much upfront capital.",
    relatedTerms: ["Demand Score", "Competition Opportunity Score", "Factor Weights"],
  },
  {
    keywords: ["demand score", "market demand", "consumer demand", "purchasing power"],
    term: "Demand Score",
    category: "market",
    shortDefinition: "A 0–100 rating measuring local customer buying appetite, population volume, and income.",
    fullDefinition:
      "Evaluates target customer demographic density, per-capita disposable income, household consumption expenditure, and historical retail sales velocity.",
    businessImpact:
      "High demand means customers are actively looking to buy your products without expensive awareness campaigns. Low demand means you must fight for every rupee.",
    expansionIqContext:
      "Weighed heavily in categories like Fashion (25%) and Grocery (30%). Displayed on radar charts and Market Factors (Tab 04).",
    proTip:
      "Pair demand score with population density. High demand in a dense urban core creates instant natural footfall.",
    relatedTerms: ["Population Density", "Composite Viability Score"],
  },
  {
    keywords: ["competition opportunity", "competition score", "competitor gap", "market gap"],
    term: "Competition Opportunity Score",
    category: "market",
    shortDefinition: "A 0–100 rating where a higher score means lower competitor saturation and greater market entry gap.",
    fullDefinition:
      "An inverted competition metric. A high score (e.g. 85/100) indicates an underserved market where customer demand exceeds existing retail supply. A low score indicates severe competitor overcrowding.",
    businessImpact:
      "Entering a market with a high competition opportunity score lets you capture dominant market share early and command firm retail pricing without price wars.",
    expansionIqContext:
      "Calculated from local competitor registers and population ratios, displayed in Competitor Intelligence (Tab 05).",
    proTip:
      "Zero competition is sometimes a warning of zero demand. The ideal sweet spot is a locality with 2–3 older mom-and-pop stores where modern branded formats are missing.",
    relatedTerms: ["Competitor Saturation Index", "Category Fit Score"],
  },
  {
    keywords: ["saturation index", "competitor saturation", "saturation", "overcrowding"],
    term: "Competitor Saturation Index",
    category: "market",
    shortDefinition: "A metric quantifying how crowded a retail sector is relative to the local population.",
    fullDefinition:
      "Calculated as (Total Direct Competitors ÷ Target Population Catchment). A saturation index >0.70 signals a saturated red-ocean market; <0.35 signals an open blue-ocean opportunity.",
    businessImpact:
      "High saturation leads to margin compression, customer churn, and predatory discounting by entrenched local incumbents.",
    expansionIqContext:
      "Visualized on the map with red saturation aura rings and detailed in Tab 05 Competitor Intelligence.",
    proTip:
      "If expanding into a saturated corridor, focus on strong product differentiation (e.g. specialty organic coffee or 24/7 drive-thru).",
    relatedTerms: ["Competition Opportunity Score", "Nearest Competitor Distance"],
  },
  {
    keywords: ["accessibility score", "transit connectivity score", "connectivity score"],
    term: "Accessibility & Transit Score",
    category: "market",
    shortDefinition: "A 0–100 score measuring ease of physical customer access via highways, transit hubs, and roads.",
    fullDefinition:
      "Rates road network connectivity, proximity to arterial expressways, central bus stands (CBS), commuter rail/metro stations, and parking availability.",
    businessImpact:
      "Even a fantastic store will suffer if customers cannot easily drive or walk to it due to permanent traffic gridlock or zero parking.",
    expansionIqContext:
      "Represented by transit node pins (Metro, Bus Stand, Expressway) on the Geospatial Map (Tab 02).",
    proTip:
      "Check accessibility during both morning office rush hours and weekend evening family shopping hours.",
    relatedTerms: ["Primary & Secondary Trade Catchment", "Commercial Frontage"],
  },
  {
    keywords: ["cost viability", "cost score", "cost viability score", "rent affordability"],
    term: "Cost Viability Score",
    category: "market",
    shortDefinition: "A 0–100 rating measuring how affordable commercial rents and operating costs are relative to sales.",
    fullDefinition:
      "Evaluates commercial real estate lease rates, wage rates, and utility costs against projected revenue. Higher score = lower cost pressure and wider profit margins.",
    businessImpact:
      "Tier-2 cities like Kolhapur often score much higher in Cost Viability than Tier-1 metros (Mumbai/Delhi) because commercial rents are 60% lower while purchasing power remains robust.",
    expansionIqContext:
      "Calculated in `scoring.py` and visualized across city comparison tables in Tab 04 and Tab 06.",
    proTip:
      "A city with high demand but terrible cost viability will leave you working solely to pay your landlord's rent.",
    relatedTerms: ["Monthly Rent", "Opex (Operating Expenses)"],
  },
  {
    keywords: ["category fit", "category fit score", "retail fit", "sector fit"],
    term: "Category Fit Score",
    category: "market",
    shortDefinition: "A 0–100 rating measuring how naturally your specific business category matches the city's culture and spending habits.",
    fullDefinition:
      "Assesses the historical alignment between your retail offering (e.g. Specialty Cafe, Fashion Boutique, Gym) and the local demographic profile, age distribution, and lifestyle patterns.",
    businessImpact:
      "Trying to sell high-end gourmet sushi in a conservative traditional vegetarian tier-3 town will fail regardless of low rent.",
    expansionIqContext:
      "Weighed differently per category in `scoring.py` (e.g. 20% for Fashion, 15% for Grocery).",
    proTip:
      "Adapt your product mix to the local culture (e.g. offering regional delicacies alongside continental cafe items in Kolhapur).",
    relatedTerms: ["Demand Score", "Composite Viability Score"],
  },
  {
    keywords: ["factor weights", "scoring weights", "category weights"],
    term: "Factor Weights",
    category: "market",
    shortDefinition: "The percentage importance assigned to each of the 5 analytical factors based on business category.",
    fullDefinition:
      "ExpansionIQ does not use one-size-fits-all scoring. For Grocery, Demand (30%) and Accessibility (25%) dominate. For Fashion, Category Fit (20%) and Competition Opportunity (20%) carry higher weight.",
    businessImpact:
      "Ensures that your expansion ranking reflects the unique operational realities of your specific sector.",
    expansionIqContext:
      "Defined in `CATEGORY_WEIGHTS` in `backend/app/services/scoring.py` and displayed in Tab 04 Market Factors.",
    proTip:
      "Check the factor weights table to understand what drives your category's viability ranking.",
    relatedTerms: ["Composite Viability Score", "Category Fit Score"],
  },
  {
    keywords: ["nearest competitor", "competitor distance", "competitor proximity"],
    term: "Nearest Competitor Proximity",
    category: "market",
    shortDefinition: "The straight-line or walking distance (in km) to the closest direct competing store.",
    fullDefinition:
      "Calculated using the Haversine distance formula between your candidate store coordinates and mapped competitor locations in the micro-market.",
    businessImpact:
      "A competitor directly next door (<100m) splits walk-in impulse footfall. A distance >1.5 km indicates a protected micro-catchment territory.",
    expansionIqContext:
      "Displayed in Tab 05 Competitor Intelligence alongside competitor cluster pins on the map.",
    proTip:
      "In high-density retail streets (like Rajarampuri), being near competitors can actually help by creating a retail destination hub.",
    relatedTerms: ["Competitor Saturation Index", "Primary & Secondary Trade Catchment"],
  },

  // =========================================================================
  // 3. GEOSPATIAL, DEMOGRAPHIC & REAL ESTATE TERMS
  // =========================================================================
  {
    keywords: ["catchment", "trade area", "primary catchment", "secondary catchment"],
    term: "Primary & Secondary Trade Catchment",
    category: "geospatial",
    shortDefinition: "The geographic zone around your store from which 90%+ of your customer footfall originates.",
    fullDefinition:
      "Primary Catchment (2–3 km radius or 10-minute commute) delivers 65% to 75% of regular repeat footfall. Secondary Catchment (5–10 km radius) brings weekend and destination shoppers.",
    businessImpact:
      "Indian shoppers rarely cross major physical obstacles (railway tracks, busy unbridged highways, rivers) for daily items. Your primary catchment must hold enough target customers on its own.",
    expansionIqContext:
      "Drawn as concentric circles on the Geospatial Map (Tab 02): 5 km Primary Trade Area (gold dashed ring) and 10 km Commuter Area (cyan ring).",
    proTip:
      "Inspect pedestrian crossings and road dividers. A store across an uncrossable 6-lane highway effectively loses 50% of its catchment.",
    relatedTerms: ["Population Density", "Transit & Connectivity Score"],
  },
  {
    keywords: ["population density", "urban core density", "density per sq km"],
    term: "Population Density (per sq. km)",
    category: "geospatial",
    shortDefinition: "The concentration of residents and daytime office workers living or working within one square kilometer.",
    fullDefinition:
      "Derived from Census 2011 indicators and GeoNames gazetteer data. Urban core density (>14,000/km² in cities like Mumbai, Pune, Kolhapur) represents intense pedestrian concentration.",
    businessImpact:
      "High density generates organic walk-in footfall without expensive paid advertising. Low density forces you to rely heavily on home delivery or destination events.",
    expansionIqContext:
      "Represented on the map by glowing 2.8 km Core Urban Density circles (coral for Tier-1 >15,000/km², amber for Tier-2).",
    proTip:
      "Differentiate between daytime office density (lunch rush) and evening residential density (dinner and weekend shopping).",
    relatedTerms: ["Primary & Secondary Trade Catchment", "Census of India 2011"],
  },
  {
    keywords: ["carpet area", "built up area", "super built up", "usable area"],
    term: "Carpet Area vs Built-Up Area",
    category: "realestate",
    shortDefinition: "The actual usable floor space inside your walls vs the larger area billed by the landlord.",
    fullDefinition:
      "Carpet Area is the net usable floor area you can lay a carpet on. Built-up area includes outer walls and columns. Super built-up includes shared lobbies, staircases, and elevator shafts (often 25–35% larger).",
    businessImpact:
      "Landlords frequently quote rent on super built-up area. If you don't insist on carpet area, you will pay commercial rent on empty lobby air.",
    expansionIqContext:
      "ExpansionIQ's high-chance opportunity sites (Rajarampuri, Shahupuri, Tarabai Park) explicitly disclose verified carpet area and built-up area.",
    proTip:
      "Always measure the internal perimeter with a laser distance meter before signing a commercial lease agreement.",
    relatedTerms: ["Commercial Frontage", "Monthly Rent per sq. ft"],
  },
  {
    keywords: ["frontage", "commercial frontage", "storefront width", "glass frontage"],
    term: "Commercial Frontage (Width in Feet)",
    category: "realestate",
    shortDefinition: "The physical width of your store's street-facing glass window display.",
    fullDefinition:
      "The linear horizontal width of your store directly visible to passing pedestrians and vehicular traffic on the high street.",
    businessImpact:
      "A store with 35+ feet wide glass frontage achieves 40% higher walk-in conversion than a narrow 12-foot 'tunnel' store hidden behind building pillars.",
    expansionIqContext:
      "Documented in ExpansionIQ's site dossiers (e.g. Rajarampuri 34 ft frontage, Shahupuri 42 ft dual-street frontage).",
    proTip:
      "Wide frontage acts as a permanent free billboard. Never compromise on storefront visibility for slightly cheaper rent.",
    relatedTerms: ["Carpet Area vs Built-Up Area", "High-Chance Prime Opportunity Site"],
  },
  {
    keywords: ["prime site", "opportunity site", "high chance site", "kolhapur site"],
    term: "High-Chance Prime Opportunity Site",
    category: "realestate",
    shortDefinition: "A pre-vetted commercial high-street location with verified property availability and high success odds.",
    fullDefinition:
      "A micro-market location analyzed for high pedestrian traffic, favorable rent-to-revenue ratios, verified vacancy status, and structural suitability for business launch.",
    businessImpact:
      "Takes the guesswork out of site scouting by highlighting specific commercial avenues with ready-to-lease properties.",
    expansionIqContext:
      "Marked on the map with glowing radar pulse badges (⭐ 94% PRIME) in Kolhapur (Rajarampuri, Shahupuri, Tarabai Park, Mahalaxmi Corridor) complete with street photographs.",
    proTip:
      "Hover over any opportunity pin to read the 4 analytical reasons why it was chosen, and click it to inspect the real building photograph.",
    relatedTerms: ["Commercial Frontage", "Carpet Area vs Built-Up Area"],
  },
  {
    keywords: ["commercial zoning", "zoning", "land use", "commercial arcade"],
    term: "Commercial Zoning & Land Use",
    category: "realestate",
    shortDefinition: "The municipal legal classification allowing commercial retail and food operations on the property.",
    fullDefinition:
      "Ensures the building holds sanctioned municipal commercial permits (Shop & Establishment / Trade License eligible) rather than illegal residential conversion.",
    businessImpact:
      "Opening a retail business in an unauthorized residential zone risks sudden municipal sealing or closure notices.",
    expansionIqContext:
      "Detailed in the land availability dossier of each opportunity site (e.g. Commercial High-Street Retail).",
    proTip:
      "Always inspect the municipal Occupancy Certificate (OC) and sanctioned commercial floor plan before paying lease deposits.",
    relatedTerms: ["Lease Tenure & Security Deposit", "High-Chance Prime Opportunity Site"],
  },
  {
    keywords: ["lease tenure", "security deposit", "lease agreement", "lock in period"],
    term: "Lease Tenure & Security Deposit",
    category: "realestate",
    shortDefinition: "The contracted duration of your commercial lease and the refundable upfront deposit paid to the landlord.",
    fullDefinition:
      "Commercial leases in India typically run for 3 to 5 years with a 1 to 3 year lock-in period. Security deposits range from 4 to 6 months of rent.",
    businessImpact:
      "High security deposits tie up valuable working capital. Strict lock-in periods penalize you if the location fails early.",
    expansionIqContext:
      "Factored into Capex setup calculations (15% of budget) and detailed in each opportunity site dossier.",
    proTip:
      "Negotiate a 15% rent escalation clause every 3 years rather than 5% every single year, and cap lock-in at 12 months.",
    relatedTerms: ["Capex (Capital Expenditure)", "Monthly Rent per sq. ft"],
  },
  {
    keywords: ["rent per sq ft", "rental rate", "commercial rent"],
    term: "Monthly Rent per sq. ft",
    category: "realestate",
    shortDefinition: "The normalized monthly lease cost divided by usable floor area.",
    fullDefinition:
      "Calculated as Total Monthly Rent ÷ Carpet Area. Enables fair cost comparison between different properties and cities.",
    businessImpact:
      "Allows you to evaluate whether a ₹1,20,000/mo shop is actually cheaper per square foot than a ₹90,000/mo shop.",
    expansionIqContext:
      "Displayed across all opportunity site dossiers (e.g. ₹85/sq.ft in Rajarampuri vs ₹72/sq.ft in Shahupuri).",
    proTip:
      "Benchmark rent per sq.ft against average retail sales per sq.ft. Your rent should stay under 15% of gross sales per sq.ft.",
    relatedTerms: ["Carpet Area vs Built-Up Area", "Opex (Operating Expenses)"],
  },

  // =========================================================================
  // 4. DATA INTEGRITY, GEOGRAPHY & ENGINE TERMS
  // =========================================================================
  {
    keywords: ["geonames", "gazetteer", "geonames gazetteer", "place names"],
    term: "GeoNames Gazetteer",
    category: "data",
    shortDefinition: "The authoritative geographical database containing verified Indian cities, coordinates, and populations.",
    fullDefinition:
      "An open-access global geographical database licensed under CC BY 4.0. ExpansionIQ indexes 7,326+ Indian populated places, cities, towns, and administrative seats.",
    businessImpact:
      "Guarantees that your expansion analysis is grounded in real geographical entities rather than invented map pins.",
    expansionIqContext:
      "Queried in real-time during candidate city selection and used to plot precise WGS84 latitude and longitude coordinates.",
    proTip:
      "Type city names in the autocomplete box to auto-fill verified GeoNames coordinates and historical populations.",
    relatedTerms: ["WGS84 Coordinates", "Census of India 2011"],
  },
  {
    keywords: ["wgs84", "coordinates", "latitude", "longitude", "gps"],
    term: "WGS84 Coordinates",
    category: "data",
    shortDefinition: "The global standard GPS coordinate system (latitude and longitude) used to locate places on Earth.",
    fullDefinition:
      "World Geodetic System 1984. The standard coordinate reference frame used by GPS, Leaflet, OpenStreetMap, and Google Maps.",
    businessImpact:
      "Ensures exact spatial accuracy down to the meter for site scouting, competitor tracking, and transit corridors.",
    expansionIqContext:
      "Stored for all candidate cities, competitor locations, and opportunity sites in ExpansionIQ's SQLite database.",
    proTip:
      "WGS84 decimal coordinates (e.g. 16.6965°N, 74.2432°E for Rajarampuri) can be pasted straight into Google Maps on your phone for on-ground site visits.",
    relatedTerms: ["GeoNames Gazetteer", "Haversine Distance"],
  },
  {
    keywords: ["feature code", "ppl", "ppla", "ppla2", "geonames feature"],
    term: "GeoNames Feature Codes (PPL, PPLA, PPLA2)",
    category: "data",
    shortDefinition: "Standard administrative hierarchy tags categorizing town size and political status.",
    fullDefinition:
      "PPL = Populated Place (town/village); PPLA = First-Order Administrative Seat (State Capital like Mumbai or Bengaluru); PPLA2 = Second-Order Administrative Seat (District Headquarters like Pune or Kolhapur).",
    businessImpact:
      "Helps you distinguish between a primary district headquarters with deep commercial infrastructure vs a tiny satellite village with the same name.",
    expansionIqContext:
      "Stored in `GeographicPlace.feature_code` in the database to prioritize major economic urban centers.",
    proTip:
      "When comparing tier-2 locations, prioritize PPLA and PPLA2 district centers for established banking and logistics connectivity.",
    relatedTerms: ["GeoNames Gazetteer", "geoBoundaries ADM2"],
  },
  {
    keywords: ["census", "census 2011", "census of india", "official population"],
    term: "Census of India 2011 Indicators",
    category: "data",
    shortDefinition: "Official Government of India demographic baseline records covering population and literacy.",
    fullDefinition:
      "The official decennial census conducted by the Office of the Registrar General & Census Commissioner, India. ExpansionIQ indexes 3,319+ verified district and sub-district records.",
    businessImpact:
      "Provides an unmanipulated demographic foundation for verifying urban catchment size and regional consumer scale.",
    expansionIqContext:
      "Displayed on Tab 04 Market Factors and Census Population panels as historical context badges.",
    proTip:
      "Combine Census 2011 baseline figures with contemporary urban growth multipliers to gauge current commercial market size.",
    relatedTerms: ["GeoNames Gazetteer", "District Crosswalk"],
  },
  {
    keywords: ["geoboundaries", "adm2", "district boundary", "shapefile"],
    term: "geoBoundaries ADM2 Boundaries",
    category: "data",
    shortDefinition: "Open-source standardized polygon boundaries representing India's 735+ administrative districts.",
    fullDefinition:
      "An open cartographic boundary dataset tracking second-order administrative district borders (ADM2) across India, maintained by the William & Mary geoBoundaries lab.",
    businessImpact:
      "Prevents geographic ambiguity by visualizing the exact administrative jurisdiction and commercial boundaries of each region.",
    expansionIqContext:
      "Stored in the database and rendered on the map when the 'Districts' layer toggle is activated.",
    proTip:
      "District borders matter for state licensing, local municipal taxes, and regional distribution hub planning.",
    relatedTerms: ["District Crosswalk", "WGS84 Coordinates"],
  },
  {
    keywords: ["district crosswalk", "crosswalk", "spatial crosswalk"],
    term: "District Crosswalk",
    category: "data",
    shortDefinition: "The automated spatial algorithm linking GeoNames towns to Census records and district borders.",
    fullDefinition:
      "A database indexing bridge connecting GeoNames city points with corresponding Census 2011 demographic indicators and geoBoundaries ADM2 district polygons.",
    businessImpact:
      "Eliminates data silos so that typing a city name instantly pulls demographic statistics, boundary maps, and coordinates together.",
    expansionIqContext:
      "Engineered in `app/services/district_crosswalk.py` and tested across 7,326+ settlement records.",
    proTip:
      "Crosswalk verification ensures that historical census figures match the modern town's administrative jurisdiction.",
    relatedTerms: ["GeoNames Gazetteer", "Census of India 2011", "geoBoundaries ADM2"],
  },
  {
    keywords: ["haversine", "haversine distance", "straight line distance"],
    term: "Haversine Distance",
    category: "data",
    shortDefinition: "The mathematical formula calculating the exact distance between two GPS coordinates across the curved surface of Earth.",
    fullDefinition:
      "An angular trigonometric formula that computes straight-line spherical distance in kilometers between two latitude/longitude pairs.",
    businessImpact:
      "Used to measure precise spacing between candidate retail sites and competitors to prevent self-cannibalization.",
    expansionIqContext:
      "Implemented in `app/services/geo_analysis.py` to calculate nearest competitor distance and trade catchment radii.",
    proTip:
      "Remember that straight-line Haversine distance is 20–30% shorter than actual road travel distance due to traffic turns.",
    relatedTerms: ["WGS84 Coordinates", "Nearest Competitor Proximity"],
  },
  {
    keywords: ["synthetic", "simulated", "demo mode", "deterministic simulation"],
    term: "Synthetic / Simulated Demo Estimates",
    category: "data",
    shortDefinition: "Stable mathematical simulation models used when live primary survey data is pending.",
    fullDefinition:
      "ExpansionIQ's transparent modeling engine. When verified field records are unavailable, it generates stable, repeatable estimates clearly labeled as demo simulation.",
    businessImpact:
      "Allows founders to test workflows and assumptions without misleading investors into believing synthetic numbers are empirical field measurements.",
    expansionIqContext:
      "Every demo analysis displays a prominent synthetic disclosure badge adhering to ExpansionIQ's Evidence-First rule.",
    proTip:
      "Always replace synthetic estimates with your own verified quotes (for rent, fit-out, and staffing) before signing legal lease contracts.",
    relatedTerms: ["Verified Records", "Evidence-First Methodology"],
  },
  {
    keywords: ["verified records", "verified status", "source status"],
    term: "Verified Records vs User-Provided",
    category: "data",
    shortDefinition: "Data labels identifying whether a number came from empirical government/field data or user input.",
    fullDefinition:
      "ExpansionIQ tags all data points with source status: 'Verified' (government census/GeoNames), 'User-Provided' (entered by you), or 'Simulated' (mathematical benchmark).",
    businessImpact:
      "Ensures transparent corporate governance and institutional credibility during board meetings and bank loan applications.",
    expansionIqContext:
      "Color-coded source status badges appear across Market Factors (Tab 04) and the Feasibility PDF Report.",
    proTip:
      "Always check the source status badge next to a market score before committing significant capital.",
    relatedTerms: ["Synthetic / Simulated Demo Estimates", "Evidence-First Methodology"],
  },
  {
    keywords: ["pdf report", "feasibility report", "download report", "20 section report"],
    term: "20-Section Business Feasibility Report (PDF)",
    category: "data",
    shortDefinition: "An institutional-grade downloadable PDF document summarizing the complete expansion study.",
    fullDefinition:
      "A 20-section publication-ready report generated by ReportLab featuring Executive Summary, Market Opportunity, Financial Forecasts, Risk Matrices, and Implementation Roadmaps.",
    businessImpact:
      "Ready to be handed directly to bank loan officers, franchise partners, angel investors, or corporate boards for expansion approval.",
    expansionIqContext:
      "Available via the 'Download Business Feasibility Report (PDF)' button on Tab 07 of ExpansionIQ Results.",
    proTip:
      "Print or export the PDF report before conducting on-ground field site visits to keep key financial benchmarks in hand.",
    relatedTerms: ["Composite Viability Score", "Scenario Analysis"],
  },
  {
    keywords: ["evidence first", "methodology", "data integrity"],
    term: "Evidence-First Methodology",
    category: "data",
    shortDefinition: "ExpansionIQ's core principle of never fabricating fake empirical data and disclosing assumptions.",
    fullDefinition:
      "A rigorous architectural rule ensuring that missing data remains explicitly visible, synthetic estimates are disclosed, and verified records are preserved.",
    businessImpact:
      "Protects entrepreneurs from making multi-lakh investment mistakes based on hidden 'black-box' hallucinations.",
    expansionIqContext:
      "Embedded in the sidebar footer ('Evidence First • Missing data stays visible') and throughout backend schemas.",
    proTip:
      "Treat feasibility analyses as decision-support models to stress-test your thesis, not absolute guarantees of future profit.",
    relatedTerms: ["Synthetic / Simulated Demo Estimates", "Verified Records"],
  },
];

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  termMatch?: GlossaryTerm;
  timestamp: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: "👋 Welcome to the **ExpansionIQ Knowledge Copilot**!\n\nI am indexed with **every business, financial, geospatial, and real estate term** present on our website (over 50+ concepts).\n\nAsk me any term or question (e.g. *What is Cash Runway?*, *Explain Break-Even*, *Capex vs Opex*, *What does Catchment mean?*, *Saturation Index*, *ADM2*, *WGS84*) to see what it means and how it affects your business!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  // Filtered glossary list for directory browsing
  const filteredGlossary = useMemo(() => {
    return COMPREHENSIVE_GLOSSARY.filter((t) => {
      const matchCat = selectedCategory === "all" || t.category === selectedCategory;
      const matchSearch =
        !searchTerm.trim() ||
        t.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.keywords.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchTerm]);

  // Robust NLP search matching query against keywords and term titles
  function findMatchingTerm(query: string): GlossaryTerm | null {
    const clean = query.toLowerCase().trim();
    if (!clean) return null;

    // 1. Direct Term Name Match
    for (const term of COMPREHENSIVE_GLOSSARY) {
      if (clean === term.term.toLowerCase() || clean.includes(term.term.toLowerCase())) {
        return term;
      }
    }

    // 2. Keyword exact match
    for (const term of COMPREHENSIVE_GLOSSARY) {
      for (const kw of term.keywords) {
        if (clean === kw || clean.includes(kw)) {
          return term;
        }
      }
    }

    // 3. Multi-word fuzzy token search
    const words = clean.split(/[\s,?.!-]+/).filter((w) => w.length > 2);
    let bestMatch: GlossaryTerm | null = null;
    let maxScore = 0;

    for (const term of COMPREHENSIVE_GLOSSARY) {
      let score = 0;
      for (const word of words) {
        if (term.term.toLowerCase().includes(word)) score += 3;
        for (const kw of term.keywords) {
          if (kw.includes(word)) score += 2;
        }
        if (term.shortDefinition.toLowerCase().includes(word)) score += 1;
      }
      if (score > maxScore) {
        maxScore = score;
        bestMatch = term;
      }
    }

    if (maxScore >= 2) return bestMatch;
    return null;
  }

  function handleSend(textToSend?: string) {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      const match = findMatchingTerm(text);

      let botResponseText = "";
      if (match) {
        botResponseText = `Here is the comprehensive breakdown for **${match.term}**:`;
      } else {
        botResponseText = `I couldn't identify the exact term from "${text}".\n\nYou can browse our master glossary below or ask about any of our core areas:\n• **Financial**: *Cash Runway*, *Break-Even*, *Capex vs Opex*, *Gross Margin*, *Payback*\n• **Market Scoring**: *Composite Score*, *Demand*, *Competitor Saturation*, *Cost Viability*\n• **Geospatial & Real Estate**: *Trade Catchment*, *Population Density*, *Carpet vs Built-Up*, *Frontage*\n• **Data Engine**: *GeoNames*, *Census 2011*, *WGS84*, *ADM2 Boundaries*, *Feasibility PDF*`;
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: botResponseText,
        termMatch: match || undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 380);
  }

  const categoryChips = [
    { id: "all", label: "All Terms (52)" },
    { id: "financial", label: "💰 Financial & P&L" },
    { id: "market", label: "🎯 Market Opportunity" },
    { id: "geospatial", label: "🗺️ Geospatial & Density" },
    { id: "realestate", label: "🏢 Real Estate & Store" },
    { id: "data", label: "📑 Data & Methodology" },
  ];

  return (
    <>
      {/* FLOATING LAUNCHER BUTTON */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open ExpansionIQ Chatbot Copilot"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9000,
            background: "linear-gradient(135deg, #0B1220 0%, #172235 100%)",
            border: "1.5px solid #D6B36A",
            borderRadius: "50px",
            padding: "10px 18px",
            color: "#FFFFFF",
            boxShadow: "0 8px 30px rgba(0,0,0,0.6), 0 0 16px rgba(214, 179, 106, 0.4)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px) scale(1.03)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
          }}
        >
          <div
            style={{
              position: "relative",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #D6B36A 0%, #B89248 100%)",
              color: "#0B1220",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "14px",
            }}
          >
            <Bot size={18} />
            <span
              style={{
                position: "absolute",
                top: "-2px",
                right: "-2px",
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: "#10B981",
                border: "2px solid #0B1220",
              }}
            />
          </div>

          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#F8FAFC", display: "flex", alignItems: "center", gap: "4px" }}>
              <span>IQ Copilot</span>
              <span style={{ fontSize: "9px", background: "rgba(214, 179, 106, 0.2)", color: "#D6B36A", padding: "1px 5px", borderRadius: "3px" }}>
                52 Terms
              </span>
            </div>
            <div style={{ fontSize: "10px", color: "#94A3B8" }}>Clarify website terms & business impact</div>
          </div>
        </button>
      )}

      {/* CHATBOT DRAWER / MODAL */}
      {isOpen && (
        <div
          role="complementary"
          aria-label="ExpansionIQ Business Terminology Copilot"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            width: "480px",
            maxWidth: "calc(100vw - 32px)",
            height: "700px",
            maxHeight: "calc(100vh - 48px)",
            background: "#0E1626",
            border: "1px solid #D6B36A",
            borderRadius: "14px",
            boxShadow: "0 18px 50px rgba(0,0,0,0.85), 0 0 25px rgba(214, 179, 106, 0.25)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px",
              background: "linear-gradient(135deg, #0B1220 0%, #172235 100%)",
              borderBottom: "1px solid rgba(214, 179, 106, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #D6B36A 0%, #B89248 100%)",
                  color: "#0B1220",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <strong style={{ fontSize: "14px", color: "#FFFFFF", display: "flex", alignItems: "center", gap: "6px" }}>
                  ExpansionIQ Copilot
                  <span style={{ fontSize: "9px", background: "#10B981", color: "#0B1220", padding: "1px 6px", borderRadius: "10px", fontWeight: 800 }}>
                    52 TERMS INDEXED
                  </span>
                </strong>
                <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                  Explains each term and its real business impact
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <button
                type="button"
                onClick={() => {
                  setMessages([
                    {
                      id: "welcome-reset",
                      sender: "bot",
                      text: "Chat cleared. What business, financial, or geospatial term on our website would you like me to explain?",
                      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    },
                  ]);
                }}
                title="Reset conversation"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748B",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "4px",
                }}
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94A3B8",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "4px",
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Category Filter Chips Bar */}
          <div
            style={{
              padding: "8px 12px",
              background: "rgba(11, 18, 32, 0.75)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
              display: "flex",
              gap: "6px",
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {categoryChips.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    background: isSelected ? "#D6B36A" : "rgba(255, 255, 255, 0.05)",
                    border: isSelected ? "1px solid #D6B36A" : "1px solid rgba(214, 179, 106, 0.2)",
                    borderRadius: "20px",
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? "#0B1220" : "#D6B36A",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Quick Term Directory Bar (Horizontal Scroll) */}
          <div
            style={{
              padding: "6px 12px",
              background: "rgba(11, 18, 32, 0.5)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
              display: "flex",
              gap: "6px",
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {filteredGlossary.slice(0, 10).map((t) => (
              <button
                key={t.term}
                type="button"
                onClick={() => handleSend(`Explain ${t.term}`)}
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid #29364A",
                  borderRadius: "14px",
                  padding: "3px 8px",
                  fontSize: "10.5px",
                  color: "#CBD5E1",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#D6B36A";
                  e.currentTarget.style.color = "#D6B36A";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#29364A";
                  e.currentTarget.style.color = "#CBD5E1";
                }}
              >
                {t.term}
              </button>
            ))}
          </div>

          {/* Message History Container */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isUser ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      maxWidth: "92%",
                      flexDirection: isUser ? "row-reverse" : "row",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: isUser ? "#3B82F6" : "#D6B36A",
                        color: "#0B1220",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: "12px",
                        marginTop: "2px",
                      }}
                    >
                      {isUser ? <User size={15} color="#FFF" /> : <Bot size={15} />}
                    </div>

                    <div
                      style={{
                        background: isUser ? "#1E3A8A" : "#131D31",
                        border: isUser ? "1px solid #3B82F6" : "1px solid #29364A",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        color: "#F8FAFC",
                        fontSize: "12.5px",
                        lineHeight: "1.5",
                        whiteSpace: "pre-line",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                      }}
                    >
                      {msg.text}

                      {/* Detailed Term Breakdown Card if Term Match Exists */}
                      {msg.termMatch && (
                        <div
                          style={{
                            marginTop: "12px",
                            padding: "12px",
                            background: "rgba(11, 18, 32, 0.85)",
                            borderRadius: "8px",
                            border: "1px solid rgba(214, 179, 106, 0.4)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                          }}
                        >
                          {/* 1. What It Means */}
                          <div>
                            <span style={{ fontSize: "10px", fontWeight: 800, color: "#D6B36A", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px" }}>
                              <BookOpen size={11} /> 1. Plain-English Meaning
                            </span>
                            <p style={{ margin: "4px 0 0 0", color: "#F8FAFC", fontSize: "12px", lineHeight: "1.5" }}>
                              {msg.termMatch.fullDefinition}
                            </p>
                          </div>

                          {/* 2. Business Impact */}
                          <div style={{ background: "rgba(239, 68, 68, 0.08)", borderLeft: "3px solid #EF4444", padding: "8px 10px", borderRadius: "3px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 800, color: "#F87171", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px" }}>
                              <ShieldAlert size={12} /> 2. How It Affects Your Business Overall
                            </span>
                            <p style={{ margin: "4px 0 0 0", color: "#E2E8F0", fontSize: "11.5px", lineHeight: "1.5" }}>
                              {msg.termMatch.businessImpact}
                            </p>
                          </div>

                          {/* 3. In ExpansionIQ Website */}
                          <div style={{ background: "rgba(56, 189, 248, 0.08)", borderLeft: "3px solid #38BDF8", padding: "8px 10px", borderRadius: "3px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 800, color: "#38BDF8", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Layers size={11} /> 3. Where It Is Used in ExpansionIQ
                            </span>
                            <p style={{ margin: "4px 0 0 0", color: "#CBD5E1", fontSize: "11.5px", lineHeight: "1.5" }}>
                              {msg.termMatch.expansionIqContext}
                            </p>
                          </div>

                          {/* 4. Founder's Golden Rule */}
                          <div style={{ background: "rgba(16, 185, 129, 0.08)", borderLeft: "3px solid #10B981", padding: "8px 10px", borderRadius: "3px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 800, color: "#34D399", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Lightbulb size={12} /> 4. Founder's Golden Rule / Benchmark
                            </span>
                            <p style={{ margin: "4px 0 0 0", color: "#CBD5E1", fontSize: "11.5px", lineHeight: "1.5" }}>
                              {msg.termMatch.proTip}
                            </p>
                          </div>

                          {/* Related Term Buttons */}
                          {msg.termMatch.relatedTerms.length > 0 && (
                            <div style={{ marginTop: "4px", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                              <span style={{ fontSize: "10px", color: "#94A3B8" }}>Explore Related Terms:</span>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                                {msg.termMatch.relatedTerms.map((rt, rIdx) => (
                                  <button
                                    key={rIdx}
                                    type="button"
                                    onClick={() => handleSend(`Tell me about ${rt}`)}
                                    style={{
                                      background: "rgba(255,255,255,0.05)",
                                      border: "1px solid #334155",
                                      borderRadius: "12px",
                                      padding: "3px 8px",
                                      fontSize: "10.5px",
                                      color: "#D6B36A",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {rt} →
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: "10px", color: "#64748B", marginTop: "3px", marginRight: isUser ? "36px" : "0", marginLeft: isUser ? "0" : "36px" }}>
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {isTyping && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "#D6B36A",
                    color: "#0B1220",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Bot size={15} />
                </div>
                <div
                  style={{
                    background: "#131D31",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    color: "#94A3B8",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>Searching master glossary</span>
                  <span style={{ animation: "pulse 1s infinite" }}>...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: "12px 14px",
              background: "rgba(11, 18, 32, 0.95)",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask any term (e.g. 'cogs', 'adm2', 'runway', 'saturation')..."
              style={{
                flex: 1,
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "9px 12px",
                color: "#FFFFFF",
                fontSize: "12.5px",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#D6B36A")}
              onBlur={(e) => (e.target.style.borderColor = "#334155")}
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              aria-label="Send message"
              style={{
                background: inputValue.trim()
                  ? "linear-gradient(135deg, #D6B36A 0%, #B89248 100%)"
                  : "#1E293B",
                color: inputValue.trim() ? "#0B1220" : "#64748B",
                border: "none",
                borderRadius: "8px",
                padding: "9px 14px",
                cursor: inputValue.trim() ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
