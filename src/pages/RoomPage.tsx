import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import { socketService } from "../services/socket";
import { ChatWindow } from "../components/ChatWindow/ChatWindow";
import { MapCanvas } from "../components/MapCanvas/MapCanvas";
import DiceRoller from "../components/DiceRoller/DiceRoller";
import { VoiceControls } from "../components/VoiceControls/VoiceControls";
import type { Room } from "../types";

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { state, signOut } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!roomId) {
      navigate("/rooms");
      return;
    }

    loadRoom();
  }, [roomId, navigate]);

  useEffect(() => {
    // Connect to socket when room is loaded and user is authenticated
    if (room && state.token && roomId) {
      socketService.connect(roomId, state.token);
      setIsConnected(true);

      // Cleanup on unmount
      return () => {
        socketService.disconnect();
        setIsConnected(false);
      };
    }
  }, [room, state.token, roomId]);

  const loadRoom = async () => {
    if (!roomId) return;

    try {
      setIsLoading(true);
      const response = await apiService.getRoom(roomId);
      
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setRoom(response.data.room);
      }
    } catch {
      setError("Failed to load room");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    socketService.disconnect();
    signOut();
    navigate("/login");
  };

  const handleBackToRooms = () => {
    socketService.disconnect();
    navigate("/rooms");
  };

  if (isLoading) {
    return (
      <div className="room-page-container">
        <div className="loading">Loading room...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="room-page-container">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={handleBackToRooms} className="back-button">
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="room-page-container">
        <div className="error-container">
          <h2>Room Not Found</h2>
          <p>The requested room could not be found.</p>
          <button onClick={handleBackToRooms} className="back-button">
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="room-page-container">
      <header className="room-page-header">
        <div className="header-content">
          <div className="room-info">
            <h1>{room.name}</h1>
            <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '● Connected' : '● Disconnected'}
            </span>
          </div>
          <div className="header-actions">
            <span className="user-info">
              {state.user?.username} ({state.user?.role})
            </span>
            <button onClick={handleBackToRooms} className="back-button">
              Back to Rooms
            </button>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="room-page-main">
        <div className="room-layout">
          <div className="map-section">
            {roomId && (
              <MapCanvas 
                roomId={roomId} 
                isGM={room.gmId === state.user?.id} 
              />
            )}
          </div>
          
          <div className="sidebar">
            <div className="chat-section">
              {roomId && <ChatWindow roomId={roomId} />}
            </div>
            
            <div className="dice-section">
              {roomId && <DiceRoller roomId={roomId} />}
            </div>
            
            <div className="voice-section">
              {roomId && <VoiceControls roomId={roomId} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 