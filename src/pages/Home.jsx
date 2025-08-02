import SearchBar from "../components/SearchBar";
import TrackCard from "../components/TrackCard";
import Player from "../components/Player";
import RoomUI from "../components/RoomUI";
import { useState, useEffect } from "react";
import { useRoomStore } from "../store/room";
import { useSocketStore } from "../store/socket";

function Home() {
  // Local state for search results, not needed globally
  const [tracks, setTracks] = useState([]);
  
  // Get state and actions from stores
  const { room, currentTrack, playTrack } = useRoomStore();
  const { connect, disconnect } = useSocketStore.getState();

  // Connect to socket on initial component mount
  useEffect(() => {
    connect();
    // Disconnect on unmount
    return () => disconnect();
  }, [connect, disconnect]);

  // If we are not in a room, show the RoomUI to join/create
  if (!room) {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <RoomUI />
        </div>
    );
  }
  
  // If we are in a room, show the main application UI
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 pb-24"> {/* padding-bottom to avoid overlap with player */}
        <div className="w-full max-w-5xl">
            <h1 className="text-3xl font-bold">SyncPlayer</h1>
            
            <SearchBar onResults={setTracks} />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full mt-6">
                {tracks.map((track) => (
                  <TrackCard key={track.id} track={track} onPlay={() => playTrack(track)} />
                ))}
            </div>
            {tracks.length === 0 && (
              <div className="text-center text-gray-500 mt-10">
                    <p>Search for a song to get started.</p>
                </div>
            )}
            
            <RoomUI />
        </div>
      
        {/* The Player is now rendered based on global state */}
        <Player />
    </div>
  );
}

export default Home; 