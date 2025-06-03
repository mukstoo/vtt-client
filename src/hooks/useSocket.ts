import { useEffect, useState } from 'react';
import { socketService } from '../services/socket';
import type { Socket } from 'socket.io-client';

export function useSocket(): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Access the socket through the private property
    // Since TypeScript doesn't allow accessing private members, we'll cast to any
    const currentSocket = (socketService as any).socket as Socket | null;
    setSocket(currentSocket);

    // Update socket reference when connection changes
    const checkConnection = () => {
      const updatedSocket = (socketService as any).socket as Socket | null;
      setSocket(updatedSocket);
    };

    // Set up a periodic check or listen to connection events
    const interval = setInterval(checkConnection, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return socket;
} 