import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Mic, MicOff, Video, VideoOff,
  PhoneOff, Hand, MessageSquare, Bot,
  Link as LinkIcon, CheckCircle, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../../hooks/useSocket';
import { useWebRTC } from '../../../hooks/useWebRTC';

// ─── Utility: render a participant's video into a <video> element ─────────────
const VideoTile = ({ stream, name, isSpeaking, isAI, isSelf }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={`relative bg-slate-900 rounded-xl overflow-hidden border-2 transition-colors ${
        isSpeaking
          ? 'border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)]'
          : 'border-slate-800'
      }`}
    >
      {stream ? (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={isSelf} // never echo local audio
          className="w-full h-full object-cover"
          style={isSelf ? { transform: 'scaleX(-1)' } : {}}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-3xl font-bold text-slate-500">
            {name?.charAt(0)?.toUpperCase()}
          </div>
        </div>
      )}

      {/* Name tag */}
      <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-2">
        <span className="text-sm font-medium text-slate-200">{name}</span>
        {isAI && <Bot className="w-4 h-4 text-indigo-400" />}
      </div>

      {/* Speaking animation */}
      {isSpeaking && (
        <div className="absolute top-3 right-3 flex items-end gap-0.5 h-5">
          {[0.8, 0.5, 1.0, 0.6].map((delay, i) => (
            <motion.div
              key={i}
              animate={{ scaleY: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 0.8, delay }}
              className="w-1.5 bg-indigo-500 rounded-full origin-bottom"
              style={{ height: '16px' }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ message, visible }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 30 }}
    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-xl pointer-events-none"
  >
    {message}
  </motion.div>
);

// ─── LiveRoom Component ────────────────────────────────────────────────────────
const LiveRoom = ({ roomId, localStream: initialStream }) => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket('/gd');

  // We get a real userId from auth; fallback to a random ID for this session
  const userId = useRef(`user-${Math.random().toString(36).substr(2, 9)}`).current;

  const {
    localStream,
    localStreamRef,
    remoteStreams,
    startLocalStream,
    toggleCamera,
    toggleMic,
    cleanup,
  } = useWebRTC(socket, roomId, userId);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });

  // ── Initialize the stream passed from WaitingRoom ──────────────────────────
  useEffect(() => {
    if (initialStream) {
      // Inject the waiting-room stream into our WebRTC hook's ref so peers
      // are initialized with the correct tracks immediately
      localStreamRef.current = initialStream;
    } else {
      // If navigated directly via invite link, acquire media fresh
      startLocalStream();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Join the Socket room once connected ────────────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected) return;
    socket.emit('join-room', { roomId, userId });

    return () => {
      socket.emit('leave-room', { roomId, userId });
    };
  }, [socket, isConnected, roomId, userId]);

  // ── Cleanup all media on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // ── Show toast helper ──────────────────────────────────────────────────────
  const showToast = (message, duration = 2500) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), duration);
  };

  // ── Camera toggle ──────────────────────────────────────────────────────────
  const handleToggleCamera = async () => {
    const isNowOn = await toggleCamera();
    setIsCameraOff(!isNowOn);
    showToast(isNowOn ? 'Camera turned on' : 'Camera turned off');
  };

  // ── Mic toggle ─────────────────────────────────────────────────────────────
  const handleToggleMic = () => {
    const isNowEnabled = toggleMic();
    setIsMuted(!isNowEnabled);
    showToast(isNowEnabled ? 'Microphone unmuted' : 'Microphone muted');
  };

  // ── Copy invite link ───────────────────────────────────────────────────────
  // BUG FIX: The old "Copy Link" was a dummy button with no handler.
  const handleCopyLink = useCallback(async () => {
    const meetingUrl = `${window.location.origin}/gd/room/${roomId}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(meetingUrl);
      } else {
        // Fallback for HTTP / older browsers
        const ta = document.createElement('textarea');
        ta.value = meetingUrl;
        ta.style.cssText = 'position:fixed;opacity:0;';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopySuccess(true);
      showToast('Invite link copied successfully.');
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (err) {
      console.error('[LiveRoom] copy failed:', err);
      showToast('Could not copy link. Please copy manually from your address bar.');
    }
  }, [roomId]);

  // ── Leave ──────────────────────────────────────────────────────────────────
  const handleLeave = () => {
    if (socket) socket.emit('leave-room', { roomId, userId });
    cleanup();
    navigate('/gd/lobby');
  };

  // Build participant list for render
  const remoteParticipantEntries = Object.entries(remoteStreams);

  return (
    <div className="h-screen bg-slate-950 flex flex-col font-sans overflow-hidden">

      {/* ── Top Header ─────────────────────────────────────────────────────── */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Live</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <h1 className="text-sm font-bold text-slate-100">Room: {roomId}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Copy Link — in the header for easy access */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            {copySuccess ? (
              <><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Copied!</>
            ) : (
              <><LinkIcon className="w-3.5 h-3.5" /> Invite</>
            )}
          </button>
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 border ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}
          >
            <Bot className="w-3 h-3" />
            {isConnected ? 'Connected' : 'Reconnecting...'}
          </span>
        </div>
      </header>

      {/* ── Main Area ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Video Grid */}
        <div className={`flex-1 p-4 transition-all duration-300 overflow-hidden ${showChat ? 'mr-[320px]' : ''}`}>
          <div
            className="grid gap-4 h-full"
            style={{
              gridTemplateColumns: `repeat(${Math.min(2, 1 + remoteParticipantEntries.length)}, 1fr)`,
            }}
          >
            {/* Local (self) tile */}
            <VideoTile
              stream={localStream || initialStream}
              name="You"
              isSpeaking={!isMuted}
              isSelf={true}
            />

            {/* Remote peers */}
            {remoteParticipantEntries.map(([peerId, stream]) => (
              <VideoTile
                key={peerId}
                stream={stream}
                name={`Participant`}
                isSpeaking={false}
                isSelf={false}
              />
            ))}
          </div>
        </div>

        {/* ── Transcript Sidebar ────────────────────────────────────────────── */}
        <div
          className={`absolute right-0 top-16 bottom-20 w-[320px] bg-slate-900 border-l border-slate-800 flex flex-col transition-transform duration-300 ${
            showChat ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" /> Live Transcript
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Users className="w-3.5 h-3.5" />
              {1 + remoteParticipantEntries.length}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
                AI Moderator <Bot className="w-3 h-3" />
              </span>
              <p className="text-sm text-slate-300 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                Welcome everyone. The discussion is now live. Please introduce yourselves and begin.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-emerald-400">You</span>
              <p className="text-sm text-slate-300 bg-slate-800/50 p-2 rounded-lg border border-emerald-900/30">
                Transcript will appear here as you speak.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Control Bar ─────────────────────────────────────────────── */}
      <footer className="h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-center px-6 shrink-0 relative z-10">
        <div className="flex items-center gap-3">

          {/* Mic */}
          <button
            onClick={handleToggleMic}
            title={isMuted ? 'Unmute' : 'Mute'}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isMuted
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Camera */}
          <button
            onClick={handleToggleCamera}
            title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isCameraOff
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          {/* Raise Hand */}
          <button
            onClick={() => setHandRaised((h) => !h)}
            title="Raise / lower hand"
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              handRaised
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <Hand className="w-5 h-5" />
          </button>

          {/* Chat toggle */}
          <button
            onClick={() => setShowChat(!showChat)}
            title="Toggle transcript"
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              showChat
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          <div className="w-px h-8 bg-slate-700 mx-1" />

          {/* Leave */}
          <button
            onClick={handleLeave}
            className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)]"
          >
            <PhoneOff className="w-5 h-5" /> Leave
          </button>
        </div>
      </footer>

      {/* ── Toast notification ─────────────────────────────────────────────── */}
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
};

export default LiveRoom;
