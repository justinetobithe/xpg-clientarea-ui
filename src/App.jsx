import React, { memo } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box } from "@mui/material";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import ForgotPassword from "./components/ForgotPassword";
import AuthModalManager from "./components/AuthModalManager";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import "./i18n";
import Login from "./components/Login";
import Register from "./components/Register";
import Brands from "./pages/Brands";
import BrandDetails from "./pages/BrandDetails";
import Announcements from "./pages/Announcements";
import AnnouncementDetails from "./pages/AnnouncementDetails";
import Roadmap from "./pages/Roadmap";
import AccountSettings from "./pages/AccountSettings";
import { DialogProvider } from "./contexts/DialogContext";
import AppDialog from "./components/AppDialog";
import GameDetails from "./pages/GameDetails";
import { SnackbarProvider } from "./components/ui/AppSnackbar";
 
const theme = createTheme({
    palette: { mode: "dark", background: { default: "#0b0d13" } },
    typography: { fontFamily: "'Exo', sans-serif" }
});

const PrivateRoute = memo(({ children }) => {
    const { currentUser, accessGranted } = useAuth();
    if (!currentUser) return <Navigate to="/login" replace />;
    if (!accessGranted) return <Box sx={{ p: 3, bgcolor: "#111318", color: "#fff" }}>Your account is pending approval by an administrator.</Box>;
    return children;
});

const GuestRoute = memo(({ children }) => {
    const { currentUser, accessGranted } = useAuth();
    if (currentUser && accessGranted) return <Navigate to="/" replace />;
    return children;
});

const Shell = ({ children }) => {
    const { currentUser, accessGranted } = useAuth();
    const showChrome = !!currentUser && !!accessGranted;
    return (
        <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column", bgcolor: "#0b0d13" }}>
            {showChrome && <Header />}
            <Box component="main" sx={{ flex: 1 }}>{children}</Box>
            {showChrome && <Footer />}
            <AuthModalManager />
            <AppDialog />
        </Box>
    );
};

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <SnackbarProvider>
                <AuthProvider>
                    <CartProvider>
                        <LanguageProvider>
                            <DialogProvider>
                                <Shell>
                                    <Routes>
                                        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                                        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
                                        <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
                                        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
                                        <Route path="/brands" element={<PrivateRoute><Brands /></PrivateRoute>} />
                                        <Route path="/brands/:id" element={<PrivateRoute><BrandDetails /></PrivateRoute>} />
                                        <Route path="/announcements" element={<PrivateRoute><Announcements /></PrivateRoute>} />
                                        <Route path="/announcements/:id" element={<PrivateRoute><AnnouncementDetails /></PrivateRoute>} />
                                        <Route path="/roadmap" element={<PrivateRoute><Roadmap /></PrivateRoute>} />
                                        <Route path="/account-settings" element={<PrivateRoute><AccountSettings /></PrivateRoute>} />
                                        <Route path="/game/:gameId" element={<PrivateRoute><GameDetails /></PrivateRoute>} />
                                        <Route path="*" element={<Navigate to="/login" replace />} />
                                    </Routes>
                                </Shell>
                            </DialogProvider>
                        </LanguageProvider>
                    </CartProvider>
                </AuthProvider>
            </SnackbarProvider>
        </ThemeProvider>
    );
}

export default App;
