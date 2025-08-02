import { create } from "zustand"
import { persist } from 'zustand/middleware';
import { useSocketStore } from "./socket";
import { useUserStore } from "./user";
import { useUIStore } from "./ui";

export const useRoomStore = create(
  persist(
    (set, get) => ({
      room: null,
      currentTrack: null,
      roomCodeInput: "",
      // Playback State
      playing: false,
      playedSeconds: 0,
      duration: 1,
      lastPlayer: null,
      internalSeek: false,

      setRoomCodeInput: (value) => set({ roomCodeInput: value }),
      // Single function to update playback state
      setPlaybackState: (newState) => set(newState),
      setInternalSeek: (value) => set({ internalSeek: value }),
      setRoom: (room) => set((state) => ({ room: room ? { ...state.room, ...room } : null })),

      emitPlay: () => {
        const { socket } = useSocketStore.getState();
        const { room, currentTrack, playedSeconds } = get();
        const { user } = useUserStore.getState();
        if (!socket || !room || !currentTrack) return;
        useUIStore.getState().setLoading(true);
        socket.emit("play", { roomId: room.id, track: currentTrack, time: playedSeconds, user });
      },
      emitPause: (time) => {
        const { socket } = useSocketStore.getState();
        const { room } = get();
        if (!socket || !room) return;
        socket.emit("pause", { roomId: room.id, time });
      },
      emitSeek: (time) => {
        const { socket } = useSocketStore.getState();
        const { room } = get();
        if (!socket || !room) return;
        socket.emit("seek", { roomId: room.id, time });
      },
      playTrack: (track) => {
        const { socket } = useSocketStore.getState();
        const { room } = get();
        const { user } = useUserStore.getState();
        const { setLoading } = useUIStore.getState();

        if (!socket || !room || !track) return;
        setLoading(true);
        socket.emit("play", { roomId: room.id, track, time: 0, user });
        set({ currentTrack: track });
      },

      createRoom: (username) => {
        const { socket } = useSocketStore.getState();
        if (!socket) return;
        const { setError } = useUIStore.getState();
        const { setUser } = useUserStore.getState();

        if (!username.trim()) return setError("Please enter a username.");
        setError(null);

        socket.emit("createRoom", username, (roomId) => {
          const roomObj = { id: roomId, queue: [], participants: [], currentTrack: null };
          set({ room: roomObj, roomCodeInput: roomId, currentTrack: null });
          setUser(username);
          get().joinRoom(roomId, username);
        });
      },

      joinRoom: (roomId, username) => {
        const { socket } = useSocketStore.getState();
        if (!socket) return;
        const { setError, setJoining } = useUIStore.getState();
        const { setUser } = useUserStore.getState();

        if (!roomId.trim() || !username.trim()) return setError("Please enter a room code and username.");
        setError(null);
        setJoining(true);

        socket.emit("joinRoom", { roomId, user: username }, (res) => {
          setJoining(false);
          if (res?.error) {
            setError(res.error);
            set({ room: null, currentTrack: null });
            return;
          }
          const roomObj = { ...res.room, id: roomId };
          set({ room: roomObj, roomCodeInput: roomId, currentTrack: res.room.currentTrack });
          setUser(username);
        });
      },

      leaveRoom: () => {
        set({ room: null, roomCodeInput: "", currentTrack: null });
      },
    }),
    {
      name: 'syncplayer-room-storage',
      partialize: (state) => ({ room: state.room, currentTrack: state.currentTrack }),
    }
  )
);