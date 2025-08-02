import { create } from "zustand"
import { io } from "socket.io-client";
import { useUserStore } from "./user";
import { useRoomStore } from "./room";
import { useUIStore } from "./ui";

export const useSocketStore = create((set, get) => ({
    socket: null,
    connect: () => {
        if (get().socket) return;
        const socket = io(__API_BASE_URL__);
        set({ socket });

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            const { room } = useRoomStore.getState();
            const { user } = useUserStore.getState();
            if (room && room.id && user) {
                useRoomStore.getState().joinRoom(room.id, user);
            }
        });

        // Centralized listeners that update the room store
        socket.on("play", ({ track, time, user }) => {
            useRoomStore.getState().setPlaybackState({ 
                currentTrack: track, 
                playing: true, 
                lastPlayer: user, 
                playedSeconds: time ?? 0,
                internalSeek: true // Flag to force player seek
            });
        });

        socket.on("pause", ({ time }) => {
            useRoomStore.getState().setPlaybackState({ playing: false, playedSeconds: time ?? 0 });
        });

        socket.on("seek", ({ time }) => {
            // useUIStore.getState().setLoading(true);
            useRoomStore.getState().setPlaybackState({ playedSeconds: time ?? 0, internalSeek: true });
        });
        
        socket.on("participants", (p) => useRoomStore.getState().setRoom({ participants: p }));
        socket.on("queue", (q) => useRoomStore.getState().setRoom({ queue: q }));
    },
    disconnect: () => {
        get().socket?.disconnect();
        set({ socket: null });
    }
}));