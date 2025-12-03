import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import Announcements from "./pages/Announcements";
import AnnouncementDetails from "./pages/AnnouncementDetails";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { useAuthListener } from "./hooks/useAuthListener";
import { useAuthStore } from "./store/authStore";
import { DialogProvider } from "./contexts/DialogContext";
import GameDetails from "./pages/GameDetails";
function ProtectedLayout({ children }) {
  return (
    <div className="min-h-screen bg-evo text-foreground flex flex-col">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

export default function App() {
  useAuthListener();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  if (loading) return null;

  return (
    <DialogProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={user ? <ProtectedLayout><Home /></ProtectedLayout> : <Navigate to="/login" />}
          />
          <Route
            path="/announcements"
            element={user ? <ProtectedLayout><Announcements /></ProtectedLayout> : <Navigate to="/login" />}
          />
          <Route
            path="/announcement/:id"
            element={user ? <ProtectedLayout><AnnouncementDetails /></ProtectedLayout> : <Navigate to="/login" />}
          />

          <Route
            path="/game/:gameId"
            element={user ? <ProtectedLayout><GameDetails /></ProtectedLayout> : <Navigate to="/login" />}
          />
          <Route
            path="/settings"
            element={user ? <ProtectedLayout><Settings /></ProtectedLayout> : <Navigate to="/login" />}
          />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </DialogProvider>
  );
}