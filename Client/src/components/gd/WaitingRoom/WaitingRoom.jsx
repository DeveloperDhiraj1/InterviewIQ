import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, Play, Users, Link as LinkIcon, Settings, CheckCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';

const WaitingRoom = ({ roomId, onJoin }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null); // single source of truth for the stream object

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [mediaError, setMediaError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  // ── Acquire media ──────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const getMedia = async () => {
      setIsLoading(true);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!isMounted) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = mediaStream;
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
        setIsLoading(false);
        setMediaError(null);
      } catch (err) {
        if (!isMounted) return;
        console.error('[WaitingRoom] getUserMedia failed:', err.name, err.message);
        setIsVideoEnabled(false);
        setIsAudioEnabled(false);
        setIsLoading(false);

        if (err.name === 'NotAllowedError') {
          setMediaError('Camera/microphone permission denied. Please allow access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setMediaError('No camera or microphone found on this device.');
        } else {
          setMediaError(`Media error: ${err.message}`);
        }
      }
    };

    getMedia();

    return () => {
      isMounted = false;
      // Do NOT stop tracks here — the stream is passed into LiveRoom
    };
  }, []);

  // ── Camera toggle ──────────────────────────────────────────────────────────
  // BUG FIX ROOT CAUSE: The old code only set track.enabled = false, which
  // freezes the video frame but does NOT release the camera hardware.
  // When trying to turn it back ON, the track is still "live" but frozen,
  // so re-enabling doesn't restart the feed.
  // FIX: Stop the video track (release the device), then re-acquire via getUserMedia.
  const toggleVideo = useCallback(async () => {
    const stream = streamRef.current;
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];

    if (videoTrack && videoTrack.readyState === 'live') {
      // Turn camera OFF → stop the track to release hardware
      videoTrack.stop();
      stream.removeTrack(videoTrack);
      if (videoRef.current) videoRef.current.srcObject = new MediaStream(stream.getTracks());
      setIsVideoEnabled(false);
    } else {
      // Turn camera ON → re-acquire
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = newStream.getVideoTracks()[0];
        stream.addTrack(newVideoTrack);
        if (videoRef.current) videoRef.current.srcObject = new MediaStream(stream.getTracks());
        setIsVideoEnabled(true);
      } catch (err) {
        console.error('[WaitingRoom] Failed to re-enable camera:', err);
        setMediaError('Could not re-enable camera. Please check permissions.');
      }
    }
  }, []);

  // ── Mic toggle ─────────────────────────────────────────────────────────────
  // BUG FIX ROOT CAUSE: The old code toggled track.enabled but the effect
  // was not reliably reflected in the video element's muted state.
  // FIX: Directly mutate track.enabled (correct approach for mic — no renegotiation needed).
  const toggleAudio = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setIsAudioEnabled(audioTrack.enabled);
  }, []);

  // ── Copy invite link ──────────────────────────────────────────────────────
  // BUG FIX ROOT CAUSE: The button had no onClick handler — it was a no-op.
  // FIX: Use the Clipboard API with a textarea fallback for older browsers.
  const handleCopyLink = useCallback(async () => {
    const meetingUrl = `${window.location.origin}/gd/room/${roomId}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(meetingUrl);
      } else {
        // Fallback for non-HTTPS or older browsers
        const textArea = document.createElement('textarea');
        textArea.value = meetingUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (err) {
      console.error('[WaitingRoom] Failed to copy link:', err);
    }
  }, [roomId]);

  // ── Join ─────────────────────────────────────────────────────────────────
  const handleJoinClick = () => {
    onJoin(streamRef.current);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen items-center justify-center p-6 gap-8 bg-slate-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Left side: Camera Preview */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl relative"
      >
        <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden relative flex items-center justify-center">
          {/* Video always rendered in DOM, hidden by CSS when off (preserves srcObject) */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transform scale-x-[-1] ${isVideoEnabled ? 'block' : 'hidden'}`}
          />

          {!isVideoEnabled && !isLoading && (
            <div className="flex flex-col items-center justify-center text-slate-500">
              <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <VideoOff className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-sm">Camera is off</p>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center text-slate-500">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Accessing camera...</p>
            </div>
          )}

          {mediaError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 p-6 text-center">
              <p className="text-sm text-red-400">{mediaError}</p>
            </div>
          )}

          {/* Controls overlay */}
          {!isLoading && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
              <button
                onClick={toggleAudio}
                title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                className={`p-4 rounded-full flex items-center justify-center transition-all shadow-lg backdrop-blur-md ${
                  isAudioEnabled
                    ? 'bg-slate-800/80 hover:bg-slate-700 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleVideo}
                title={isVideoEnabled ? 'Turn camera off' : 'Turn camera on'}
                className={`p-4 rounded-full flex items-center justify-center transition-all shadow-lg backdrop-blur-md ${
                  isVideoEnabled
                    ? 'bg-slate-800/80 hover:bg-slate-700 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Right side: Room Info & Join */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-sm flex flex-col gap-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Ready to join?</h1>
          <p className="text-slate-400 text-sm font-mono">Room ID: {roomId}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3 text-slate-300">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Waiting room</span>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {/* ── Copy Link Button (now functional) ── */}
            <button
              onClick={handleCopyLink}
              className="text-sm flex items-center gap-2 transition-colors px-3 py-1.5 rounded-lg"
              style={{
                color: copySuccess ? '#34d399' : '#818cf8',
              }}
            >
              {copySuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4" />
                  Copy Invite Link
                </>
              )}
            </button>
            <button className="text-sm text-slate-400 hover:text-slate-300 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Settings
            </button>
          </div>
        </div>

        <button
          onClick={handleJoinClick}
          disabled={isLoading}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all hover:scale-[1.02] flex items-center justify-center gap-2 text-lg"
        >
          {isLoading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Join Discussion <Play className="w-5 h-5" />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
};

export default WaitingRoom;
