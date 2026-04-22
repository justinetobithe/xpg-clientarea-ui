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
import NotFound from "./pages/NotFound";
import SplashScreen from "./components/common/SplashScreen";

function ProtectedLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-evo text-foreground">
      <Navbar />
      <CollectionsDrawer />
      <div className="flex-1">{children}</div>
      <Footer />
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

  const requireAccess = (element) =>
    isAuthed && hasAccess ? (
      <ProtectedLayout>{element}</ProtectedLayout>
    ) : (
      <Navigate to="/login" replace />
    );

  const guestOnly = (element) =>
    !isAuthed || !hasAccess ? element : <Navigate to="/" replace />;

  const notFoundElement =
    isAuthed && hasAccess ? requireAccess(<NotFound />) : <NotFound />;

  return (
    <ToastProvider>
      <DialogProvider>
        <BrowserRouter>
          {loading ? (
            <SplashScreen />
          ) : (
            <Routes>
              <Route path="/" element={requireAccess(<Home />)} />
              <Route path="/search" element={requireAccess(<Search />)} />
              <Route path="/announcements" element={requireAccess(<Announcements />)} />
              <Route path="/announcement/:id" element={requireAccess(<AnnouncementDetails />)} />
              <Route path="/game/:gameId" element={requireAccess(<GameDetails />)} />
              <Route path="/settings" element={requireAccess(<Settings />)} />
              <Route path="/login" element={guestOnly(<Login />)} />
              <Route
                path="/register"
                element={!isAuthed ? <Register /> : <Navigate to="/" replace />}
              />
              <Route
                path="/forgot-password"
                element={!isAuthed ? <ForgotPassword /> : <Navigate to="/" replace />}
              />
              <Route
                path="/reset-password"
                element={!isAuthed ? <ResetPassword /> : <Navigate to="/" replace />}
              />
              <Route path="*" element={notFoundElement} />
            </Routes>
          )}
        </BrowserRouter>
      </DialogProvider>
    </ToastProvider>
  );
}