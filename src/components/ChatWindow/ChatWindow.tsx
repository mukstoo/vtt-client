import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/api";
import { socketService } from "../../services/socket";
import type { ChatMessage, UserTypingEvent } from "../../types";
import "./ChatWindow.css";

interface ChatWindowProps {
  roomId: string;
}

export function ChatWindow({ roomId }: ChatWindowProps) {
  const { state } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [isTyping, setIsTyping] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getChatHistory(roomId);
        
        if (response.error) {
          setError(response.error);
        } else if (response.data) {
          setMessages(response.data.messages);
        }
      } catch {
        setError("Failed to load chat history");
      } finally {
        setIsLoading(false);
      }
    };

    loadChatHistory();
  }, [roomId]);

  // Set up socket event listeners
  useEffect(() => {
    const handleChatMessage = (message: ChatMessage) => {
      console.log("Received chat message:", message); // Debug log
      setMessages((prev) => [...prev, message]);
      // Remove typing indicator for this user
      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        newMap.delete(message.user.id);
        return newMap;
      });
    };

    const handleUserTyping = (event: UserTypingEvent) => {
      if (event.userId === state.user?.id) return; // Don't show our own typing

      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        if (event.typing) {
          newMap.set(event.userId, event.username);
        } else {
          newMap.delete(event.userId);
        }
        return newMap;
      });
    };

    // Function to set up listeners
    const setupListeners = () => {
      console.log("Setting up chat listeners for room:", roomId, "Socket connected:", socketService.connected);
      socketService.onChatMessage(handleChatMessage);
      socketService.onUserTyping(handleUserTyping);
    };

    // Set up listeners when socket is connected, or wait for connection
    if (socketService.connected) {
      setupListeners();
    } else {
      // Wait for socket connection
      const checkConnection = setInterval(() => {
        if (socketService.connected) {
          clearInterval(checkConnection);
          setupListeners();
        }
      }, 100);

      // Cleanup interval if component unmounts
      return () => {
        clearInterval(checkConnection);
      };
    }

    // Cleanup - remove only the specific listeners we added
    return () => {
      console.log("Cleaning up chat listeners"); // Debug log
      socketService.offChatMessage(handleChatMessage);
      socketService.offUserTyping(handleUserTyping);
    };
  }, [roomId, state.user?.id]); // Include roomId in dependencies

  // Track socket connection state
  useEffect(() => {
    const updateConnectionState = () => {
      setSocketConnected(socketService.connected);
    };

    // Update initially
    updateConnectionState();

    // Set up interval to check connection state
    const connectionInterval = setInterval(updateConnectionState, 1000);

    return () => {
      clearInterval(connectionInterval);
    };
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      socketService.sendTyping(true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketService.sendTyping(false);
    }, 2000);
  }, [isTyping]);

  // Stop typing when component unmounts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        socketService.sendTyping(false);
      }
    };
  }, [isTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    const message = newMessage.trim();
    if (!message || isSending) return;

    try {
      setIsSending(true);
      setError(null);

      // Clear typing indicator
      if (isTyping) {
        setIsTyping(false);
        socketService.sendTyping(false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }

      // Send message via socket
      socketService.sendChatMessage({ content: message });
      
      // Clear input
      setNewMessage("");
      
      // Focus back to input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch {
      setError("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    
    return date.toLocaleDateString();
  };

  const getUserRoleColor = (role: string) => {
    switch (role) {
      case "GM": return "#10b981"; // Green
      case "ADMIN": return "#ef4444"; // Red
      default: return "#667eea"; // Blue
    }
  };

  if (isLoading) {
    return (
      <div className="chat-window">
        <div className="chat-header">
          <h3>Chat</h3>
        </div>
        <div className="chat-loading">
          <p>Loading chat history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>Chat</h3>
        <div className="chat-status">
          {socketConnected ? (
            <span className="status-connected">● Connected</span>
          ) : (
            <span className="status-disconnected">● Disconnected</span>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {error && (
          <div className="chat-error">
            <p>{error}</p>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`chat-message ${
                message.user.id === state.user?.id ? "own-message" : ""
              }`}
            >
              <div className="message-header">
                <span
                  className="message-author"
                  style={{ color: getUserRoleColor(message.user.role) }}
                >
                  {message.user.username}
                </span>
                <span className="message-time">
                  {formatTimestamp(message.createdAt)}
                </span>
              </div>
              <div className="message-content">{message.content}</div>
            </div>
          ))
        )}

        {/* Typing indicators */}
        {typingUsers.size > 0 && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="typing-text">
              {Array.from(typingUsers.values()).join(", ")} {typingUsers.size === 1 ? "is" : "are"} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <div className="input-container">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            rows={1}
            maxLength={500}
            disabled={isSending || !socketConnected}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending || !socketConnected}
            className="send-button"
            title="Send message"
          >
            {isSending ? "..." : "Send"}
          </button>
        </div>
        {!socketConnected && (
          <div className="connection-warning">
            ⚠️ Not connected to server. Messages won&apos;t be sent until connection is restored.
          </div>
        )}
        <div className="input-info">
          <span className="char-count">
            {newMessage.length}/500
          </span>
        </div>
      </div>
    </div>
  );
} 