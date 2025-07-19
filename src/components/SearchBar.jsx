import { useState } from "react";

function SearchBar({ onResults }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${__API_BASE_URL__}/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      onResults(data.results || []);
    } catch (err) {
      setError("Failed to fetch results");
      onResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex w-full max-w-xl mx-auto mb-2">
      <input
        type="text"
        className="flex-1 p-2 rounded-l bg-gray-800 text-white focus:outline-none"
        placeholder="Search for songs or artists..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        disabled={loading}
      />
      <button type="submit" className="bg-green-500 px-4 py-2 rounded-r font-semibold hover:bg-green-600" disabled={loading}>
        {loading ? "Searching..." : "Search"}
      </button>
      {error && <div className="text-red-400 ml-4">{error}</div>}
    </form>
  );
}

export default SearchBar; 