import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Mic, MicOff, Video, VideoOff,
  PhoneOff, Hand, MessageSquare, Bot, Send, X,
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
      className={`relative min-h-0 min-w-0 aspect-video overflow-hidden rounded-xl border-2 bg-slate-900 transition-colors sm:aspect-auto ${
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
          className="absolute inset-0 h-full w-full object-cover"
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
  const [showChat, setShowChat] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(min-width: 640px)').matches;
  });
  const [chatDraft, setChatDraft] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'moderator-welcome',
      userId: 'moderator',
      name: 'AI Moderator',
      message: 'Welcome everyone. The discussion is now live. Please introduce yourselves and begin.',
      isModerator: true,
    },
  ]);
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

  useEffect(() => {
    if (!socket) return undefined;

    const handleChatMessage = (message) => {
      setChatMessages((current) => {
        if (current.some((item) => item.id === message.id)) return current;
        return [...current, { ...message, isSelf: message.userId === userId }];
      });
    };

    socket.on('chat-message', handleChatMessage);
    return () => socket.off('chat-message', handleChatMessage);
  }, [socket, userId]);

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

  const handleSendChat = (event) => {
    event.preventDefault();
    const message = chatDraft.trim();
    if (!socket || !isConnected || !message) return;

    socket.emit('chat-message', { roomId, userId, name: 'You', message });
    setChatDraft('');
  };

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
      <header className="min-h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between gap-3 px-3 py-2 sm:px-6 shrink-0">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Live</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <h1 className="truncate text-xs font-bold text-slate-100 sm:text-sm">Room: {roomId}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Copy Link — in the header for easy access */}
          <button
            onClick={handleCopyLink}
            className="flex min-h-9 items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 sm:px-3"
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
        <div className={`min-w-0 flex-1 overflow-hidden p-2 transition-all duration-300 sm:p-4 ${showChat ? 'md:mr-[320px]' : ''}`}>
          <div
            className="grid min-h-0 grid-cols-1 content-start gap-3 overflow-y-auto sm:h-full sm:grid-cols-2 sm:auto-rows-fr sm:gap-4 sm:overflow-hidden"
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
        {showChat && (
        <button
          type="button"
          aria-label="Close live chat"
          onClick={() => setShowChat(false)}
          className="fixed inset-0 z-10 cursor-default bg-black/20 md:hidden"
        />
        )}
        <div
          className={`mobile-chat-panel absolute right-0 top-16 bottom-20 z-20 flex w-full max-w-[320px] flex-col border-l border-slate-800 bg-slate-900 transition-transform duration-300 ${
            showChat ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" /> Live Transcript
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Users className="w-3.5 h-3.5" />
                {1 + remoteParticipantEntries.length}
              </div>
              <button type="button" onClick={() => setShowChat(false)} aria-label="Close chat" className="inline-flex items-center gap-1 rounded-lg p-1.5 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
                <X className="h-4 w-4" />
                <span className="sm:hidden">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {chatMessages.map((item) => (
              <div key={item.id} className="flex flex-col gap-1">
                <span className={`flex items-center gap-1 text-xs font-semibold ${item.isModerator ? 'text-indigo-400' : item.isSelf ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {item.name} {item.isModerator && <Bot className="h-3 w-3" />}
                </span>
                <p className={`rounded-lg border p-2 text-sm text-slate-300 ${item.isModerator ? 'border-slate-700/50 bg-slate-800/50' : item.isSelf ? 'border-emerald-900/30 bg-emerald-950/30' : 'border-slate-700/50 bg-slate-800/50'}`}>
                  {item.message}
                </p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="relative z-30 flex gap-2 border-t border-slate-800 p-3">
            <input
              value={chatDraft}
              onChange={(event) => setChatDraft(event.target.value)}
              placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
              disabled={!isConnected}
              maxLength={500}
              className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-indigo-500 disabled:opacity-50"
            />
            <button type="submit" disabled={!isConnected || !chatDraft.trim()} aria-label="Send message" className="rounded-lg bg-indigo-600 px-3 text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* ── Bottom Control Bar ─────────────────────────────────────────────── */}
      <footer className="min-h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-center px-3 py-3 sm:px-6 shrink-0 relative z-10">
        <div className="flex max-w-full items-center gap-2 sm:gap-3">

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
            type="button"
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

          <div className="mx-0.5 h-8 w-px bg-slate-700 sm:mx-1" />

          {/* Leave */}
          <button
            onClick={handleLeave}
            className="flex h-12 items-center gap-2 rounded-full bg-red-600 px-4 py-2.5 font-semibold text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all hover:bg-red-500 sm:px-6"
          >
            <PhoneOff className="h-5 w-5" /><span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </footer>

      {/* ── Toast notification ─────────────────────────────────────────────── */}
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
};

export default LiveRoom;
