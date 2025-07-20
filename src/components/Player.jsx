import { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";

// Helper for icons - In a real app, you'd use an icon library like lucide-react
const Icon = ({ path, className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d={path} />
  </svg>
);

// Icon paths from the new UI
const ICONS = {
  CHEVRON_DOWN: "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z",
  MORE_VERTICAL: "M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
  HEART: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  SHUFFLE: "M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z",
  SKIP_PREVIOUS: "M6 6h2v12H6zm3.5 6l8.5 6V6l-8.5 6z",
  PLAY: "M8 5v14l11-7z",
  PAUSE: "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
  SKIP_NEXT: "M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z",
  REPEAT: "M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z",
  CHEVRON_UP: "M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z",
  LOADING: "M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8V2z"
};


function Player({ track, setCurrentTrack, socket, room, user, loading, setLoading }) {
  const playerRef = useRef(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [internalSeek, setInternalSeek] = useState(false);
  const [lastPlayer, setLastPlayer] = useState(null);
  const [duration, setDuration] = useState(1);
  const [minimized, setMinimized] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Emit play event
  const handlePlay = () => {
    if (!room || !track) return;
    setLoading(true)
    socket.emit("play", {
      roomId: room.id,
      track,
      time: playedSeconds,
      user,
    });
    setPlaying(true);
    setLastPlayer(user);
  };

  // Emit pause event
  const handlePause = () => {
    if (!room || !track) return;
    socket.emit("pause", {
      roomId: room.id,
      time: playedSeconds,
    });
    setPlaying(false);
  };

  // Emit seek event from slider
  const handleSeekMouseDown = () => {
    setIsSeeking(true);
  };

  // As the user drags the slider
  const handleSeekChange = (newTime) => {
    // Only update the visual position of the slider
    setPlayedSeconds(newTime);
  };

  const handleSeekMouseUp = (newTime) => {
    if (!room || !track) return;

    // Add this check to prevent the error
    if (playerRef.current) {
      playerRef.current.currentTime = Number.parseFloat(newTime);
    }

    socket.emit("seek", {
      roomId: room.id,
      time: newTime,
    });
  };

  const handleTimeUpdate = () => {
    const player = playerRef.current;
    // We only want to update time slider if we are not currently seeking
    if (!player || isSeeking) return;

    setPlayedSeconds(player.currentTime)

  }

  const handleDurationChange = () => {
    const d = playerRef?.current?.duration;
    const duration = Number.isFinite(d) && d > 0 ? d : 1
    setDuration(duration)
  }


  // Emit next event
  const handleNext = () => {
    if (!room) return;
    socket.emit("next", {
      roomId: room.id,
      user,
    });
  };

  // Listen for backend events
  useEffect(() => {
    if (!socket || !socket.connected) return;
    const onPlay = ({ track: t, time, user: who }) => {
      setCurrentTrack(t);
      setPlaying(true);
      setLastPlayer(who);
      setPlayedSeconds(time ?? 0);
      setInternalSeek(true);
    };
    const onPause = ({ time }) => {
      setPlaying(false);
      setPlayedSeconds(time ?? 0);
      setInternalSeek(true);
    };
    const onSeek = ({ time }) => {
      setPlayedSeconds(time ?? 0);
      setInternalSeek(true);
    };
    const onSyncTick = ({ time, isPlaying, currentTrack }) => {
      console.log("event received")
      if (track && currentTrack && track.id === currentTrack.id) {
        if (Math.abs(playedSeconds - time) > 1.5) {
          setPlayedSeconds(time);
          setInternalSeek(true);
        }
        setPlaying(isPlaying);
      }
    };

    socket.on("play", onPlay);
    socket.on("pause", onPause);
    socket.on("seek", onSeek);
    socket.on("syncTick", onSyncTick);

    return () => {
      socket.off("play", onPlay);
      socket.off("pause", onPause);
      socket.off("seek", onSeek);
      socket.off("syncTick", onSyncTick);
    };
  }, [socket, track, setCurrentTrack]);

  // Sync player with state
  useEffect(() => {
    // This handles seeks from the server
    if (internalSeek && playerRef.current) {
      playerRef.current.currentTime = Number.parseFloat(playedSeconds)
      setInternalSeek(false);
    }
  }, [internalSeek, playedSeconds]);

  // Reset state when track changes
  useEffect(() => {
    setPlayedSeconds(0);
    setDuration(1);
    setPlaying(true);
    setLastPlayer(null);
  }, [track?.id]);

  const formatTime = s => {
    if (!Number.isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!track) {
    return null;
  }

  const safePlayedSeconds = Number.isFinite(playedSeconds) ? playedSeconds : 0;
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 1;

  return (
    <>
      <ReactPlayer
        ref={playerRef}
        src={track.id ? `https://www.youtube.com/watch?v=${track.id}` : ""}
        onPlaying={() => setLoading(false)}
        playing={playing}
        controls={false}
        width={0}
        height={0}
        style={{ display: "none" }}
        onDurationChange={handleDurationChange}
        onTimeUpdate={handleTimeUpdate}
        config={{
          youtube: {
            playerVars: {
              autoplay: 0,
              controls: 0,
              rel: 0,
              modestbranding: 1,
              origin: window.location.origin,
            }
          }
        }}
      />

      {/* Conditionally render the UI based on the 'minimized' state */}
      {minimized ? (
        <div className="fixed bottom-4 right-4 w-64 bg-gray-800 text-white rounded-lg shadow-2xl p-3 flex items-center space-x-3 z-50 animate-fade-in-up">
          <img src={track.thumbnail} alt={track.title} className="w-12 h-12 rounded-md" />
          <div className="flex-1 overflow-hidden">
            <p className="font-bold truncate text-sm">{track.title}</p>
            <p className="text-xs text-gray-400 truncate">{track.artist}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); playing ? handlePause() : handlePlay(); }} className="p-2 rounded-full hover:bg-gray-700">
            {loading ? (
              <div className="absolute right-4 animate-spin">
                <div className="w-6 h-6 border-2 border-transparent border-t-green-400 rounded-full"></div>
              </div>
            ) : <Icon path={playing ? ICONS.PAUSE : ICONS.PLAY} className="w-5 h-5" />}
          </button>
          <button onClick={() => setMinimized(false)} className="p-2 rounded-full hover:bg-gray-700">
            <Icon path={ICONS.CHEVRON_UP} className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="fixed inset-0 bg-gradient-to-b from-gray-800 via-gray-900 to-black text-white flex flex-col items-center justify-center p-4 transition-all duration-500">
          <div className="w-full max-w-md mx-auto flex flex-col h-full">
            {/* Top Bar */}
            <header className="flex justify-between items-center w-full pt-4 pb-2">
              <button onClick={() => setMinimized(true)} className="p-2 rounded-full hover:bg-white/10">
                <Icon path={ICONS.CHEVRON_DOWN} />
              </button>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider text-gray-400">Played {loading} by {lastPlayer}</p>
                <p className="font-bold text-sm">{room?.name || "SyncPlayer"}</p>
              </div>
              <button className="p-2 rounded-full hover:bg-white/10">
                <Icon path={ICONS.MORE_VERTICAL} />
              </button>
            </header>

            {/* Album Art */}
            <div className="flex-grow flex items-center justify-center my-4">
              <img
                src={track.thumbnail}
                alt={track.title}
                className="w-full aspect-square rounded-lg shadow-2xl object-cover"
              />
            </div>

            {/* Song Info & Like Button */}
            <div className="flex justify-between items-center w-full mb-4">
              <div>
                <h1 className="text-2xl font-bold truncate max-w-xs">{track.title}</h1>
                <p className="text-gray-400 truncate max-w-xs">{track.artist}</p>
              </div>
              <button onClick={() => setIsLiked(!isLiked)} className={`p-2 rounded-full hover:bg-white/10 transition-colors ${isLiked ? 'text-green-500' : 'text-gray-400'}`}>
                <Icon path={ICONS.HEART} className="w-7 h-7" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full mb-4">
              <input
                type="range"
                min={0}
                max={safeDuration}
                value={safePlayedSeconds}
                onChange={(e) => handleSeekChange(Number(e.target.value))}
                onMouseDown={handleSeekMouseDown}
                onMouseUp={(e) => handleSeekMouseUp(Number(e.target.value))}
                onTouchStart={handleSeekMouseDown}
                onTouchEnd={(e) => handleSeekMouseUp(Number(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer accent-white"
                style={{
                  background: `linear-gradient(to right, white ${(safePlayedSeconds / safeDuration) * 100}%, rgb(55 65 81) ${(safePlayedSeconds / safeDuration) * 100}%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{formatTime(safePlayedSeconds)}</span>
                <span>{formatTime(safeDuration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex justify-between items-center w-full mb-8">
              <button className="p-2 text-green-500 rounded-full hover:bg-white/10">
                <Icon path={ICONS.SHUFFLE} />
              </button>
              <button className="p-2 rounded-full hover:bg-white/10" title="Previous (Not Implemented)">
                <Icon path={ICONS.SKIP_PREVIOUS} className="w-10 h-10" />
              </button>
              <button
                onClick={playing ? handlePause : handlePlay}
                className="bg-white text-black rounded-full p-4 mx-2 shadow-lg hover:scale-105 transition-transform"
              >
                {loading ? (
                  <div className="animate-spin">
                    <div className="w-6 h-6 border-4 border-transparent border-t-green-400 border-r-green-500 rounded-full"></div>
                  </div>
                ) : <Icon path={playing ? ICONS.PAUSE : ICONS.PLAY} className="w-8 h-8" />}
              </button>
              <button onClick={handleNext} className="p-2 rounded-full hover:bg-white/10" title="Next">
                <Icon path={ICONS.SKIP_NEXT} className="w-10 h-10" />
              </button>
              <button className="p-2 text-green-500 rounded-full hover:bg-white/10">
                <Icon path={ICONS.REPEAT} />
              </button>
            </div>

            {/* Bottom Bar (placeholder) */}
            <footer className="w-full flex justify-center pb-4">
              <div className="w-10 h-1 bg-gray-500 rounded-full"></div>
            </footer>
          </div>
        </div>
      )}

      {/* Styles are also kept at the top level to apply to both views */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
        /* Custom styles for the range slider */
        input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; background: transparent; }
        input[type=range]:focus { outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; height: 12px; width: 12px; background: #fff; border-radius: 50%; cursor: pointer; margin-top: -5px; }
        input[type=range]::-moz-range-thumb { height: 12px; width: 12px; background: #fff; border-radius: 50%; cursor: pointer; }
      `}</style>
    </>
  );
}

export default Player;
