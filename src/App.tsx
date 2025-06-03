import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PrivateRoute } from "./components/PrivateRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { RoomSelectionPage } from "./pages/RoomSelectionPage";
import { RoomPage } from "./pages/RoomPage";
import { CharacterPage } from "./pages/CharacterPage";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route 
              path="/characters" 
              element={
                <PrivateRoute>
                  <CharacterPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/rooms" 
              element={
                <PrivateRoute>
                  <RoomSelectionPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/room/:roomId" 
              element={
                <PrivateRoute>
                  <RoomPage />
                </PrivateRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/rooms" replace />} />
            <Route path="*" element={<Navigate to="/rooms" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
