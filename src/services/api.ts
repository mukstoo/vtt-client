import axios from "axios";
import type { AxiosInstance, AxiosResponse } from "axios";
import type { 
  User, 
  Room, 
  ChatMessage,
  LoginCredentials, 
  RegisterCredentials, 
  CreateRoomData,
  JoinRoomData,
  CreateCharacterData,
  UpdateCharacterData,
  CharacterListResponse,
  CharacterResponse,
  CharacterDeleteResponse,
  ApiResponse 
} from "../types";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: SERVER_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to attach token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem("vtt_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor to handle 401 errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem("vtt_token");
          localStorage.removeItem("vtt_user");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  async healthCheck(): Promise<ApiResponse> {
    try {
      const response: AxiosResponse = await this.client.get("/health");
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
      return {
        error: axiosError.response?.data?.error || "Health check failed",
        status: axiosError.response?.status || 500,
      };
    }
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ token: string; user: User }>> {
    try {
      const response: AxiosResponse = await this.client.post("/auth/login", credentials);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
      return {
        error: axiosError.response?.data?.error || "Login failed",
        status: axiosError.response?.status || 500,
      };
    }
  }

  async register(credentials: RegisterCredentials): Promise<ApiResponse<{ user: User }>> {
    try {
      const response: AxiosResponse = await this.client.post("/auth/register", credentials);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
      return {
        error: axiosError.response?.data?.error || "Registration failed",
        status: axiosError.response?.status || 500,
      };
    }
  }

  async createRoom(roomData: CreateRoomData): Promise<ApiResponse<{ room: Room }>> {
    try {
      const response: AxiosResponse = await this.client.post("/rooms", roomData);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
      return {
        error: axiosError.response?.data?.error || "Room creation failed",
        status: axiosError.response?.status || 500,
      };
    }
  }

  async getRooms(): Promise<ApiResponse<{ rooms: Room[] }>> {
    try {
      const response: AxiosResponse = await this.client.get("/rooms");
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
      return {
        error: axiosError.response?.data?.error || "Failed to fetch rooms",
        status: axiosError.response?.status || 500,
      };
    }
  }

  async getAvailableRooms(): Promise<ApiResponse<{ rooms: Room[] }>> {
    try {
      const response: AxiosResponse = await this.client.get("/rooms/available");
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
      return {
        error: axiosError.response?.data?.error || "Failed to fetch available rooms",
        status: axiosError.response?.status || 500,
      };
    }
  }

  async joinRoom(roomId: string, joinData?: JoinRoomData): Promise<ApiResponse<{ message: string }>> {
    try {
      const response: AxiosResponse = await this.client.post(`/rooms/${roomId}/join`, joinData || {});
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
      return {
        error: axiosError.response?.data?.error || "Failed to join room",
        status: axiosError.response?.status || 500,
      };
    }
  }

  async leaveRoom(roomId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response: AxiosResponse = await this.client.delete(`/rooms/${roomId}/leave`);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
      return {
        error: axiosError.response?.data?.error || "Failed to leave room",
        status: axiosError.response?.status || 500,
      };
    }
  }

  async getRoom(roomId: string): Promise<ApiResponse<{ room: Room }>> {
    try {
      const response: AxiosResponse = await this.client.get(`/rooms/${roomId}`);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
      return {
        error: axiosError.response?.data?.error || "Failed to fetch room",
        status: axiosError.response?.status || 500,
      };
    }
  }

  async getChatHistory(roomId: string): Promise<ApiResponse<{ messages: ChatMessage[] }>> {
    try {
      const response: AxiosResponse = await this.client.get(`/rooms/${roomId}/chat`);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
      return {
        error: axiosError.response?.data?.error || "Failed to fetch chat history",
        status: axiosError.response?.status || 500,
      };
    }
  }

  // Character management methods
  async createCharacter(characterData: CreateCharacterData): Promise<ApiResponse<CharacterResponse>> {
    try {
      const response: AxiosResponse = await this.client.post("/characters", characterData);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
      return {
        error: axiosError.response?.data?.error || "Character creation failed",
        status: axiosError.response?.status || 500,
      };
    }
  }

  async getCharacters(): Promise<ApiResponse<CharacterListResponse>> {
    try {
      const response: AxiosResponse = await this.client.get("/characters");
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
      return {
        error: axiosError.response?.data?.error || "Failed to fetch characters",
        status: axiosError.response?.status || 500,
      };
    }
  }

  async getCharacter(characterId: string): Promise<ApiResponse<CharacterResponse>> {
    try {
      const response: AxiosResponse = await this.client.get(`/characters/${characterId}`);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
      return {
        error: axiosError.response?.data?.error || "Failed to fetch character",
        status: axiosError.response?.status || 500,
      };
    }
  }

  async updateCharacter(characterId: string, characterData: UpdateCharacterData): Promise<ApiResponse<CharacterResponse>> {
    try {
      const response: AxiosResponse = await this.client.put(`/characters/${characterId}`, characterData);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
      return {
        error: axiosError.response?.data?.error || "Character update failed",
        status: axiosError.response?.status || 500,
      };
    }
  }

  async deleteCharacter(characterId: string): Promise<ApiResponse<CharacterDeleteResponse>> {
    try {
      const response: AxiosResponse = await this.client.delete(`/characters/${characterId}`);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
      return {
        error: axiosError.response?.data?.error || "Character deletion failed",
        status: axiosError.response?.status || 500,
      };
    }
  }

  async getRoomCharacters(roomId: string): Promise<ApiResponse<CharacterListResponse>> {
    try {
      const response: AxiosResponse = await this.client.get(`/rooms/${roomId}/characters`);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
      return {
        error: axiosError.response?.data?.error || "Failed to fetch room characters",
        status: axiosError.response?.status || 500,
      };
    }
  }

  setToken(token: string): void {
    localStorage.setItem("vtt_token", token);
  }

  removeToken(): void {
    localStorage.removeItem("vtt_token");
    localStorage.removeItem("vtt_user");
  }

  getToken(): string | null {
    return localStorage.getItem("vtt_token");
  }
}

export const apiService = new ApiService();
export default apiService; 