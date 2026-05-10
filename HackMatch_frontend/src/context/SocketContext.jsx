import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SocketContext = createContext({
  socket: null,
  onlineUsers: []
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, userId }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!userId) {
      if (socket) {
        socket.close();
        setSocket(null);
      }
      return;
    }

    // Connect to Backend WebSocket server (Native)
    // Convert https to wss or http to ws
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
    const wsUrl = backendUrl.replace(/^http/, 'ws') + '/ws?userId=' + userId;
    
    console.log('🔗 Attempting connection to:', wsUrl);
    const newSocket = new WebSocket(wsUrl);

    setSocket(newSocket);

    // listeners
    newSocket.onopen = () => {
      console.log('✅ Connected to Real-time server');
    };

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📩 New Message/Notification:', data);
      
      if (data.type === 'CONNECTION_ACCEPTED') {
        toast.success(data.message || "Request Accepted!", {
          duration: 6000,
          icon: '🤝',
          style: {
            borderRadius: '10px',
            background: '#1e293b',
            color: '#fff',
            border: '1px solid #334155'
          },
        });
      }
      
      // Emit event for listeners in components
      const customEvent = new CustomEvent('socket_message', { detail: data });
      window.dispatchEvent(customEvent);
    };

    newSocket.onerror = (error) => {
      console.error('Socket Connection Error:', error);
    };

    return () => {
      newSocket.close();
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
