import React, { useState } from "react";
import {
    TextField,
    Button,
    Box,
    Typography,
    CircularProgress,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import CloseIcon from "@mui/icons-material/Close";
import ReCAPTCHA from "react-google-recaptcha";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useSnackbar } from "../ui/AppSnackbar";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase";

const AppLoginForm = ({ isOpen, onClose, onSwitchToRegister }) => {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState(null);
    const { showSnackbar } = useSnackbar();
    const { setAccessGranted } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.email.trim()) {
            newErrors.email = "Email address is required.";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Invalid email address.";
        }
        if (!formData.password) {
            newErrors.password = "Password is required.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validate()) {
            setLoading(true);
            try {
                const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
                const user = userCredential.user;

                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists() && userDoc.data().access === true) {
                    setAccessGranted(true);
                    showSnackbar("Login successful!", "success");

                    const expiresAt = Date.now() + 5 * 60 * 1000;
                    localStorage.setItem("authToken", user.accessToken);
                    localStorage.setItem("expiresAt", expiresAt);

                    onClose();
                    navigate("/dashboard");
                } else {
                    showSnackbar("Your account is pending admin approval.", "info");
                    await signOut(auth);
                }
            } catch (error) {
                switch (error.code) {
                    case "auth/user-not-found":
                        showSnackbar("User not found.", "error");
                        break;
                    case "auth/wrong-password":
                        showSnackbar("Incorrect password.", "error");
                        break;
                    case "auth/invalid-email":
                        showSnackbar("Invalid email address.", "error");
                        break;
                    default:
                        showSnackbar("Error logging in. Please try again.", "error");
                }
            } finally {
                setLoading(false);
            }
        }
    };


    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ textAlign: "center", fontWeight: "bold", mt: 3, position: "relative" }}>
                <img src="/image/xpg-logo-clientarea-black.png" alt="XPG Logo" style={{ height: 70, cursor: 'pointer' }} />

                <IconButton
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        top: -15,
                        right: 10,
                        backgroundColor: "#5BC2E7",
                        color: "white",
                        width: 40,
                        height: 40,
                        zIndex: 1301,
                        boxShadow: 3,
                        "&:hover": {
                            backgroundColor: "#3a9dc8",
                        },
                    }}
                >
                    <CloseIcon />
                </IconButton>

            </DialogTitle>
            <DialogContent>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    <TextField
                        placeholder="Your email address"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={!!errors.email}
                        helperText={errors.email}
                        fullWidth
                        required
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EmailIcon />
                                </InputAdornment>
                            ),
                        }}
                        size="medium"
                        sx={{ mb: 3 }}
                    />
                    <TextField
                        placeholder="Password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        error={!!errors.password}
                        helperText={errors.password}
                        fullWidth
                        required
                        sx={{ mt: 2 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockIcon />
                                </InputAdornment>
                            ),
                        }}
                        size="medium"
                    />
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                        <ReCAPTCHA
                            sitekey="6LeNOdcqAAAAAHqNGfPG0TUHNNTH-zy_dqyOrxn_"
                            onChange={setCaptchaToken}
                        />
                    </Box>
                    <Typography textAlign="right" sx={{ cursor: "pointer", color: "#5BC2E7", fontSize: "14px", mt: 4 }}>
                        Forgot your password?
                    </Typography>
                    <Button
                        variant="contained"
                        fullWidth
                        type="submit"
                        disabled={loading || !captchaToken}
                        size="large"
                        sx={{ mt: 3, bgcolor: "#5BC2E7", borderRadius: "24px" }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Sign in"}
                    </Button>
                    <Typography textAlign="center" sx={{ mt: 3, fontSize: "14px", mb: 2 }}>
                        Don’t have an account? <span style={{ color: "#5BC2E7", cursor: "pointer" }} onClick={onSwitchToRegister}>Apply for client access</span>
                    </Typography>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default AppLoginForm;
