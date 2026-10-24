import { ChevronDown, Search } from "lucide-react";
import { useState, type FormEvent } from "react";

type Props = {
  apiStatus: "checking" | "connected" | "unavailable";
  onSearch: (query: string) => void;
};

export default function Header({ apiStatus, onSearch }: Props) {
  const [query, setQuery] = useState("");
  const statusLabel = {
    checking: "Connecting to API",
    connected: "Backend connected",
    unavailable: "Backend unavailable",
  }[apiStatus];

  return (
    <header className="topbar">
      <form
        className="topbar-search"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          if (query.trim()) onSearch(query.trim());
        }}
      >
        <Search size={17} />
        <input
          type="search"
          placeholder="Search cities, areas, or reports..."
          aria-label="Search cities, areas, or reports"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button className="header-search-submit" type="submit" aria-label="Search">
          <kbd>Enter</kbd>
        </button>
      </form>

      <div className="topbar-actions">
        <span className="live-status">
          <span className={`status-dot status-${apiStatus}`} />
          {statusLabel}
        </span>

        <div className="profile-button">
          <span className="avatar">IQ</span>
          <span className="profile-name">ExpansionIQ</span>
          <ChevronDown size={15} />
        </div>
      </div>
    </header>
  );
}