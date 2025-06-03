import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import type { 
  UnitMovedPayload, 
  DiceRollPayload, 
  ChatMessagePayload, 
  VoiceJoinPayload,
  UserTypingEvent,
  UserConnectionEvent,
  DiceRoll,
  ChatMessage 
} from "../types";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(roomId: string, token: string): void {
    if (this.socket?.connected) {
      this.disconnect();
    }

    console.log("Connecting to socket for room:", roomId); // Debug log

    this.socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ["websocket"],
      auth: {
        token,
        roomId,
      },
    });

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket?.id);
      this.isConnected = true;
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      this.isConnected = false;
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    // Add debug logging for chat messages
    this.socket.on("chat_message", (message) => {
      console.log("Socket received chat_message event:", message);
    });

    this.socket.connect();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Unit movement
  moveUnit(payload: UnitMovedPayload): void {
    if (this.socket?.connected) {
      this.socket.emit("move_unit", payload);
    }
  }

  onUnitMoved(callback: (payload: UnitMovedPayload) => void): void {
    if (this.socket) {
      this.socket.on("unit_moved", callback);
    }
  }

  // Dice rolling
  rollDice(payload: DiceRollPayload): void {
    if (this.socket?.connected) {
      this.socket.emit("roll_dice", payload);
    }
  }

  onDiceResult(callback: (result: DiceRoll) => void): void {
    if (this.socket) {
      this.socket.on("dice_result", callback);
    }
  }

  // Chat messages
  sendChatMessage(payload: ChatMessagePayload): void {
    if (this.socket?.connected) {
      this.socket.emit("send_chat", payload);
    }
  }

  onChatMessage(callback: (message: ChatMessage) => void): void {
    if (this.socket) {
      this.socket.on("chat_message", callback);
    }
  }

  offChatMessage(callback?: (message: ChatMessage) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off("chat_message", callback);
      } else {
        this.socket.off("chat_message");
      }
    }
  }

  // Typing indicators
  sendTyping(typing: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit("typing", { typing });
    }
  }

  onUserTyping(callback: (event: UserTypingEvent) => void): void {
    if (this.socket) {
      this.socket.on("user_typing", callback);
    }
  }

  offUserTyping(callback?: (event: UserTypingEvent) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off("user_typing", callback);
      } else {
        this.socket.off("user_typing");
      }
    }
  }

  // User connection events
  onUserConnected(callback: (event: UserConnectionEvent) => void): void {
    if (this.socket) {
      this.socket.on("user_connected", callback);
    }
  }

  onUserDisconnected(callback: (event: UserConnectionEvent) => void): void {
    if (this.socket) {
      this.socket.on("user_disconnected", callback);
    }
  }

  // Voice chat
  joinVoice(payload: VoiceJoinPayload): void {
    if (this.socket?.connected) {
      this.socket.emit("voice_join", payload);
    }
  }

  onVoicePeer(callback: (payload: { peerId: string; userId: string }) => void): void {
    if (this.socket) {
      this.socket.on("voice_peer", callback);
    }
  }

  // Utility methods
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export const socketService = new SocketService();
export default socketService; 