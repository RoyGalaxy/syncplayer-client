import { useState } from "react";

function RoomUI({ socket, room, setRoom, user, setUser }) {
  const [roomCode, setRoomCode] = useState("");
  const [username, setUsername] = useState(user || "");
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);

  const handleCreate = () => {
    if (!username) return setError("Enter a username");
    setError(null);
    socket.emit("createRoom", username, (roomId) => {
      setRoom({ id: roomId, queue: [], participants: [], currentTrack: null });
      setUser(username);
      setRoomCode(roomId);
      handleJoin(roomId, username);
    });
  };

  const handleJoin = (code = roomCode, name = username) => {
    if (!code || !name) return setError("Enter room code and username");
    setError(null);
    setJoining(true);
    socket.emit("joinRoom", { roomId: code, user: name }, (res) => {
      setJoining(false);
      if (res?.error) return setError(res.error);
      setRoom({ ...res.room, id: code });
      setUser(name);
      setRoomCode(code);
    });
  };

  if (room && room.id) {
    // Ensure participants is always an array for mapping
    let participantsArr = [];
    if (Array.isArray(room.participants)) {
      participantsArr = room.participants;
    } else if (room.participants && typeof room.participants === "object") {
      // If participants is an object (e.g., {socketId: {name, ...}}), convert to array
      participantsArr = Object.values(room.participants);
    }

    return (
      <div className="bg-gray-800 rounded-lg p-4 mt-8 w-full max-w-xl mx-auto">
        <div className="text-xl font-bold mb-2">Room: <span className="text-green-400">{room.id}</span></div>
        <div className="mb-2">You are <span className="font-semibold">{user}</span></div>
        <div className="mb-2">
          <span className="font-semibold">Participants:</span>
          <ul className="ml-4 list-disc">
            {participantsArr.map((p, i) => (
              <li key={i}>{p.name || p}</li>
            ))}
          </ul>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Queue:</span>
          <ul className="ml-4 list-decimal">
            {(room.queue || []).map((track, i) => (
              <li key={track.id}>{track.title} <span className="text-gray-400">by {track.artist}</span></li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 mt-8 w-full max-w-xl mx-auto">
      <div className="text-xl font-bold mb-2">Sync Room</div>
      <div className="mb-2">
        <input
          className="p-2 rounded bg-gray-700 text-white mr-2"
          placeholder="Your name"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <button className="bg-green-500 px-4 py-2 rounded font-semibold hover:bg-green-600 mr-2" onClick={handleCreate}>
          Create Room
        </button>
      </div>
      <div className="mb-2">
        <input
          className="p-2 rounded bg-gray-700 text-white mr-2"
          placeholder="Room code"
          value={roomCode}
          onChange={e => setRoomCode(e.target.value)}
        />
        <input
          className="p-2 rounded bg-gray-700 text-white mr-2"
          placeholder="Your name"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <button className="bg-blue-500 px-4 py-2 rounded font-semibold hover:bg-blue-600" onClick={() => handleJoin()} disabled={joining}>
          {joining ? "Joining..." : "Join Room"}
        </button>
      </div>
      {error && <div className="text-red-400 mt-2">{error}</div>}
    </div>
  );
}

export default RoomUI; 