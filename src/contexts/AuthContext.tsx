import { createContext, useContext, useReducer, useEffect } from "react";
import type { ReactNode } from "react";
import type { User, AuthState, LoginCredentials, RegisterCredentials } from "../types";
import { apiService } from "../services/api";

interface AuthContextType {
  state: AuthState;
  signIn: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  signUp: (credentials: RegisterCredentials) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
}

type AuthAction =
  | { type: "SET_USER"; payload: { user: User; token: string } }
  | { type: "CLEAR_USER" }
  | { type: "SET_LOADING"; payload: boolean };

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
      };
    case "CLEAR_USER":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
      };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on mount
  useEffect(() => {
    const token = apiService.getToken();
    const userStr = localStorage.getItem("vtt_user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        dispatch({ type: "SET_USER", payload: { user, token } });
      } catch {
        // Invalid stored user data, clear it
        apiService.removeToken();
      }
    }
  }, []);

  const signIn = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiService.login(credentials);
      
      if (response.error) {
        return { success: false, error: response.error };
      }

      if (response.data) {
        const { token, user } = response.data;
        
        // Store token and user data
        apiService.setToken(token);
        localStorage.setItem("vtt_user", JSON.stringify(user));
        
        // Update context state
        dispatch({ type: "SET_USER", payload: { user, token } });
        
        return { success: true };
      }

      return { success: false, error: "Invalid response from server" };
    } catch {
      return { success: false, error: "Network error occurred" };
    }
  };

  const signUp = async (credentials: RegisterCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiService.register(credentials);
      
      if (response.error) {
        return { success: false, error: response.error };
      }

      if (response.data) {
        // After successful registration, automatically log in
        return await signIn({
          username: credentials.username,
          password: credentials.password,
        });
      }

      return { success: false, error: "Invalid response from server" };
    } catch {
      return { success: false, error: "Network error occurred" };
    }
  };

  const signOut = () => {
    apiService.removeToken();
    dispatch({ type: "CLEAR_USER" });
  };

  const value: AuthContextType = {
    state,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 