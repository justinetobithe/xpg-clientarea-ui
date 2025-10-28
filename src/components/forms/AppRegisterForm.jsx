import React, { useState, useEffect } from "react";
import {
    TextField, Button, Box, Typography, CircularProgress, InputAdornment, Dialog,
    DialogTitle, DialogContent, IconButton,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import CloseIcon from "@mui/icons-material/Close";
import ReCAPTCHA from "react-google-recaptcha";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../../firebase";
import { getDocs, collection, query, orderBy, limit, setDoc, doc } from "firebase/firestore";
import { useSnackbar } from "../ui/AppSnackbar";
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';

const AppRegisterForm = ({ isOpen, onClose, onSwitchToLogin }) => {
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});
    const { showSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState(null);
    const [userIPInfo, setUserIPInfo] = useState(null);

    useEffect(() => {
        const fetchIPInfo = async () => {
            try {
                const res = await fetch("https://ipapi.co/json/");
                const data = await res.json();
                setUserIPInfo({
                    ip: data.ip,
                    city: data.city,
                    region: data.region,
                    country: data.country_name,
                    loc: data.loc,
                });
            } catch (err) {
                console.error("Failed to fetch IP info:", err);
            }
        };
        fetchIPInfo();
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setFormData({ fullName: '', email: '', password: '', confirmPassword: '' });
            setErrors({});
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required.';
        if (!formData.email.trim()) {
            newErrors.email = 'Email address is required.';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email address.';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required.';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters.';
        }
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password.';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match.';
            showSnackbar('Passwords do not match!', 'error');
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, orderBy("opid", "desc"), limit(1));
            const querySnapshot = await getDocs(q);

            let latestOPId = 0;
            if (!querySnapshot.empty) {
                const lastDoc = querySnapshot.docs[0];
                latestOPId = lastDoc.data().OPId || 0;
            }
            const newOPId = latestOPId + 1;

            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            await setDoc(doc(db, 'users', user.uid), {
                fullName: formData.fullName,
                email: formData.email,
                role: 'user',
                access: false,
                createdAt: new Date(),
                id: user.uid,
                uid: user.uid,
                opid: newOPId,
                ip: userIPInfo?.ip || null,
                location: {
                    city: userIPInfo?.city || null,
                    region: userIPInfo?.region || null,
                    country: userIPInfo?.country || null,
                    coordinates: userIPInfo?.loc || null,
                },
            });

            await signOut(auth);
            showSnackbar("Registration successful! Your account is pending admin approval.", "success");
            onClose();
        } catch (error) {
            console.error('Registration error:', error);
            if (error.code === 'auth/email-already-in-use') {
                setErrors((prev) => ({ ...prev, email: 'This email is already in use.' }));
                showSnackbar('This email is already in use.', 'error');
            } else {
                showSnackbar(error.message, 'error');
            }
        } finally {
            setLoading(false);
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
                        placeholder="Your full name"
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        error={!!errors.fullName}
                        helperText={errors.fullName}
                        fullWidth
                        required
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EmojiEmotionsIcon />
                                </InputAdornment>
                            ),
                        }}
                        size="medium"
                        sx={{ mb: 3 }}
                    />
                    <TextField
                        placeholder="Email address"
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
                    <TextField
                        placeholder="Confirm Password"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword}
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
                    <Typography mt={4} textAlign="right" sx={{ mt: 1, cursor: "pointer", color: "#5BC2E7", fontSize: "14px" }}>
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
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Request access"}
                    </Button>
                    <Typography textAlign="center" sx={{ mt: 3, fontSize: "14px", mb: 2 }}>
                        Already have an account? <span style={{ color: "#5BC2E7", cursor: "pointer" }} onClick={onSwitchToLogin}>Sign in</span>
                    </Typography>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default AppRegisterForm;
