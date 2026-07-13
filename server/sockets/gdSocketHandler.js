export const initializeGdSockets = (io) => {
  const gdNamespace = io.of("/gd");

  // Track which socket belongs to which user+room so we can broadcast
  // participant-left on unexpected disconnects (network drop, browser close)
  const socketMeta = new Map(); // socketId -> { roomId, userId }

  gdNamespace.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ── Join Room ────────────────────────────────────────────────────────────
    socket.on("join-room", ({ roomId, userId }) => {
      if (!roomId || !userId) return;

      socket.join(roomId);
      socketMeta.set(socket.id, { roomId, userId });

      console.log(`[Socket] ${userId} joined room ${roomId}`);

      // Tell all OTHER members of the room that someone new arrived
      socket.to(roomId).emit("participant-joined", { userId, socketId: socket.id });
    });

    // ── Leave Room (graceful) ────────────────────────────────────────────────
    socket.on("leave-room", ({ roomId, userId }) => {
      socket.leave(roomId);
      socketMeta.delete(socket.id);

      console.log(`[Socket] ${userId} left room ${roomId}`);
      socket.to(roomId).emit("participant-left", { userId, socketId: socket.id });
    });

    // ── WebRTC Signaling passthrough ─────────────────────────────────────────
    // We relay directly to the room — receivers filter by receiverId on the client

    socket.on("webrtc-offer", ({ roomId, offer, senderId, receiverId }) => {
      if (!roomId || !offer) return;
      socket.to(roomId).emit("webrtc-offer", { offer, senderId, receiverId });
    });

    socket.on("webrtc-answer", ({ roomId, answer, senderId, receiverId }) => {
      if (!roomId || !answer) return;
      socket.to(roomId).emit("webrtc-answer", { answer, senderId, receiverId });
    });

    socket.on("webrtc-ice-candidate", ({ roomId, candidate, senderId, receiverId }) => {
      if (!roomId || !candidate) return;
      socket.to(roomId).emit("webrtc-ice-candidate", { candidate, senderId, receiverId });
    });

    // ── Disconnect (handle network drops / tab close) ────────────────────────
    // BUG FIX: Previously we did nothing on disconnect, so remote peers never
    // removed the departed user's video tile or closed the PeerConnection.
    socket.on("disconnect", (reason) => {
      const meta = socketMeta.get(socket.id);
      if (meta) {
        const { roomId, userId } = meta;
        console.log(`[Socket] ${userId} disconnected (${reason}) from room ${roomId}`);
        // Notify remaining peers so they can close the RTCPeerConnection
        socket.to(roomId).emit("participant-left", { userId, socketId: socket.id });
        socketMeta.delete(socket.id);
      }
    });
  });
};
