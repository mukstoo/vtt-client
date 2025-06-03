import { useState, useEffect, useCallback, useRef } from 'react';
import Peer from 'peerjs';
import type { MediaConnection } from 'peerjs';
import { socketService } from '../../services/socket';
import { useAuth } from '../../contexts/AuthContext';
import type { 
  VoicePeerInfo, 
  VoicePeerJoinedEvent, 
  VoicePeerLeftEvent, 
  VoicePeerMutedEvent,
  VoiceRoomPeersEvent 
} from '../../types';
import './VoiceControls.css';

interface VoiceControlsProps {
  roomId: string;
}

export function VoiceControls({ roomId }: VoiceControlsProps) {
  const { state } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peers, setPeers] = useState<VoicePeerInfo[]>([]);
  const [audioPermission, setAudioPermission] = useState<PermissionState | null>(null);
  
  const peerRef = useRef<Peer | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const connectionsRef = useRef<Map<string, MediaConnection>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Check audio permissions
  const checkAudioPermission = useCallback(async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setAudioPermission(result.state);
      
      result.addEventListener('change', () => {
        setAudioPermission(result.state);
      });
    } catch {
      console.log('Permission query not supported, will prompt on connect');
    }
  }, []);

  // Get user media stream
  const getUserMedia = useCallback(async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false 
      });
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error('Failed to get user media:', error);
      throw new Error('Microphone access denied or not available');
    }
  }, []);

  // Initialize PeerJS connection
  const initializePeer = useCallback(async () => {
    if (!state.user || isInitializing || peerRef.current) return;

    setIsInitializing(true);
    setError(null);

    try {
      // Create unique peer ID based on user ID and room ID
      const peerId = `${state.user.id}_${roomId}_${Date.now()}`;
      
      // Initialize PeerJS - use default cloud service for development
      const peer = new Peer(peerId, {
        // Use default PeerJS cloud service (free for development)
        // For production, set up your own PeerServer
        debug: 2
      });

      peerRef.current = peer;

      // Peer connection opened
      peer.on('open', async (id) => {
        console.log('Peer connection opened with ID:', id);
        
        try {
          // Get user media stream
          await getUserMedia();
          
          // Join voice room via Socket.IO
          const socket = socketService.getSocket();
          if (socket) {
            socket.emit('voice_join', { peerId: id });
          }
          
          setIsConnected(true);
        } catch (mediaError) {
          setError(mediaError instanceof Error ? mediaError.message : 'Failed to access microphone');
          peer.destroy();
        }
      });

      // Handle incoming calls
      peer.on('call', (call) => {
        console.log('Incoming call from:', call.peer);
        
        if (localStreamRef.current) {
          call.answer(localStreamRef.current);
          
          call.on('stream', (remoteStream) => {
            console.log('Received remote stream from:', call.peer);
            playRemoteStream(call.peer, remoteStream);
          });

          call.on('close', () => {
            console.log('Call closed with:', call.peer);
            stopRemoteStream(call.peer);
          });

          connectionsRef.current.set(call.peer, call);
        }
      });

      peer.on('error', (error) => {
        console.error('Peer error:', error);
        setError(`Connection error: ${error.message}`);
        setIsConnected(false);
      });

      peer.on('disconnected', () => {
        console.log('Peer disconnected');
        setIsConnected(false);
      });

    } catch (error) {
      console.error('Failed to initialize peer:', error);
      setError('Failed to initialize voice connection');
      setIsConnected(false);
    } finally {
      setIsInitializing(false);
    }
  }, [state.user, roomId, isInitializing, getUserMedia]);

  // Call a peer
  const callPeer = useCallback((peerId: string) => {
    const peer = peerRef.current;
    const localStream = localStreamRef.current;
    
    if (!peer || !localStream) return;

    console.log('Calling peer:', peerId);
    const call = peer.call(peerId, localStream);
    
    call.on('stream', (remoteStream) => {
      console.log('Received remote stream from call to:', peerId);
      playRemoteStream(peerId, remoteStream);
    });

    call.on('close', () => {
      console.log('Call closed with:', peerId);
      stopRemoteStream(peerId);
    });

    connectionsRef.current.set(peerId, call);
  }, []);

  // Play remote audio stream
  const playRemoteStream = useCallback((peerId: string, stream: MediaStream) => {
    let audio = audioElementsRef.current.get(peerId);
    
    if (!audio) {
      audio = new Audio();
      audio.autoplay = true;
      audioElementsRef.current.set(peerId, audio);
    }
    
    audio.srcObject = stream;
  }, []);

  // Stop remote audio stream
  const stopRemoteStream = useCallback((peerId: string) => {
    const audio = audioElementsRef.current.get(peerId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      audioElementsRef.current.delete(peerId);
    }
    connectionsRef.current.delete(peerId);
  }, []);

  // Toggle mute/unmute
  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const audioTracks = stream.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = !track.enabled;
    });

    const newMutedState = !audioTracks[0]?.enabled;
    setIsMuted(newMutedState);

    // Notify others via Socket.IO
    const socket = socketService.getSocket();
    if (socket && peerRef.current) {
      socket.emit('voice_mute', { 
        peerId: peerRef.current.id,
        isMuted: newMutedState 
      });
    }
  }, []);

  // Disconnect from voice chat
  const disconnect = useCallback(() => {
    // Close all peer connections
    connectionsRef.current.forEach(connection => {
      connection.close();
    });
    connectionsRef.current.clear();

    // Stop all audio elements
    audioElementsRef.current.forEach(audio => {
      audio.pause();
      audio.srcObject = null;
    });
    audioElementsRef.current.clear();

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    // Leave voice room via Socket.IO
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('voice_leave');
    }

    setIsConnected(false);
    setIsMuted(false);
    setError(null);
  }, []);

  // Socket.IO event handlers
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleVoicePeerJoined = (data: VoicePeerJoinedEvent) => {
      console.log('Voice peer joined:', data);
      if (data.roomId === roomId) {
        setPeers(prev => {
          const exists = prev.some(p => p.peerId === data.peer.peerId);
          if (!exists) {
            // Call the new peer if we're connected
            if (isConnected && data.peer.userId !== state.user?.id) {
              setTimeout(() => callPeer(data.peer.peerId), 1000);
            }
            return [...prev, data.peer];
          }
          return prev;
        });
      }
    };

    const handleVoicePeerLeft = (data: VoicePeerLeftEvent) => {
      console.log('Voice peer left:', data);
      if (data.roomId === roomId) {
        setPeers(prev => prev.filter(p => p.peerId !== data.peerId));
        stopRemoteStream(data.peerId);
      }
    };

    const handleVoicePeerMuted = (data: VoicePeerMutedEvent) => {
      console.log('Voice peer muted status changed:', data);
      if (data.roomId === roomId) {
        setPeers(prev => prev.map(p => 
          p.peerId === data.peerId 
            ? { ...p, isMuted: data.isMuted }
            : p
        ));
      }
    };

    const handleVoiceRoomPeers = (data: VoiceRoomPeersEvent) => {
      console.log('Voice room peers:', data);
      if (data.roomId === roomId) {
        setPeers(data.peers);
        
        // Call all existing peers
        if (isConnected) {
          data.peers.forEach(peer => {
            if (peer.userId !== state.user?.id && peer.isConnected) {
              setTimeout(() => callPeer(peer.peerId), 1000);
            }
          });
        }
      }
    };

    socket.on('voice_peer_joined', handleVoicePeerJoined);
    socket.on('voice_peer_left', handleVoicePeerLeft);
    socket.on('voice_peer_muted', handleVoicePeerMuted);
    socket.on('voice_room_peers', handleVoiceRoomPeers);

    return () => {
      socket.off('voice_peer_joined', handleVoicePeerJoined);
      socket.off('voice_peer_left', handleVoicePeerLeft);
      socket.off('voice_peer_muted', handleVoicePeerMuted);
      socket.off('voice_room_peers', handleVoiceRoomPeers);
    };
  }, [roomId, isConnected, state.user?.id, callPeer, stopRemoteStream]);

  // Check permissions on mount
  useEffect(() => {
    checkAudioPermission();
  }, [checkAudioPermission]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <div className="voice-controls">
      <div className="voice-header">
        <h3>Voice Chat</h3>
        <div className="voice-status">
          {isConnected && (
            <span className="status-connected">● Connected</span>
          )}
          {!isConnected && !isInitializing && (
            <span className="status-disconnected">● Disconnected</span>
          )}
          {isInitializing && (
            <span className="status-connecting">● Connecting...</span>
          )}
        </div>
      </div>

      {error && (
        <div className="voice-error">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="error-dismiss">
            ×
          </button>
        </div>
      )}

      {audioPermission === 'denied' && (
        <div className="permission-warning">
          <p>Microphone access denied. Please enable in browser settings.</p>
        </div>
      )}

      <div className="voice-controls-section">
        {!isConnected ? (
          <button 
            onClick={initializePeer}
            disabled={isInitializing || audioPermission === 'denied'}
            className="connect-button"
          >
            {isInitializing ? 'Connecting...' : 'Join Voice Chat'}
          </button>
        ) : (
          <div className="voice-active-controls">
            <button 
              onClick={toggleMute}
              className={`mute-button ${isMuted ? 'muted' : 'unmuted'}`}
            >
              {isMuted ? '🔇' : '🎤'}
            </button>
            <button 
              onClick={disconnect}
              className="disconnect-button"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {peers.length > 0 && (
        <div className="voice-participants">
          <h4>Participants ({peers.length + (isConnected ? 1 : 0)})</h4>
          <div className="participants-list">
            {/* Show current user */}
            {isConnected && (
              <div className="participant self">
                <span className="participant-name">
                  {state.user?.username} (You)
                </span>
                <span className={`participant-status ${isMuted ? 'muted' : 'speaking'}`}>
                  {isMuted ? '🔇' : '🎤'}
                </span>
              </div>
            )}
            
            {/* Show other participants */}
            {peers.map(peer => (
              <div key={peer.peerId} className="participant">
                <span className="participant-name">{peer.username}</span>
                <span className={`participant-status ${peer.isMuted ? 'muted' : 'speaking'}`}>
                  {peer.isMuted ? '🔇' : '🎤'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isConnected && peers.length === 0 && (
        <div className="no-participants">
          <p>No other participants in voice chat</p>
        </div>
      )}
    </div>
  );
}