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
} from "lucide-react";

interface GlossaryTerm {
  keywords: string[];
  term: string;
  category: "financial" | "geospatial" | "market" | "operational";
  shortDefinition: string;
  fullDefinition: string;
  businessImpact: string;
  expansionIqContext: string;
  proTip: string;
  relatedTerms: string[];
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    keywords: ["cash runway", "runway", "cash", "working capital months"],
    term: "Cash Runway",
    category: "financial",
    shortDefinition: "The number of months your business can survive before running out of funds.",
    fullDefinition:
      "Cash Runway represents the number of months your retail store can continue operations before depleting its cash reserves, assuming monthly expenses exceed revenues or during early customer ramp-up.",
    businessImpact:
      "Running out of cash runway is the #1 cause of new retail failure. Even a fundamentally viable business can be forced into bankruptcy if initial customer ramp-up takes 5 months while the owner only had 2 months of operating cash reserve.",
    expansionIqContext:
      "In ExpansionIQ's Financial Forecast tab, cash runway is calculated as (Working Capital Reserve ÷ Monthly Operating Deficit). A runway above 12 months signifies healthy buffer, while under 4 months triggers a high-risk liquidity warning.",
    proTip:
      "Always set aside at least 20% of your total initial budget as an untouched liquid working capital reserve to maintain a minimum 6-to-9 month cash runway.",
    relatedTerms: ["Break-Even Period", "Capex", "Working Capital Reserve"],
  },
  {
    keywords: ["break even", "breakeven", "break-even", "break even revenue", "break even months"],
    term: "Break-Even Period & Revenue",
    category: "financial",
    shortDefinition: "The point where total revenue exactly equals total operating expenses (zero profit, zero loss).",
    fullDefinition:
      "Break-even revenue is the exact monthly sales threshold required to pay for cost of goods, rent, staff payroll, utilities, and marketing with nothing left over. The break-even period is how many months it takes your business to reach that monthly sales level.",
    businessImpact:
      "Until your store crosses the break-even line, you are burning your own capital every single day. A lower break-even revenue means lower operational risk and faster transition into self-sustaining profitability.",
    expansionIqContext:
      "ExpansionIQ plots the 12-month P&L trajectory and displays a green intercept line where monthly gross profit overtakes monthly operating expenses, giving you the exact estimated break-even month.",
    proTip:
      "For cafes and retail stores, aim for a break-even period within 4 to 8 months. If break-even requires more than 14 months, negotiate lower rent or reduce staffing overhead.",
    relatedTerms: ["Cash Runway", "Gross Margin", "Opex"],
  },
  {
    keywords: ["capex", "capital expenditure", "startup cost", "fit out", "fitout"],
    term: "Capex (Capital Expenditure)",
    category: "financial",
    shortDefinition: "Upfront one-time money spent to set up and launch the store before opening day.",
    fullDefinition:
      "Capex includes interior civil work, electricals, HVAC, flooring, kitchen/counter equipment, commercial signage, lease security deposits, and opening inventory.",
    businessImpact:
      "Capex does not repeat monthly, but overspending on Capex starves your working capital. If you blow 90% of your budget on opulent decor, you won't have funds left for staff payroll and inventory during slow initial months.",
    expansionIqContext:
      "ExpansionIQ's Financial Forecast view visualizes Capex as an interactive donut chart breaking down Fit-out & Equipment (35%), Initial Inventory (30%), Security Deposit (15%), and Working Capital Reserve (20%).",
    proTip:
      "Never commit more than 75% of your total available capital to upfront Capex. Keep at least 25% liquid for working capital and unexpected setup overruns.",
    relatedTerms: ["Opex", "Payback Period", "Working Capital Reserve"],
  },
  {
    keywords: ["opex", "operating expense", "monthly expense", "fixed costs"],
    term: "Opex (Operating Expenses)",
    category: "financial",
    shortDefinition: "Ongoing recurring expenses paid every month to keep the business operational.",
    fullDefinition:
      "Opex includes monthly commercial store rent, staff payroll, electricity and water utilities, local marketing, inventory restocking, and maintenance.",
    businessImpact:
      "Fixed Opex (like expensive rent) cannot easily be lowered during bad monsoon months or festival slowdowns. Keeping fixed Opex low allows a store to remain profitable even when customer footfall fluctuates.",
    expansionIqContext:
      "ExpansionIQ models city-specific Opex based on local rent benchmarks (e.g. ₹60–₹160/sq.ft/mo) and category staffing models (₹22,000/employee/month) to calculate your true monthly burn rate.",
    proTip:
      "Commercial store rent should ideally never exceed 12% to 15% of your projected monthly revenue for food businesses, or 8% to 10% for retail stores.",
    relatedTerms: ["Capex", "Gross Margin", "Break-Even Period & Revenue"],
  },
  {
    keywords: ["gross margin", "margin", "gross profit", "cogs", "cost of goods"],
    term: "Gross Margin",
    category: "financial",
    shortDefinition: "The percentage of sales left after paying for the direct raw materials or wholesale products sold.",
    fullDefinition:
      "Gross Margin is calculated as: ((Revenue - Cost of Goods Sold) ÷ Revenue) × 100. It measures the fundamental profitability of what you sell before store rent and staff salaries are deducted.",
    businessImpact:
      "High gross margin categories (e.g. Cafes at 65%–75%, Fashion at 50%–60%) can afford premium prime high-street rent because every customer transaction leaves substantial profit. Low gross margin categories (e.g. Grocery at 22%–28%) require massive sales volume to cover overhead.",
    expansionIqContext:
      "ExpansionIQ automatically applies industry-standard gross margins for 10 categories (e.g. 70% for Cafes, 32% for Electronics, 55% for Salons) when forecasting monthly gross profit.",
    proTip:
      "Protect your gross margin by monitoring food wastage, supplier pricing agreements, and theft. A 3% drop in gross margin can wipe out 30% of your bottom-line net profit.",
    relatedTerms: ["Opex", "Break-Even Period & Revenue"],
  },
  {
    keywords: ["catchment", "catchment area", "trade area", "primary catchment", "secondary catchment"],
    term: "Primary & Secondary Trade Catchment",
    category: "geospatial",
    shortDefinition: "The geographical boundary surrounding your store from where customer footfall is drawn.",
    fullDefinition:
      "The Primary Catchment (typically a 2–3 km radius or 10-minute walk/scooter ride) provides 65% to 75% of your regular repeat customer base. The Secondary Catchment (5–10 km radius) provides occasional and weekend visitors.",
    businessImpact:
      "In India, brick-and-mortar customers will rarely cross major physical barriers (railway tracks, busy highways without flyovers, or rivers) for daily purchases. Your primary catchment must hold enough target customers on its own.",
    expansionIqContext:
      "On the ExpansionIQ Geospatial Map, concentric rings are drawn: a 2.8 km Core Urban Density Zone (magenta/amber), a 5 km Primary Catchment (gold dashed ring), and a 10 km Commuter Trade Area (cyan).",
    proTip:
      "Evaluate foot barriers like highway dividers or steep grade changes. A store 1 km away on the wrong side of an uncrossed arterial road effectively cuts off 50% of your primary catchment.",
    relatedTerms: ["Population Density", "Transit & Connectivity Index"],
  },
  {
    keywords: ["population density", "density", "urban core density", "demographics"],
    term: "Population Density (per sq. km)",
    category: "geospatial",
    shortDefinition: "The number of residents and daytime workers concentrated within each square kilometer.",
    fullDefinition:
      "A measure of customer concentration around the site. High urban core density (>15,000 people/km² in cities like Mumbai, Pune, and Kolhapur commercial wards) indicates dense residential and commercial mass.",
    businessImpact:
      "High density generates organic walk-in pedestrian footfall without spending heavy money on social media ads. Low density means you must spend heavily on delivery marketing or destination attractions to survive.",
    expansionIqContext:
      "ExpansionIQ derives population counts and urban density using verified GeoNames Gazetteer coordinates and Census 2011 district indicators.",
    proTip:
      "Look for 'Daytime vs Nighttime' density. Offices generate daytime lunchtime footfall, while residential clusters drive evening and weekend family orders.",
    relatedTerms: ["Primary & Secondary Trade Catchment", "Transit & Connectivity Index"],
  },
  {
    keywords: ["transit connectivity", "connectivity", "accessibility", "transit", "metro"],
    term: "Transit & Connectivity Index",
    category: "geospatial",
    shortDefinition: "How accessible your location is via arterial roads, highways, metro hubs, and bus stands.",
    fullDefinition:
      "A scoring metric evaluating ease of customer access, distance to major transit nodes (Central Bus Stand, railway stations, metro stops), road width, and parking availability.",
    businessImpact:
      "A store in a high-density area with zero parking or stuck behind a permanent traffic bottleneck will see customer drop-offs. High connectivity allows your store to pull customers effortlessly from outside the immediate neighborhood.",
    expansionIqContext:
      "The interactive map marks arterial corridors and major transit junctions (e.g. Central Metro / Railway stations and CBS depots) alongside an Accessibility Score (0–100).",
    proTip:
      "Always inspect customer parking on both a Tuesday afternoon and a Saturday evening before signing a commercial lease agreement.",
    relatedTerms: ["Primary & Secondary Trade Catchment", "Commercial Frontage & Carpet Area"],
  },
  {
    keywords: ["saturation index", "saturation", "competitor saturation", "competition opportunity"],
    term: "Competitor Saturation Index",
    category: "market",
    shortDefinition: "The level of competitive overcrowding in a specific retail category within the micro-market.",
    fullDefinition:
      "Compares the number of existing direct competitor outlets against the local population and consumer spending power in that city or locality.",
    businessImpact:
      "A high saturation index means the market is crowded; you will face aggressive discounting, poaching of staff, and customer division. A low saturation index (high competition opportunity score) signifies an unmet customer demand gap.",
    expansionIqContext:
      "ExpansionIQ evaluates competitor density per sq.km and scores 'Competition Opportunity' on a 0–100 scale, with green opportunity pins marking favorable entry zones.",
    proTip:
      "Zero competition is sometimes a red flag indicating zero customer demand. The sweet spot is a neighborhood with 2–3 successful older competitors where modern branded options are completely missing.",
    relatedTerms: ["Composite Viability Score", "Category Fit Score"],
  },
  {
    keywords: ["composite score", "viability score", "overall score", "opportunity score"],
    term: "Composite Viability Score",
    category: "market",
    shortDefinition: "The overall 0–100 health score ranking how attractive an expansion city is for your business.",
    fullDefinition:
      "An aggregated analytical score combining Demand Score, Competition Opportunity, Transit Accessibility, Cost Viability, and Category Fit using deterministic multi-factor weighting.",
    businessImpact:
      "Prevents emotional or biased decision-making (e.g., expanding to a city simply because the founder grew up there, or picking a site purely because rent is cheap).",
    expansionIqContext:
      "Ranked on the Executive Summary and highlighted on map pins. Scores above 80 indicate high viability, 65–79 indicate viable with calculated risks, and below 60 signal caution.",
    proTip:
      "Look closely at the individual factor breakdown behind the composite score. A city with a 78 score but a very poor Cost Viability score may demand too much upfront cash.",
    relatedTerms: ["Category Fit Score", "Saturation Index"],
  },
  {
    keywords: ["carpet area", "built up area", "super built up", "frontage", "commercial space"],
    term: "Carpet Area vs Built-Up Area & Frontage",
    category: "operational",
    shortDefinition: "The actual usable floor space inside the walls vs the total space billed by the landlord.",
    fullDefinition:
      "Carpet Area is the net usable floor space you can lay a carpet on. Built-up area includes the thickness of outer walls and pillars. Super built-up includes shared staircases and lift lobbies.",
    businessImpact:
      "Landlords often quote rent based on built-up area (which can be 20% to 35% larger than carpet area). If you don't verify carpet area, you pay rent on empty lobby air. Furthermore, 'Frontage' (the width of your street-facing glass window) directly dictates walk-in conversion.",
    expansionIqContext:
      "ExpansionIQ's high-chance opportunity sites (like Rajarampuri & Shahupuri) specify exact carpet sq.ft, street frontage in feet, and true rental rates per sq.ft.",
    proTip:
      "Always measure the internal carpet area with a laser measuring tape before signing, and negotiate a minimum 30-foot glass frontage for high-street retail.",
    relatedTerms: ["Opex", "Capex"],
  },
  {
    keywords: ["average ticket", "ticket size", "aov", "average order value"],
    term: "Average Ticket Size (Average Order Value - AOV)",
    category: "operational",
    shortDefinition: "The average rupee amount spent by a single customer in one visit.",
    fullDefinition:
      "Calculated as Total Monthly Revenue ÷ Total Number of Customer Invoices. Represents the basket value per transaction.",
    businessImpact:
      "To reach ₹5,00,000 monthly revenue: at a ₹150 ticket size you need 3,333 customers (111 per day). At a ₹500 ticket size, you only need 1,000 customers (33 per day). Increasing ticket size reduces staffing pressure while increasing profits.",
    expansionIqContext:
      "In the Business Configuration form, you can enter your Expected Average Ticket Size to simulate bottom-up footfall revenue projections in Tab 03.",
    proTip:
      "Train staff to cross-sell beverage pairings or premium add-ons. Increasing ticket size by just ₹40 across 3,000 monthly transactions adds ₹1,20,000 straight to net profit.",
    relatedTerms: ["Gross Margin", "Break-Even Period & Revenue"],
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: "👋 Hello! I am your **ExpansionIQ Intelligence Copilot**.\n\nOur platform uses retail, financial, and geospatial terminology that can sometimes feel technical. Ask me about any term (e.g. *Cash Runway*, *Break-Even*, *Catchment*, *Capex vs Opex*, *Saturation Index*) to understand what it means and how it directly affects your business success!",
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

  // Search logic to find the best matching glossary term
  function findMatchingTerm(query: string): GlossaryTerm | null {
    const clean = query.toLowerCase().trim();
    if (!clean) return null;

    // Exact or keyword match
    for (const term of GLOSSARY_TERMS) {
      if (clean.includes(term.term.toLowerCase())) return term;
      for (const kw of term.keywords) {
        if (clean.includes(kw)) return term;
      }
    }

    // Fuzzy word-based match
    const words = clean.split(/\s+/).filter((w) => w.length > 2);
    for (const term of GLOSSARY_TERMS) {
      for (const word of words) {
        if (term.keywords.some((kw) => kw.includes(word))) return term;
      }
    }

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
        botResponseText = `Here is the breakdown for **${match.term}**:`;
      } else {
        botResponseText = `I couldn't find an exact definition for "${text}" in our core glossary, but here are the key analytical concepts our platform measures:\n\n• **Financial Feasibility**: *Cash Runway*, *Break-Even Period*, *Capex vs Opex*, *Gross Margin*\n• **Geospatial & Demographics**: *Primary Catchment*, *Population Density*, *Transit Connectivity*\n• **Market Health**: *Competitor Saturation*, *Composite Viability Score*, *Carpet vs Built-Up Area*\n\nClick any topic below or ask about any of these terms!`;
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
    }, 450);
  }

  const popularChips = [
    "What is Cash Runway?",
    "Explain Break-Even",
    "Capex vs Opex",
    "What is Catchment?",
    "Saturation Index",
    "Carpet vs Built-Up Area",
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
                AI
              </span>
            </div>
            <div style={{ fontSize: "10px", color: "#94A3B8" }}>Clarify terms & business impact</div>
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
            width: "420px",
            maxWidth: "calc(100vw - 32px)",
            height: "640px",
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
                    ACTIVE
                  </span>
                </strong>
                <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                  Business impact, metrics & glossary guide
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
                      text: "Chat cleared. What business or retail expansion term would you like explained?",
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

          {/* Quick Suggestions Chips Bar */}
          <div
            style={{
              padding: "8px 12px",
              background: "rgba(11, 18, 32, 0.6)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
              display: "flex",
              gap: "6px",
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {popularChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(chip)}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(214, 179, 106, 0.25)",
                  borderRadius: "20px",
                  padding: "4px 10px",
                  fontSize: "11px",
                  color: "#D6B36A",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(214, 179, 106, 0.18)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                }}
              >
                {chip}
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
                      maxWidth: "88%",
                      flexDirection: isUser ? "row-reverse" : "row",
                    }}
                  >
                    <div
                      style={{
                        width: "26px",
                        height: "26px",
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
                      {isUser ? <User size={14} color="#FFF" /> : <Bot size={14} />}
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

                      {/* Term Card if Term Match Exists */}
                      {msg.termMatch && (
                        <div
                          style={{
                            marginTop: "12px",
                            padding: "12px",
                            background: "rgba(11, 18, 32, 0.8)",
                            borderRadius: "8px",
                            border: "1px solid rgba(214, 179, 106, 0.4)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                          }}
                        >
                          {/* Definition */}
                          <div>
                            <span style={{ fontSize: "10px", fontWeight: 700, color: "#D6B36A", textTransform: "uppercase" }}>
                              📖 What It Means
                            </span>
                            <p style={{ margin: "3px 0 0 0", color: "#F8FAFC", fontSize: "12px" }}>
                              {msg.termMatch.fullDefinition}
                            </p>
                          </div>

                          {/* Business Impact */}
                          <div style={{ background: "rgba(239, 68, 68, 0.08)", borderLeft: "3px solid #EF4444", padding: "6px 8px", borderRadius: "3px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 700, color: "#F87171", textTransform: "uppercase" }}>
                              ⚠️ How It Affects Your Business Overall
                            </span>
                            <p style={{ margin: "3px 0 0 0", color: "#CBD5E1", fontSize: "11.5px" }}>
                              {msg.termMatch.businessImpact}
                            </p>
                          </div>

                          {/* ExpansionIQ Context */}
                          <div style={{ background: "rgba(56, 189, 248, 0.08)", borderLeft: "3px solid #38BDF8", padding: "6px 8px", borderRadius: "3px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 700, color: "#38BDF8", textTransform: "uppercase" }}>
                              📊 In ExpansionIQ Website
                            </span>
                            <p style={{ margin: "3px 0 0 0", color: "#CBD5E1", fontSize: "11.5px" }}>
                              {msg.termMatch.expansionIqContext}
                            </p>
                          </div>

                          {/* Founder's Pro Tip */}
                          <div style={{ background: "rgba(16, 185, 129, 0.08)", borderLeft: "3px solid #10B981", padding: "6px 8px", borderRadius: "3px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 700, color: "#34D399", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Lightbulb size={12} /> Founder's Golden Rule
                            </span>
                            <p style={{ margin: "3px 0 0 0", color: "#CBD5E1", fontSize: "11.5px" }}>
                              {msg.termMatch.proTip}
                            </p>
                          </div>

                          {/* Related Term Buttons */}
                          {msg.termMatch.relatedTerms.length > 0 && (
                            <div style={{ marginTop: "4px", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                              <span style={{ fontSize: "10px", color: "#94A3B8" }}>Related Terms:</span>
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
                                      padding: "2px 8px",
                                      fontSize: "10px",
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
                  <span style={{ fontSize: "10px", color: "#64748B", marginTop: "3px", marginRight: isUser ? "34px" : "0", marginLeft: isUser ? "0" : "34px" }}>
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {isTyping && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: "#D6B36A",
                    color: "#0B1220",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Bot size={14} />
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
                  <span>Analyzing term</span>
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
              placeholder="Ask: 'What is runway?' or 'Explain break-even'..."
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
