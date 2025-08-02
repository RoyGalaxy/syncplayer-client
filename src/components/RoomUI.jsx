import { useRoomStore } from "../store/room";
import { useUIStore } from "../store/ui";
import { useUserStore } from "../store/user";

// Helper for icons - In a real app, you'd use an icon library like lucide-react
const Icon = ({ path, className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d={path} clipRule="evenodd" />
  </svg>
);

// Icon paths for the new UI
const ICONS = {
  USERS: "M18 18.5a.5.5 0 0 0 .5-.5v-6a.5.5 0 0 0-.5-.5h-11a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 .5.5h11ZM12.5 2a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0-.5.5v1.846a4.504 4.504 0 0 0-2.654 3.871L4 10.5v6A2.5 2.5 0 0 0 6.5 19h11A2.5 2.5 0 0 0 20 16.5v-6l.154-2.783a4.504 4.504 0 0 0-2.654-3.87V2.5a.5.5 0 0 0-.5-.5h-4ZM12 5.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  COPY: "M15.503 4.022a2 2 0 0 1 2.828 0l1.647 1.646a2 2 0 0 1 0 2.828l-1.414 1.414a.5.5 0 0 1-.707-.707l1.414-1.414a1 1 0 0 0 0-1.414l-1.647-1.646a1 1 0 0 0-1.414 0l-1.414 1.414a.5.5 0 0 1-.707-.707l1.414-1.414ZM8.497 19.978a2 2 0 0 1-2.828 0l-1.647-1.646a2 2 0 0 1 0-2.828l1.414-1.414a.5.5 0 0 1 .707.707l-1.414 1.414a1 1 0 0 0 0 1.414l1.647 1.646a1 1 0 0 0 1.414 0l1.414-1.414a.5.5 0 0 1 .707.707l-1.414 1.414ZM9.204 7.796a.5.5 0 0 0-.707.707l6 6a.5.5 0 0 0 .707-.707l-6-6Z",
  LEAVE: "M15.28 4.22a.75.75 0 0 1 0 1.06L13.06 7.5l2.22 2.22a.75.75 0 1 1-1.06 1.06L12 8.56l-2.22 2.22a.75.75 0 0 1-1.06-1.06L10.94 7.5 8.72 5.28a.75.75 0 0 1 1.06-1.06L12 6.44l2.22-2.22a.75.75 0 0 1 1.06 0Z M6.25 5.5A2.25 2.25 0 0 0 4 7.75v8.5A2.25 2.25 0 0 0 6.25 18.5h4.5a.75.75 0 0 1 0 1.5h-4.5A3.75 3.75 0 0 1 2.5 16.25v-8.5A3.75 3.75 0 0 1 6.25 4h4.5a.75.75 0 0 1 0 1.5h-4.5Z",
};

function RoomUI({ socket }) {
  // UI State from Zustand Store
  const { error, joining, copied, setError, flashCopied } = useUIStore();

  // User State from Zustand Store
  const { user, setUser } = useUserStore();

  // Room State and Actions from Zustand Store
  const { room, roomCodeInput, setRoomCodeInput, createRoom, joinRoom, leaveRoom } = useRoomStore();

  const handleCreate = () => {
    createRoom(user);
  };

  const handleJoin = () => {
    joinRoom(roomCodeInput, user);
  };

  const handleCopyCode = () => {
    if (!room?.id) return;
    // Using the 'copy' command for broader compatibility in iFrames
    const textArea = document.createElement("textarea");
    textArea.value = room.id;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        flashCopied();
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
        setError("Failed to copy room code.");
    }
    document.body.removeChild(textArea);
  };
  
  // --- In-Room View ---
  if (room && room.id) {
    let participantsArr = [];
    if (Array.isArray(room.participants)) {
      participantsArr = room.participants;
    } else if (room.participants && typeof room.participants === "object") {
      participantsArr = Object.values(room.participants);
    }

    return (
      <div className="p-4 md:p-8 w-full max-w-4xl mx-auto text-white">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Room Code</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-mono bg-gray-800 px-3 py-1 rounded-md text-green-400">{room.id}</p>
              <button onClick={handleCopyCode} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">
                <Icon path={ICONS.COPY} className="w-5 h-5" />
              </button>
              {copied && <span className="text-sm text-green-400">Copied!</span>}
            </div>
          </div>
          <button onClick={leaveRoom} className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/40 transition-colors">
            <Icon path={ICONS.LEAVE} className="w-5 h-5" />
            Leave Room
          </button>
        </div>

        {/* Participants */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Participants ({participantsArr.length})</h2>
          <div className="flex flex-wrap gap-4">
            {participantsArr.map((p, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-800 p-2 pr-4 rounded-full">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-black">
                  {(p.name || p).charAt(0).toUpperCase()}
                </div>
                <span className="font-medium">{p.name || p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Queue */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Up Next ({room.queue?.length || 0})</h2>
          <div className="space-y-2">
            {(room.queue || []).length > 0 ? (
              (room.queue || []).map((track, i) => (
                <div key={track.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-800/60 transition-colors">
                  <span className="text-gray-400 font-mono w-5 text-center">{i + 1}</span>
                  <img src={track.thumbnail} alt={track.title} className="w-12 h-12 rounded-md object-cover" />
                  <div className="flex-1">
                    <p className="font-semibold text-white truncate">{track.title}</p>
                    <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 px-4 bg-gray-800/40 rounded-lg">
                <p className="text-gray-400">The queue is empty.</p>
                <p className="text-sm text-gray-500">Search for a song to add it!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Join/Create View ---
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl text-white text-center">
        <Icon path={ICONS.USERS} className="w-16 h-16 mx-auto text-green-400 mb-4" />
        <h1 className="text-3xl font-bold mb-2">SyncPlayer</h1>
        <p className="text-gray-400 mb-8">Listen together, in real-time.</p>

        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-md mb-4 text-sm">{error}</div>}

        <div className="space-y-4 text-left">
          <input
            className="w-full p-3 rounded-md bg-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all"
            placeholder="Enter your name"
            value={user}
            onChange={e => setUser(e.target.value)}
          />
          <input
            className="w-full p-3 rounded-md bg-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all"
            placeholder="Enter Room Code (optional)"
            value={roomCodeInput}
            onChange={e => setRoomCodeInput(e.target.value)}
          />
        </div>

        <div className="mt-6 space-y-3">
          <button 
            className="w-full bg-green-500 text-black px-4 py-3 rounded-md font-semibold hover:bg-green-600 transition-all transform hover:scale-105" 
            onClick={() => roomCodeInput ? handleJoin() : handleCreate()}
            disabled={joining}
          >
            {joining ? "Joining..." : (roomCodeInput ? "Join Room" : "Create & Join Room")}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-6">
          Enter a name and tap "Create" to start a new room, or enter an existing code to join.
        </p>
      </div>
    </div>
  );
}

export default RoomUI;
