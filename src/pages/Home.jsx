import SearchBar from "../components/SearchBar";
import TrackCard from "../components/TrackCard";
import Player from "../components/Player";
import RoomUI from "../components/RoomUI";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";

function Home() {
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [room, setRoomState] = useState(null);
  const [user, setUserState] = useState("");
  const [socket, setSocket] = useState(null);

  // Save room/user to localStorage
  const setRoom = (r) => {
    setRoomState(r);
    if (r && r.id) {
      localStorage.setItem("syncplayer_room", JSON.stringify(r));
    } else if (typeof r == Object) {
      localStorage.removeItem("syncplayer_room");
    }
  };
  const setUser = (u) => {
    setUserState(u);
    if (u) {
      localStorage.setItem("syncplayer_user", u);
    } else {
      localStorage.removeItem("syncplayer_user");
    }
  };

  const handlePlay = (track) => {
    if (!room || !track) return;
    socket.emit("play", {
      roomId: room.id,
      track,
      time: 0,
      user,
    });
    setCurrentTrack(track);
  };

  // Restore room/user from localStorage on mount
  useEffect(() => {
    const savedRoom = localStorage.getItem("syncplayer_room");
    const savedUser = localStorage.getItem("syncplayer_user");
    if (savedRoom) setRoomState(JSON.parse(savedRoom));
    if (savedUser) setUserState(savedUser);
  }, []);

  // Connect socket
  useEffect(() => {
    let socketRef;
    if (!socket) {
      socketRef = io(__API_BASE_URL__); // Connects to same origin by default
      setSocket(socketRef);
    }
    // Clean up on unmount
    return () => {
      if (socketRef) {
        socketRef.off("participants");
        socketRef.off("queue");
      }
    };
  }, []);

  // Auto-reconnect to room if info is present
  useEffect(() => {
    if (!socket || !room || !room.id || !user) return;
    // Only auto-join if not already joined (room.participants may be undefined on reload)
    socket.emit("joinRoom", { roomId: room.id, user }, (res) => {
      if (res?.error) {
        setRoom(null);
      } else {
        setRoom({ ...res.room, id: room.id });
      }
    });
  }, [socket, user]);

  useEffect(() => {
    if (socket == null) return;
    socket.on("participants", (participants) => {
      setRoom((r) => r ? { ...r, participants } : r);
    });
    socket.on("queue", (queue) => {
      setRoom((r) => r ? { ...r, queue } : r);
    });
  }, [socket]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      {room && <>
        <h1 className="text-3xl font-bold mb-6">SyncPlayer</h1>
        <SearchBar onResults={setTracks} />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-5xl mt-6">
          {tracks.map((track, idx) => (
            <TrackCard key={track.id} track={track} onPlay={() => handlePlay(track)} />
          ))}
        </div>
      </>}
      {(socket && tracks.length == 0) && <RoomUI
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