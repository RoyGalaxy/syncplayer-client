import { useState } from "react";
import SearchBar from "./components/SearchBar";
import TrackCard from "./components/TrackCard";
import Player from "./components/Player";

function App() {
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-6">SyncPlayer</h1>
      <SearchBar onResults={setTracks} />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-5xl mt-6">
        {tracks.map((track, idx) => (
          <TrackCard key={track.id} track={track} onPlay={() => setCurrentTrack(track)} />
        ))}
      </div>
      <div className="fixed bottom-0 left-0 w-full bg-gray-800 shadow-lg p-4">
        <Player track={currentTrack} />
      </div>
    </div>
  );
}

export default App;
