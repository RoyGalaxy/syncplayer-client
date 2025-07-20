import { useState } from "react";

// Helper for icons
const Icon = ({ path, className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d={path} clipRule="evenodd" />
  </svg>
);

// Icon paths for the new UI
const ICONS = {
  SEARCH: "M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z",
  ARROW_LEFT: "M10.75 4.75a.75.75 0 0 0-1.06 0L4.47 9.97a.75.75 0 0 0 0 1.06l5.22 5.22a.75.75 0 1 0 1.06-1.06L6.06 10.5l4.69-4.69a.75.75 0 0 0 0-1.06Z",
};

function SearchBar({ onResults }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // New state to track if a search has been performed
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true); // Mark that a search has occurred
    try {
      const res = await fetch(`${__API_BASE_URL__}/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed. Please try again.");
      const data = await res.json();
      onResults(data.results || []);
    } catch (err) {
      setError(err.message || "Failed to fetch results");
      onResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handler for the new back button
  const handleClearSearch = () => {
    setQuery("");
    onResults([]); // This clears the tracks in the parent component
    setError(null);
    setHasSearched(false); // Reset the search state
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-8 px-4">
      <div className="flex items-center gap-4">
        {/* Back button appears after a search has been made */}
        {hasSearched && (
          <button 
            onClick={handleClearSearch} 
            className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <Icon path={ICONS.ARROW_LEFT} className="w-6 h-6" />
          </button>
        )}
        <form onSubmit={handleSearch} className="relative flex items-center w-full">
          <input
            type="text"
            className="w-full p-4 pl-12 text-lg bg-gray-700/80 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-green-400 transition-all placeholder-gray-500"
            placeholder="What do you want to listen to?"
            value={query}
            onChange={e => setQuery(e.target.value)}
            disabled={loading}
          />
          <div className="absolute left-4 pointer-events-none">
            <Icon path={ICONS.SEARCH} className="w-6 h-6 text-gray-400" />
          </div>
          {loading && (
            <div className="absolute right-4 animate-spin">
              <div className="w-6 h-6 border-2 border-transparent border-t-green-400 rounded-full"></div>
            </div>
          )}
        </form>
      </div>
      {error && <p className="text-red-400 text-center mt-2">{error}</p>}
    </div>
  );
}

export default SearchBar;
