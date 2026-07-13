import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useSocket = (namespace = '/gd') => {
  const [isConnected, setIsConnected] = useState(false);
  // We expose socket as STATE so consumers re-render when it becomes available
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const sock = io(`${SOCKET_SERVER_URL}${namespace}`, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = sock;
    setSocket(sock); // expose instance immediately so hooks can set up listeners

    sock.on('connect', () => {
      console.log('[Socket] Connected:', sock.id);
      setIsConnected(true);
    });

    sock.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    sock.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    return () => {
      sock.removeAllListeners();
      sock.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [namespace]);

  return { socket, isConnected };
};
