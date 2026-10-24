import { BarChart3, Database, LayoutDashboard, MapPinned } from "lucide-react";

export type WorkspacePage = "dashboard" | "results" | "site-finder" | "settings";

type Props = {
  activePage: WorkspacePage;
  onNavigate: (page: WorkspacePage) => void;
};

const navigationItems: {
  id: WorkspacePage;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: "dashboard", label: "Workspace", icon: LayoutDashboard },
  { id: "results", label: "Market results", icon: BarChart3 },
  { id: "site-finder", label: "Area finder", icon: MapPinned },
  { id: "settings", label: "Market inputs", icon: Database },
];

export default function Sidebar({ activePage, onNavigate }: Props) {
  return (
    <aside className="sidebar">
      <a className="brand" href="/" onClick={(event) => {
        event.preventDefault();
        onNavigate("dashboard");
      }}>
        <span className="brand-mark">IQ</span>
        <span className="brand-copy">
          <strong>ExpansionIQ</strong>
          <small>RETAIL INTELLIGENCE</small>
        </span>
      </a>

      <div className="sidebar-section-label">WORKSPACE</div>
      <nav className="sidebar-navigation" aria-label="Main navigation">
        {navigationItems.map(({ id, label, icon: Icon }) => (
          <button
            className={`sidebar-link${activePage === id ? " active" : ""}`}
            key={id}
            type="button"
            aria-current={activePage === id ? "page" : undefined}
            onClick={() => onNavigate(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-mark">EI</div>
        <div>
          <strong>Evidence first</strong>
          <span>Missing data stays visible</span>
        </div>
      </div>
    </aside>
  );
}