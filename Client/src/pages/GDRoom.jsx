import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import WaitingRoom from '../components/gd/WaitingRoom/WaitingRoom';
import LiveRoom from '../components/gd/LiveRoom/LiveRoom';

/**
 * GDRoom is the top-level page for a meeting.
 * It is reached via two paths:
 *  1. Normal: User creates/joins from lobby  → WaitingRoom → LiveRoom
 *  2. Invite: User opens a shared link       → WaitingRoom → LiveRoom
 *
 * The `id` param from the URL is the room ID.
 * Any user with the link can join as long as the room exists on the backend.
 */
const GDRoom = () => {
  const { id } = useParams();
  const [hasJoined, setHasJoined] = useState(false);
  const [localStream, setLocalStream] = useState(null);

  const handleJoin = (stream) => {
    setLocalStream(stream);
    setHasJoined(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {!hasJoined ? (
        <WaitingRoom roomId={id} onJoin={handleJoin} />
      ) : (
        <LiveRoom roomId={id} localStream={localStream} />
      )}
    </div>
  );
};

export default GDRoom;
