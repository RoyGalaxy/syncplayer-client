import React, { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { useRoomStore } from "../store/room";// Assuming stores are in a central file or barrel
import { useUIStore } from "../store/ui";

// Helper for icons
const Icon = ({ path, className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d={path} />
  </svg>
);

// Icon paths for the new UI
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
};

function Player() {
  // Get state and actions from Zustand stores
  const { room, currentTrack, playing, playedSeconds, duration, lastPlayer, emitPlay, emitPause, emitSeek, emitNext, setPlaybackState } = useRoomStore();
  const { loading, setLoading } = useUIStore();

  // Local UI state that doesn't need to be global
  const playerRef = useRef(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  // This effect ensures the underlying ReactPlayer seeks when the server sends a new time
  useEffect(() => {
    // FIX: Check if the seekTo function exists before calling it
    const player = playerRef.current
    if (useRoomStore.getState().internalSeek && player && player.currentTime !== undefined) {
      playerRef.current.currentTime = playedSeconds
      useRoomStore.getState().setInternalSeek(false);
    }
  }, [playedSeconds]);

  // Reset local player state when the track changes
  useEffect(() => {
    if (currentTrack) {
        setLoading(true);
    }
  }, [currentTrack?.id, setLoading]);

  const formatTime = s => {
    if (!Number.isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // --- Event Handlers ---
  const handlePlayPause = () => {
    // FIX: Check if getCurrentTime function exists before calling it
    if (playing && playerRef.current && playerRef.current.currentTime !== undefined) {
      emitPause(playerRef.current.currentTime);
    } else {
      emitPlay();
    }
  };

  const handleSeekChange = (newTime) => {
    if (isSeeking) {
      setPlaybackState({ playedSeconds: newTime });
    }
  };

  const handleSeekMouseUp = (newTime) => {
    setIsSeeking(false);
    // FIX: Check if seekTo function exists before calling it
    const player = playerRef.current;
    if (player && player.currentTime !== undefined) {
      player.currentTime = newTime;
      emitSeek(newTime);
    }
  };

  const handleTimeUpdate = () => {
    const player = playerRef.current;
    // We only want to update time slider if we are not currently seeking
    if (!player || isSeeking) return;

    setPlaybackState({ playedSeconds: player.currentTime });
  }
  
  if (!currentTrack) {
    return null;
  }

  const safePlayedSeconds = Number.isFinite(playedSeconds) ? playedSeconds : 0;
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 1;

  return (
    <>
      <ReactPlayer
        key={currentTrack.id}
        ref={playerRef}
        src={currentTrack.id ? `https://www.youtube.com/watch?v=${currentTrack.id}` : ""}
        playing={playing}
        controls={false}
        width={0}
        height={0}
        style={{ display: "none" }}
        onReady={() => setLoading(false)}
        onPlay={() => setPlaybackState({ playing: true })}
        onPlaying={() => setLoading(false)}
        onPause={() => setPlaybackState({ playing: false })}
        onDurationChange={(d) => setPlaybackState({ duration: playerRef.current.duration })}
        onTimeUpdate={handleTimeUpdate}
        onProgress={() => {setLoading(false)}} // Used to manage buffer duration
        config={{
          youtube: {
            playerVars: {
              autoplay: 1,
              controls: 0,
              rel: 0,
              modestbranding: 1,
            }
          }
        }}
      />

      {minimized ? (
        <div className="fixed bottom-4 right-4 w-64 bg-gray-800 text-white rounded-lg shadow-2xl p-3 flex items-center space-x-3 z-50 animate-fade-in-up">
          <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-12 h-12 rounded-md" />
          <div className="flex-1 overflow-hidden">
            <p className="font-bold truncate text-sm">{currentTrack.title}</p>
            <p className="text-xs text-gray-400 truncate">{currentTrack.artist}</p>
          </div>
          <button onClick={handlePlayPause} className="p-2 rounded-full hover:bg-gray-700">
            <Icon path={playing ? ICONS.PAUSE : ICONS.PLAY} className="w-5 h-5" />
          </button>
          <button onClick={() => setMinimized(false)} className="p-2 rounded-full hover:bg-gray-700">
            <Icon path={ICONS.CHEVRON_UP} className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="fixed inset-0 bg-gradient-to-b from-gray-800 via-gray-900 to-black text-white flex flex-col items-center justify-center p-4 transition-all duration-500 z-50">
          <div className="w-full max-w-md mx-auto flex flex-col h-full">
            <header className="flex justify-between items-center w-full pt-4 pb-2">
              <button onClick={() => setMinimized(true)} className="p-2 rounded-full hover:bg-white/10">
                <Icon path={ICONS.CHEVRON_DOWN} />
              </button>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider text-gray-400">PLAYING IN {room?.id}</p>
                 {lastPlayer && <p className="font-bold text-sm">Last action by {lastPlayer}</p>}
              </div>
              <button className="p-2 rounded-full hover:bg-white/10">
                <Icon path={ICONS.MORE_VERTICAL} />
              </button>
            </header>

            <div className="flex-grow flex items-center justify-center my-4">
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-full aspect-square rounded-lg shadow-2xl object-cover"
              />
            </div>

            <div className="flex justify-between items-center w-full mb-4">
              <div>
                <h1 className="text-2xl font-bold truncate max-w-xs">{currentTrack.title}</h1>
                <p className="text-gray-400 truncate max-w-xs">{currentTrack.artist}</p>
              </div>
              <button onClick={() => setIsLiked(!isLiked)} className={`p-2 rounded-full hover:bg-white/10 transition-colors ${isLiked ? 'text-green-500' : 'text-gray-400'}`}>
                <Icon path={ICONS.HEART} className="w-7 h-7" />
              </button>
            </div>

            <div className="w-full mb-4">
              <input
                type="range"
                min={0}
                max={safeDuration}
                value={safePlayedSeconds}
                onMouseDown={() => setIsSeeking(true)}
                onChange={(e) => handleSeekChange(Number(e.target.value))}
                onMouseUp={(e) => handleSeekMouseUp(Number(e.target.value))}
                onTouchStart={() => setIsSeeking(true)}
                onTouchEnd={(e) => handleSeekMouseUp(Number(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer accent-white"
                style={{ background: `linear-gradient(to right, white ${(safePlayedSeconds / safeDuration) * 100}%, rgb(55 65 81) ${(safePlayedSeconds / safeDuration) * 100}%)` }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{formatTime(safePlayedSeconds)}</span>
                <span>{formatTime(safeDuration)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center w-full mb-8">
              <button className="p-2 text-gray-400 rounded-full hover:bg-white/10"><Icon path={ICONS.SHUFFLE} /></button>
              <button className="p-2 rounded-full hover:bg-white/10"><Icon path={ICONS.SKIP_PREVIOUS} className="w-10 h-10" /></button>
              <button onClick={handlePlayPause} className="bg-white text-black rounded-full p-4 mx-2 shadow-lg hover:scale-105 transition-transform">
                {loading ? <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div> : <Icon path={playing ? ICONS.PAUSE : ICONS.PLAY} className="w-8 h-8" />}
              </button>
              <button onClick={emitNext} className="p-2 rounded-full hover:bg-white/10"><Icon path={ICONS.SKIP_NEXT} className="w-10 h-10" /></button>
              <button className="p-2 text-gray-400 rounded-full hover:bg-white/10"><Icon path={ICONS.REPEAT} /></button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
        input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; background: transparent; }
        input[type=range]:focus { outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; height: 12px; width: 12px; background: #fff; border-radius: 50%; cursor: pointer;  }
        input[type=range]::-moz-range-thumb { height: 12px; width: 12px; background: #fff; border-radius: 50%; cursor: pointer; }
      `}</style>
    </>
  );
}

export default Player;
