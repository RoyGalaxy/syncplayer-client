import { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";

function Player({ track, setCurrentTrack, socket, room, user }) {
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [internalSeek, setInternalSeek] = useState(false);
  const [lastPlayer, setLastPlayer] = useState(null);
  const [duration, setDuration] = useState(1);
  const [minimized, setMinimized] = useState(false);

  // Emit play event
  const handlePlay = () => {
    if (!room || !track) return;
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

  // Emit seek event
  const handleSeek = (time) => {
    if (!room || !track) return;
    socket.emit("seek", {
      roomId: room.id,
      time,
    });
    setPlayedSeconds(time);
    setInternalSeek(true);
  };

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
    if (!socket) return;
    // Play event
    const onPlay = ({ track: t, time, user: who }) => {
      console.log("play event received", t, time, who);
      setCurrentTrack(t)
      setPlaying(true);
      setLastPlayer(who);
      setPlayedSeconds(time ?? 0);
      setInternalSeek(true);
    };
    // Pause event
    const onPause = ({ time }) => {
      setPlaying(false);
      setPlayedSeconds(time ?? 0);
      setInternalSeek(true);
    };
    // Seek event
    const onSeek = ({ time }) => {
      setPlayedSeconds(time ?? 0);
      setInternalSeek(true);
    };
    // SyncTick event
    const onSyncTick = ({ time, isPlaying, currentTrack }) => {
      if (track && currentTrack && track.id === currentTrack.id) {
        // Only sync if out of sync by >1s
        if (Math.abs(playedSeconds - time) > 1) {
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
    // eslint-disable-next-line
  }, [socket, track, playedSeconds]);

  // Ensure player always plays/pauses and seeks when state changes (for remote sync)
  useEffect(() => {
    if (!playerRef.current) return;
    if (internalSeek && typeof playerRef.current.seekTo === "function") {
      playerRef.current.seekTo(playedSeconds, "seconds");
      setInternalSeek(false);
    }
    // If playing state changes, ensure ReactPlayer is updated
    // (ReactPlayer will handle this via the 'playing' prop, but this ensures no race conditions)
  }, [internalSeek, playedSeconds, playing]);

  // Reset state when track changes
  useEffect(() => {
    setPlayedSeconds(0);
    setDuration(1);
    setPlaying(false);
    setLastPlayer(null);
  }, [track?.id]);

  if (!track) {
    return <div className="text-gray-400 text-center">No track selected</div>;
  }

  // Ensure playedSeconds and duration are always numbers and defined
  const safePlayedSeconds = Number.isFinite(playedSeconds) ? playedSeconds : 0;
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 1;

  // Format time helper
  const formatTime = s => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Minimized bar
  if (minimized) {
    return (
      <div className="fixed bottom-0 left-0 w-full bg-gray-900/90 flex items-center justify-between px-4 py-2 shadow-lg z-50 cursor-pointer" onClick={() => setMinimized(false)}>
        <div className="flex items-center gap-3">
          <img src={track.thumbnail} alt={track.title} className="w-10 h-10 rounded" />
          <div>
            <div className="font-semibold text-sm truncate max-w-[120px]">{track.title}</div>
            <div className="text-gray-400 text-xs truncate max-w-[120px]">{track.artist}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {playing ? (
            <button className="bg-green-500 hover:bg-green-600 transition px-2 py-1 rounded-full text-white" onClick={e => {e.stopPropagation(); handlePause();}} title="Pause">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
              </svg>
            </button>
          ) : (
            <button className="bg-green-500 hover:bg-green-600 transition px-2 py-1 rounded-full text-white" onClick={e => {e.stopPropagation(); handlePlay();}} title="Play">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l14 8-14 8V4z" />
              </svg>
            </button>
          )}
          <button className="bg-gray-700 hover:bg-gray-600 transition px-2 py-1 rounded-full text-white" onClick={e => {e.stopPropagation(); setMinimized(false);}} title="Expand">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 w-full h-full md:h-1/2 md:w-1/2 md:right-0 md:left-auto md:bottom-0 z-50 flex items-end md:items-center justify-center transition-all duration-300">
      <div className="relative w-full h-full md:h-[90%] md:w-full flex flex-col justify-center items-center">
        <button
          className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 transition p-2 rounded-full text-white z-10"
          onClick={() => setMinimized(true)}
          title="Minimize"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 18h16" />
          </svg>
        </button>
        <div className="w-full flex justify-center h-full items-center">
          <div className="backdrop-blur bg-gray-800/80 rounded-2xl shadow-2xl flex flex-col items-center p-6 max-w-xl w-full mx-2">
            <div className="relative mb-4">
              <img
                src={track.thumbnail}
                alt={track.title}
                className={`w-32 h-32 md:w-40 md:h-40 object-cover rounded-xl shadow-lg transition-all duration-300 ${playing ? 'ring-4 ring-green-400/60' : ''}`}
              />
              {lastPlayer && (
                <span className="absolute top-2 left-2 bg-green-500/90 text-xs text-white px-2 py-0.5 rounded-full shadow">Played by {lastPlayer}</span>
              )}
            </div>
            <div className="text-center mb-2">
              <div className="text-xl md:text-2xl font-bold truncate max-w-xs">{track.title}</div>
              <div className="text-gray-400 text-base md:text-lg truncate max-w-xs">{track.artist}</div>
            </div>
            <div className="flex items-center w-full gap-2 mb-2">
              <span className="text-xs text-gray-300 w-10 text-right">{formatTime(safePlayedSeconds)}</span>
              <input
                type="range"
                min={0}
                max={safeDuration}
                value={safePlayedSeconds}
                onChange={e => handleSeek(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg accent-green-400"
              />
              <span className="text-xs text-gray-300 w-10 text-left">{formatTime(safeDuration)}</span>
            </div>
            <div className="flex justify-center items-center gap-6 mt-2">
              <button
                className="bg-gray-700 hover:bg-gray-600 transition px-3 py-2 rounded-full shadow text-white text-xl"
                onClick={handleNext}
                title="Next"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.25 6.75v10.5m-6.5-10.5l7.5 5.25-7.5 5.25V6.75z" />
                </svg>
              </button>
              {playing ? (
                <button
                  className="bg-green-500 hover:bg-green-600 transition px-6 py-2 rounded-full shadow text-white text-2xl font-bold"
                  onClick={handlePause}
                  title="Pause"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
                  </svg>
                </button>
              ) : (
                <button
                  className="bg-green-500 hover:bg-green-600 transition px-6 py-2 rounded-full shadow text-white text-2xl font-bold"
                  onClick={handlePlay}
                  title="Play"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l14 8-14 8V4z" />
                  </svg>
                </button>
              )}
            </div>
            {/* Hidden ReactPlayer */}
            <ReactPlayer
              ref={playerRef}
              src={track.id ? `https://www.youtube.com/watch?v=${track.id}` : ""}
              playing={playing}
              controls={false}
              width={0}
              height={0}
              style={{ display: "none" }}
              onProgress={({ playedSeconds: ps }) => setPlayedSeconds(Number.isFinite(ps) ? ps : 0)}
              onDuration={d => setDuration(Number.isFinite(d) && d > 0 ? d : 1)}
              config={{
                youtube: {
                  playerVars: {
                    autoplay: 1,
                    controls: 0,
                    rel: 0,
                    modestbranding: 1,
                    origin: window.location.origin,
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Player; 