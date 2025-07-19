import SearchBar from "../components/SearchBar";
import TrackCard from "../components/TrackCard";
import Player from "../components/Player";
import RoomUI from "../components/RoomUI";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";

function Home() {
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [room, setRoom] = useState(null);
  const [user, setUser] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    let socketRef;
    if (!socket) {
      socketRef = io(__API_BASE_URL__); // Connects to same origin by default
      setSocket(socketRef);
    }
    // Clean up on unmount
    return () => {
      socketRef.off("participants");
      socketRef.off("queue");
    };
  }, []);

  useEffect(() => {
    if(socket == null) return;
    socket.on("participants", (participants) => {
      console.log(participants)
      setRoom((r) => r ? { ...r, participants } : r);
    });
    socket.on("queue", (queue) => {
      setRoom((r) => r ? { ...r, queue } : r);
    });
  }, [socket]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-6">SyncPlayer</h1>
      <SearchBar onResults={setTracks} />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-5xl mt-6">
        {tracks.map((track, idx) => (
          <TrackCard key={track.id} track={track} onPlay={() => setCurrentTrack(track)} />
        ))}
      </div>
      {socket && <RoomUI
        socket={socket}
        room={room}
        setRoom={setRoom}
        user={user}
        setUser={setUser}
      />}
      <div className="fixed bottom-0 left-0 w-full bg-gray-800 shadow-lg p-4">
        <Player track={currentTrack} setCurrentTrack={setCurrentTrack} socket={socket} room={room} user={user} />
      </div>
    </div>
  );
}

export default Home; 