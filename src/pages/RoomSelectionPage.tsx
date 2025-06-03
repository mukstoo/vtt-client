import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import type { Room } from "../types";

export function RoomSelectionPage() {
  const { state, signOut } = useAuth();
  const navigate = useNavigate();
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [activeTab, setActiveTab] = useState<'my-rooms' | 'available'>('my-rooms');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomPassword, setNewRoomPassword] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [joinPassword, setJoinPassword] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showCreateModal && !isCreating) {
        setShowCreateModal(false);
        setNewRoomName("");
      }
    };

    if (showCreateModal) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [showCreateModal, isCreating]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [roomsResponse, availableResponse] = await Promise.all([
        apiService.getRooms(),
        apiService.getAvailableRooms()
      ]);
      
      if (roomsResponse.error) {
        setError(roomsResponse.error);
      } else if (roomsResponse.data) {
        setMyRooms(roomsResponse.data.rooms);
      }

      if (availableResponse.error) {
        console.warn("Failed to load available rooms:", availableResponse.error);
      } else if (availableResponse.data) {
        setAvailableRooms(availableResponse.data.rooms);
      }
    } catch {
      setError("Failed to load rooms");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      setIsCreating(true);
      const roomData = {
        name: newRoomName.trim(),
        ...(newRoomPassword.trim() && { password: newRoomPassword.trim() }),
      };
      
      const response = await apiService.createRoom(roomData);
      
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        const newRoom = response.data.room;
        setMyRooms(prev => [{ ...newRoom, userRole: 'GM' }, ...prev]);
        setNewRoomName("");
        setNewRoomPassword("");
        setShowCreateModal(false);
        // Navigate to the new room
        navigate(`/room/${newRoom.id}`);
      }
    } catch {
      setError("Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      setActionLoading(roomId);
      const joinData = joinPassword.trim() ? { password: joinPassword.trim() } : undefined;
      const response = await apiService.joinRoom(roomId, joinData);
      
      if (response.error) {
        if (response.error.includes("Password required")) {
          // Show password modal
          setSelectedRoomId(roomId);
          setShowPasswordModal(true);
          setActionLoading(null);
          return;
        }
        setError(response.error);
      } else {
        // Move room from available to my rooms
        const roomToMove = availableRooms.find(room => room.id === roomId);
        if (roomToMove) {
          setMyRooms(prev => [{ ...roomToMove, userRole: 'MEMBER' }, ...prev]);
          setAvailableRooms(prev => prev.filter(room => room.id !== roomId));
        }
        // Reset password modal state
        setShowPasswordModal(false);
        setSelectedRoomId(null);
        setJoinPassword("");
        // Refresh data to ensure consistency
        loadData();
      }
    } catch {
      setError("Failed to join room");
    } finally {
      setActionLoading(null);
    }
  };

  const handleJoinWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) return;
    await handleJoinRoom(selectedRoomId);
  };

  const handleLeaveRoom = async (roomId: string) => {
    const room = myRooms.find(r => r.id === roomId);
    if (!room || room.userRole === 'GM') return; // Can't leave if you're the GM

    try {
      setActionLoading(roomId);
      const response = await apiService.leaveRoom(roomId);
      
      if (response.error) {
        setError(response.error);
      } else {
        // Move room from my rooms to available
        setMyRooms(prev => prev.filter(room => room.id !== roomId));
        setAvailableRooms(prev => [room, ...prev]);
        // Refresh data to ensure consistency
        loadData();
      }
    } catch {
      setError("Failed to leave room");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseCreateModal = () => {
    if (!isCreating) {
      setShowCreateModal(false);
      setNewRoomName("");
      setNewRoomPassword("");
    }
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setSelectedRoomId(null);
    setJoinPassword("");
    setActionLoading(null);
  };

  const handleLogout = () => {
    signOut();
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="room-selection-container">
        <div className="loading">Loading rooms...</div>
      </div>
    );
  }

  return (
    <div className="room-selection-container">
      <header className="room-selection-header">
        <div className="header-content">
          <h1>Virtual Tabletop</h1>
          <div className="header-actions">
            <span className="user-info">
              Welcome, {state.user?.username} ({state.user?.role})
            </span>
            <Link to="/characters" className="btn btn-secondary">
              Characters
            </Link>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="room-selection-main">
        <div className="rooms-container">
          <div className="rooms-header">
            <div className="tabs">
              <button 
                className={`tab-button ${activeTab === 'my-rooms' ? 'active' : ''}`}
                onClick={() => setActiveTab('my-rooms')}
              >
                My Rooms ({myRooms.length})
              </button>
              <button 
                className={`tab-button ${activeTab === 'available' ? 'active' : ''}`}
                onClick={() => setActiveTab('available')}
              >
                Available Rooms ({availableRooms.length})
              </button>
            </div>
            
            {activeTab === 'my-rooms' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="create-room-button"
              >
                Create Room
              </button>
            )}
          </div>

          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError(null)} className="error-close">
                ×
              </button>
            </div>
          )}

          <div className="rooms-content">
            {activeTab === 'my-rooms' ? (
              <div className="rooms-grid">
                {myRooms.length === 0 ? (
                  <div className="empty-state">
                    <p>You haven&apos;t created or joined any rooms yet.</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="create-room-button"
                    >
                      Create Your First Room
                    </button>
                  </div>
                ) : (
                  myRooms.map((room) => (
                    <div key={room.id} className="room-card">
                      <div className="room-card-header">
                        <h3>{room.name}</h3>
                        <div className="room-role">
                          <span className={`role-badge ${room.userRole?.toLowerCase()}`}>
                            {room.userRole}
                          </span>
                        </div>
                      </div>
                      <div className="room-card-info">
                        <p>GM: {room.gm?.username || 'Unknown'}</p>
                        <p>Created: {new Date(room.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="room-card-actions">
                        <Link 
                          to={`/room/${room.id}`} 
                          className="enter-room-button"
                        >
                          Enter Room
                        </Link>
                        {room.userRole === 'MEMBER' && (
                          <button
                            onClick={() => handleLeaveRoom(room.id)}
                            disabled={actionLoading === room.id}
                            className="leave-room-button"
                          >
                            {actionLoading === room.id ? 'Leaving...' : 'Leave'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="rooms-grid">
                {availableRooms.length === 0 ? (
                  <div className="empty-state">
                    <p>No available rooms to join at the moment.</p>
                    <button onClick={loadData} className="refresh-button">
                      Refresh
                    </button>
                  </div>
                ) : (
                  availableRooms.map((room) => (
                    <div key={room.id} className="room-card">
                      <div className="room-card-header">
                        <h3>{room.name}</h3>
                      </div>
                      <div className="room-card-info">
                        <p>GM: {room.gm?.username || 'Unknown'}</p>
                        <p>Created: {new Date(room.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="room-card-actions">
                        <button
                          onClick={() => handleJoinRoom(room.id)}
                          disabled={actionLoading === room.id}
                          className="join-room-button"
                        >
                          {actionLoading === room.id ? 'Joining...' : 'Join Room'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {showCreateModal && (
        <div className="modal-overlay" onClick={handleCloseCreateModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Room</h3>
            <form onSubmit={handleCreateRoom}>
              <div className="form-group">
                <label htmlFor="roomName">Room Name</label>
                <input
                  type="text"
                  id="roomName"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Enter room name"
                  required
                  disabled={isCreating}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="roomPassword">Password (Optional)</label>
                <input
                  type="password"
                  id="roomPassword"
                  value={newRoomPassword}
                  onChange={(e) => setNewRoomPassword(e.target.value)}
                  placeholder="Leave blank for no password"
                  disabled={isCreating}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  disabled={isCreating}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newRoomName.trim()}
                  className="create-button"
                >
                  {isCreating ? "Creating..." : "Create Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="modal-overlay" onClick={handleClosePasswordModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Password Required</h3>
            <p>This room requires a password to join.</p>
            <form onSubmit={handleJoinWithPassword}>
              <div className="form-group">
                <label htmlFor="joinPassword">Room Password</label>
                <input
                  type="password"
                  id="joinPassword"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  placeholder="Enter room password"
                  required
                  disabled={actionLoading === selectedRoomId}
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={handleClosePasswordModal}
                  disabled={actionLoading === selectedRoomId}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === selectedRoomId || !joinPassword.trim()}
                  className="join-button"
                >
                  {actionLoading === selectedRoomId ? "Joining..." : "Join Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 