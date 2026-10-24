import { Search } from "lucide-react";
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
          placeholder="Find a city or saved area..."
          aria-label="Find a city or saved area"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button className="header-search-submit" type="submit" aria-label="Search">
          <kbd>Enter</kbd>
        </button>
      </form>

      <div className="topbar-actions">
        <span className="live-status" role="status" aria-live="polite">
          <span
            className={`status-dot status-${apiStatus}`}
            aria-hidden="true"
          />
          {statusLabel}
        </span>

        <div className="profile-identity">
          <span className="avatar">IQ</span>
          <span className="profile-name">ExpansionIQ</span>
        </div>
      </div>
    </header>
  );
}