function TrackCard({ track, onPlay }) {
  return (
    <div className="bg-gray-800 rounded-lg shadow p-4 flex flex-col items-center">
      <img src={track.thumbnail} alt={track.title} className="w-32 h-32 object-cover rounded mb-3" />
      <div className="text-lg font-semibold mb-1">{track.title}</div>
      <div className="text-gray-400 mb-2">{track.artist}</div>
      <button
        onClick={onPlay}
        className="bg-green-500 px-4 py-1 rounded font-semibold hover:bg-green-600"
      >
        Play
      </button>
    </div>
  );
}

export default TrackCard; 