import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import Announcements from "./pages/Announcements";
import Search from "./pages/Search";
import AnnouncementDetails from "./pages/AnnouncementDetails";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { useAuthListener } from "./hooks/useAuthListener";
import { useAuthStore } from "./store/authStore";
import { DialogProvider } from "./contexts/DialogContext";
import GameDetails from "./pages/GameDetails";
import { ToastProvider } from "./contexts/ToastContext";
import CollectionsDrawer from "./components/CollectionsDrawer";

function ProtectedLayout({ children }) {
  return (
    <div className="min-h-screen bg-evo text-foreground flex flex-col">
      <Navbar />
      <CollectionsDrawer />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

function Splash() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden text-foreground">
      <div className="absolute inset-0 bg-[url('/image/bg.jpg')] bg-cover bg-center scale-110 blur-xl opacity-60" />
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative w-[94%] max-w-md rounded-2xl border border-border bg-card shadow-2xl p-8 md:p-10">
        <div className="flex flex-col items-center gap-4">
          <img src="/image/logo-white.png" alt="Logo" className="h-[90px]" />
          <div className="text-white/80 text-sm">Loading…</div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  useAuthListener();

  const loading = useAuthStore((s) => s.loading);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const isAuthed = !!user;
  const hasAccess = profile?.access === true;

  return (
    <ToastProvider>
      <DialogProvider>
        <BrowserRouter>
          {loading ? (
            <Splash />
          ) : (
            <Routes>
              <Route
                path="/"
                element={isAuthed && hasAccess ? <ProtectedLayout><Home /></ProtectedLayout> : <Navigate to="/login" />}
              />
              <Route
                path="/search"
                element={isAuthed && hasAccess ? <ProtectedLayout><Search /></ProtectedLayout> : <Navigate to="/login" />}
              />
              <Route
                path="/announcements"
                element={isAuthed && hasAccess ? <ProtectedLayout><Announcements /></ProtectedLayout> : <Navigate to="/login" />}
              />
              <Route
                path="/announcement/:id"
                element={isAuthed && hasAccess ? <ProtectedLayout><AnnouncementDetails /></ProtectedLayout> : <Navigate to="/login" />}
              />
              <Route
                path="/game/:gameId"
                element={isAuthed && hasAccess ? <ProtectedLayout><GameDetails /></ProtectedLayout> : <Navigate to="/login" />}
              />
              <Route
                path="/settings"
                element={isAuthed && hasAccess ? <ProtectedLayout><Settings /></ProtectedLayout> : <Navigate to="/login" />}
              />

              <Route path="/login" element={!isAuthed || !hasAccess ? <Login /> : <Navigate to="/" />} />
              <Route path="/register" element={!isAuthed ? <Register /> : <Navigate to="/" />} />
              <Route path="/forgot-password" element={!isAuthed ? <ForgotPassword /> : <Navigate to="/" />} />
              <Route path="/reset-password" element={!isAuthed ? <ResetPassword /> : <Navigate to="/" />} />
            </Routes>
          )}
        </BrowserRouter>
      </DialogProvider>
    </ToastProvider>
  );
}
