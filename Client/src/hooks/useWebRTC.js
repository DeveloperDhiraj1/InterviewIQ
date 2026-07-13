import { useEffect, useRef, useState, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const useWebRTC = (socket, roomId, userId) => {
  // localStreamRef is the SINGLE source of truth for our local media tracks
  const localStreamRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});

  // peersRef: userId -> RTCPeerConnection
  const peersRef = useRef({});

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Replace a track in all existing peer connections.
   * This is the key function that fixes camera/mic re-enable.
   */
  const replaceTrackInPeers = useCallback((newTrack, kind) => {
    Object.values(peersRef.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === kind);
      if (sender && newTrack) {
        sender.replaceTrack(newTrack).catch((err) =>
          console.error(`[WebRTC] replaceTrack(${kind}) failed:`, err)
        );
      }
    });
  }, []);

  // ─── Media Control ──────────────────────────────────────────────────────────

  /**
   * Acquire initial media stream (called once by WaitingRoom).
   */
  const startLocalStream = useCallback(async (video = true, audio = true) => {
    // Stop existing tracks first to prevent duplicates / "device in use" errors
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('[WebRTC] getUserMedia failed:', err);
      return null;
    }
  }, []);

  /**
   * Toggle camera.
   * BUG FIX: Simply disabling `track.enabled` leaves the camera LED on.
   * Stopping the track kills the device. To "turn camera back on" we must
   * call getUserMedia again for video only, then replaceTrack() on each peer.
   */
  const toggleCamera = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return false;

    const videoTrack = stream.getVideoTracks()[0];

    if (videoTrack && videoTrack.readyState === 'live') {
      // Camera is ON → turn it OFF (stop the track, release the device)
      videoTrack.stop();
      stream.removeTrack(videoTrack);

      // Null out video sender in peers so remote side gets a black frame
      Object.values(peersRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(null).catch(() => {});
      });

      // Sync state
      setLocalStream(new MediaStream(stream.getTracks()));
      return false; // camera is now OFF
    } else {
      // Camera is OFF → turn it back ON
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = newStream.getVideoTracks()[0];

        // Add to existing stream
        if (videoTrack) stream.removeTrack(videoTrack);
        stream.addTrack(newVideoTrack);

        // Replace in all peer connections
        replaceTrackInPeers(newVideoTrack, 'video');

        setLocalStream(new MediaStream(stream.getTracks()));
        return true; // camera is now ON
      } catch (err) {
        console.error('[WebRTC] Failed to re-acquire camera:', err);
        return false;
      }
    }
  }, [replaceTrackInPeers]);

  /**
   * Toggle microphone.
   * BUG FIX: We use `track.enabled` (not stop/start) for mic, because
   * stopping the audio track on some browsers silences the entire stream.
   * We simply mute/unmute in place — no renegotiation needed.
   */
  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return false;

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return false;

    audioTrack.enabled = !audioTrack.enabled;
    return audioTrack.enabled; // true = unmuted
  }, []);

  /**
   * Clean up everything: stop tracks, close peers, remove socket listeners.
   */
  const cleanup = useCallback(() => {
    // Stop all local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    // Close all peer connections
    Object.entries(peersRef.current).forEach(([id, pc]) => {
      pc.close();
      delete peersRef.current[id];
    });

    setRemoteStreams({});
  }, []);

  // ─── Peer Management ────────────────────────────────────────────────────────

  const createPeerConnection = useCallback(
    (targetUserId) => {
      // Close any existing connection to avoid duplicates
      if (peersRef.current[targetUserId]) {
        peersRef.current[targetUserId].close();
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add current local tracks to the new connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('webrtc-ice-candidate', {
            roomId,
            candidate: event.candidate,
            senderId: userId,
            receiverId: targetUserId,
          });
        }
      };

      pc.ontrack = (event) => {
        const incomingStream = event.streams[0];
        if (incomingStream) {
          setRemoteStreams((prev) => ({ ...prev, [targetUserId]: incomingStream }));
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (
          pc.iceConnectionState === 'disconnected' ||
          pc.iceConnectionState === 'failed'
        ) {
          console.warn(`[WebRTC] ICE ${pc.iceConnectionState} for peer ${targetUserId}`);
        }
      };

      peersRef.current[targetUserId] = pc;
      return pc;
    },
    [roomId, socket, userId]
  );

  const handleUserJoined = useCallback(
    async (newUserId) => {
      console.log('[WebRTC] Initiating call to', newUserId);
      const pc = createPeerConnection(newUserId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc-offer', { roomId, offer, senderId: userId, receiverId: newUserId });
    },
    [createPeerConnection, roomId, socket, userId]
  );

  // ─── Socket event listeners ─────────────────────────────────────────────────

  useEffect(() => {
    if (!socket) return;

    const onParticipantJoined = ({ userId: newUserId }) => {
      if (newUserId !== userId) handleUserJoined(newUserId);
    };

    const onOffer = async ({ offer, senderId, receiverId }) => {
      if (receiverId !== userId) return;
      const pc = createPeerConnection(senderId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc-answer', { roomId, answer, senderId: userId, receiverId: senderId });
    };

    const onAnswer = async ({ answer, senderId, receiverId }) => {
      if (receiverId !== userId) return;
      const pc = peersRef.current[senderId];
      if (pc && pc.signalingState !== 'stable') {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const onIceCandidate = async ({ candidate, senderId, receiverId }) => {
      if (receiverId !== userId) return;
      const pc = peersRef.current[senderId];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[WebRTC] addIceCandidate error (safe to ignore):', e.message);
        }
      }
    };

    const onParticipantLeft = ({ userId: leftUserId }) => {
      if (peersRef.current[leftUserId]) {
        peersRef.current[leftUserId].close();
        delete peersRef.current[leftUserId];
      }
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[leftUserId];
        return next;
      });
    };

    // Register — use named functions so we can remove them precisely
    socket.on('participant-joined', onParticipantJoined);
    socket.on('webrtc-offer', onOffer);
    socket.on('webrtc-answer', onAnswer);
    socket.on('webrtc-ice-candidate', onIceCandidate);
    socket.on('participant-left', onParticipantLeft);

    return () => {
      // Remove ONLY our listeners — avoids double-firing on hot reload
      socket.off('participant-joined', onParticipantJoined);
      socket.off('webrtc-offer', onOffer);
      socket.off('webrtc-answer', onAnswer);
      socket.off('webrtc-ice-candidate', onIceCandidate);
      socket.off('participant-left', onParticipantLeft);
    };
  }, [socket, userId, roomId, createPeerConnection, handleUserJoined]);

  return {
    localStream,
    localStreamRef,
    remoteStreams,
    startLocalStream,
    toggleCamera,
    toggleMic,
    cleanup,
  };
};
