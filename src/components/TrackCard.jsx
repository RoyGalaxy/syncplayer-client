import React from 'react';

// Helper for icons
const Icon = ({ path, className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d={path} />
  </svg>
);
const PLAY_ICON = "M8 5v14l11-7z";

// This is the redesigned TrackCard component.
// It's designed to be used in a list view.
function TrackCard({ track, onPlay, isPlaying }) {

  // Helper to format time from seconds to MM:SS
  const formatDuration = (seconds) => {
    if (!seconds || !Number.isFinite(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  };

  return (
    <div 
      className={`group flex items-center gap-4 p-2 rounded-lg hover:bg-gray-700/80 transition-all duration-300 cursor-pointer ${isPlaying ? 'bg-green-500/20' : ''}`}
      onClick={onPlay}
    >
      {/* Thumbnail */}
      <div className="relative w-12 h-12 flex-shrink-0">
        <img 
          src={track.thumbnail} 
          alt={track.title} 
          className="w-full h-full rounded-md object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Icon path={PLAY_ICON} className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Title and Artist */}
      <div className="flex-1 overflow-hidden">
        <p className={`font-semibold truncate ${isPlaying ? 'text-green-400' : 'text-white'}`}>
          {track.title}
        </p>
        <p className="text-sm text-gray-400 truncate">{track.artist}</p>
      </div>

      {/* Duration */}
      <div className="text-sm text-gray-400 font-mono pr-2">
        {/* Assuming track object has duration in seconds */}
        {formatDuration(track.duration)}
      </div>
    </div>
  );
}

export default TrackCard;
