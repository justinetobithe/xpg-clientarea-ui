import React, { useState } from 'react';
import {
    Box,
    Stack,
    Typography,
    TextField,
    InputAdornment,
    Button,
    Link,
    Checkbox,
    FormControlLabel,
    MenuItem,
    Divider,
    IconButton
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import BusinessIcon from '@mui/icons-material/Business';
import ApartmentIcon from '@mui/icons-material/Apartment';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import xpgLogo from '../assets/images/xpg-logo-2.png';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Link as RouterLink } from 'react-router-dom';

const DEPARTMENTS = ['Marketing', 'Sales', 'Operations', 'Tech', 'Other'];

function Register({ onSwitchToLogin = () => { } }) {
    const [form, setForm] = useState({
        fullName: '',
        company: '',
        department: '',
        email: '',
        password: '',
        confirm: '',
        subscribe: false,
        readNotice: false,
        agreePrivacy: false,
    });
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    };

    const validate = () => {
        const e = {};
        if (!form.fullName.trim()) e.fullName = 'Full name is required.';
        if (!form.company.trim()) e.company = 'Company is required.';
        if (!form.department.trim()) e.department = 'Department is required.';
        if (!form.email.trim()) e.email = 'Email is required.';
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email.';
        if (!form.password) e.password = 'Password is required.';
        else if (form.password.length < 6) e.password = 'Minimum 6 characters.';
        if (form.confirm !== form.password) e.confirm = 'Passwords do not match.';
        if (!form.readNotice) e.readNotice = 'You must confirm you read the notice.';
        if (!form.agreePrivacy) e.agreePrivacy = 'You must agree to the privacy policy.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
            await setDoc(doc(db, 'users', cred.user.uid), {
                fullName: form.fullName.trim(),
                company: form.company.trim(),
                department: form.department.trim(),
                email: form.email.trim().toLowerCase(),
                access: false,
                subscribe: !!form.subscribe,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            try { await sendEmailVerification(cred.user); } catch { }
            await signOut(auth);
            onSwitchToLogin();
        } catch (err) {
            let msg = 'Registration failed. Please try again.';
            if (err.code === 'auth/email-already-in-use') msg = 'This email is already registered.';
            if (err.code === 'auth/invalid-email') msg = 'Invalid email address.';
            if (err.code === 'auth/weak-password') msg = 'Password is too weak.';
            setSubmitError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box
            sx={{
                position: 'relative',
                minHeight: '100dvh',
                overflowY: 'auto',
                overscrollBehaviorY: 'contain',
                scrollBehavior: 'smooth',
                '&::-webkit-scrollbar': { width: 10 },
                '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.25)', borderRadius: 8 },
                '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(255,255,255,0.35)' },
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.25) transparent',
                '&::before': {
                    content: '""',
                    position: 'fixed',
                    inset: 0,
                    backgroundImage: 'url(/image/general-background.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(6px)',
                    transform: 'scale(1.06)',
                    zIndex: -2,
                    pointerEvents: 'none'
                },
                '&::after': {
                    content: '""',
                    position: 'fixed',
                    inset: 0,
                    background: 'linear-gradient(rgba(6,7,10,0.78), rgba(6,7,10,0.9))',
                    zIndex: -1,
                    pointerEvents: 'none'
                },
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                pt: { xs: 4, sm: 8 },
                pb: { xs: 6, sm: 10 },
                px: 2
            }}
        >
            <Box
                component="form"
                onSubmit={handleSubmit}
                noValidate
                sx={{
                    width: '100%',
                    maxWidth: 720,
                    bgcolor: '#1a1b22',
                    color: 'rgba(255,255,255,0.92)',
                    borderRadius: 2,
                    boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
                    px: { xs: 3, sm: 5 },
                    py: { xs: 4, sm: 5 },
                    mb: { xs: 2, sm: 4 }
                }}
            >
                <Stack alignItems="center" spacing={1} mb={1.5}>
                    <Box component="img" src={xpgLogo} alt="XPG Logo" sx={{ height: 100, opacity: 0.95 }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }}>
                        CLIENT AREA
                    </Typography>
                </Stack>

                <Typography align="center" sx={{ mb: 2, color: 'rgba(255,255,255,0.9)', fontSize: 20, fontWeight: 600 }}>
                    Please read before signing up
                </Typography>

                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)', mb: 3, lineHeight: 1.55 }}>
                    The XPG Client Area contains marketing assets, demos, and client-use data for our games and brands.
                    Use a valid company email to apply for access. Personal email providers are not accepted.
                    Your login is personal and must not be shared. Activity may be logged in accordance with our privacy policy.
                    Accounts are reviewed by our team before access is granted. You may request account deletion at any time in your profile settings.
                </Typography>

                <Stack spacing={2}>
                    <TextField
                        fullWidth
                        name="fullName"
                        placeholder="Full name"
                        value={form.fullName}
                        onChange={handleChange}
                        error={!!errors.fullName}
                        helperText={errors.fullName || ' '}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PersonOutlineIcon sx={{ opacity: 0.8, color: '#fff' }} />
                                </InputAdornment>
                            )
                        }}
                        sx={{
                            '& .MuiInputBase-root': { bgcolor: 'transparent', color: 'rgba(255,255,255,0.92)', borderRadius: 1 },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.28)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.42)' },
                            '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#23b0ff' },
                            '& input::placeholder': { color: 'rgba(255,255,255,0.6)', opacity: 1 },
                            '& .MuiFormHelperText-root': { m: 0, mt: 0.5 }
                        }}
                        size="small"
                    />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            fullWidth
                            name="company"
                            placeholder="Company"
                            value={form.company}
                            onChange={handleChange}
                            error={!!errors.company}
                            helperText={errors.company || ' '}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <BusinessIcon sx={{ opacity: 0.8, color: '#fff' }} />
                                    </InputAdornment>
                                )
                            }}
                            sx={{
                                '& .MuiInputBase-root': { bgcolor: 'transparent', color: 'rgba(255,255,255,0.92)', borderRadius: 1 },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.28)' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.42)' },
                                '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#23b0ff' },
                                '& input::placeholder': { color: 'rgba(255,255,255,0.6)', opacity: 1 },
                                '& .MuiFormHelperText-root': { m: 0, mt: 0.5 }
                            }}
                            size="small"
                        />

                        <TextField
                            fullWidth
                            select
                            name="department"
                            label=""
                            value={form.department}
                            onChange={handleChange}
                            error={!!errors.department}
                            helperText={errors.department || ' '}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <ApartmentIcon sx={{ opacity: 0.8, color: '#fff' }} />
                                    </InputAdornment>
                                )
                            }}
                            SelectProps={{ displayEmpty: true }}
                            placeholder="Department"
                            sx={{
                                '& .MuiInputBase-root': { bgcolor: 'transparent', color: 'rgba(255,255,255,0.92)', borderRadius: 1 },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.28)' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.42)' },
                                '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#23b0ff' },
                                '& .MuiSelect-select': { color: 'rgba(255,255,255,0.92)' },
                                '& .MuiFormHelperText-root': { m: 0, mt: 0.5 }
                            }}
                            size="small"
                        >
                            <MenuItem value=""><em>Department</em></MenuItem>
                            {DEPARTMENTS.map((d) => (
                                <MenuItem key={d} value={d}>{d}</MenuItem>
                            ))}
                        </TextField>
                    </Stack>

                    <TextField
                        fullWidth
                        type="email"
                        name="email"
                        placeholder="your.name@company.com"
                        value={form.email}
                        onChange={handleChange}
                        error={!!errors.email}
                        helperText={errors.email || ' '}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EmailOutlinedIcon sx={{ opacity: 0.8, color: '#fff' }} />
                                </InputAdornment>
                            )
                        }}
                        sx={{
                            '& .MuiInputBase-root': { bgcolor: 'transparent', color: 'rgba(255,255,255,0.92)', borderRadius: 1 },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.28)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.42)' },
                            '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#23b0ff' },
                            '& input::placeholder': { color: 'rgba(255,255,255,0.6)', opacity: 1 },
                            '& .MuiFormHelperText-root': { m: 0, mt: 0.5 }
                        }}
                        size="small"
                    />

                    {/* Password with show/hide */}
                    <TextField
                        fullWidth
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        error={!!errors.password}
                        helperText={errors.password || ' '}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockOutlinedIcon sx={{ opacity: 0.8, color: '#fff' }} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={() => setShowPassword((s) => !s)}
                                        edge="end"
                                        sx={{ color: 'rgba(255,255,255,0.9)' }}
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                        sx={{
                            '& .MuiInputBase-root': { bgcolor: 'transparent', color: 'rgba(255,255,255,0.92)', borderRadius: 1 },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.28)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.42)' },
                            '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#23b0ff' },
                            '& input::placeholder': { color: 'rgba(255,255,255,0.6)', opacity: 1 },
                            '& .MuiFormHelperText-root': { m: 0, mt: 0.5 }
                        }}
                        size="small"
                    />

                    {/* Confirm password with show/hide */}
                    <TextField
                        fullWidth
                        type={showConfirm ? 'text' : 'password'}
                        name="confirm"
                        placeholder="Confirm Password"
                        value={form.confirm}
                        onChange={handleChange}
                        error={!!errors.confirm}
                        helperText={errors.confirm || ' '}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockOutlinedIcon sx={{ opacity: 0.8, color: '#fff' }} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle confirm password visibility"
                                        onClick={() => setShowConfirm((s) => !s)}
                                        edge="end"
                                        sx={{ color: 'rgba(255,255,255,0.9)' }}
                                    >
                                        {showConfirm ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                        sx={{
                            '& .MuiInputBase-root': { bgcolor: 'transparent', color: 'rgba(255,255,255,0.92)', borderRadius: 1 },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.28)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.42)' },
                            '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#23b0ff' },
                            '& input::placeholder': { color: 'rgba(255,255,255,0.6)', opacity: 1 },
                            '& .MuiFormHelperText-root': { m: 0, mt: 0.5 }
                        }}
                        size="small"
                    />

                    <Stack spacing={0.5}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    name="subscribe"
                                    checked={form.subscribe}
                                    onChange={handleChange}
                                    sx={{ color: 'rgba(255,255,255,0.55)', '&.Mui-checked': { color: '#23b0ff' } }}
                                />
                            }
                            label={<Typography sx={{ color: 'rgba(255,255,255,0.82)' }}>Subscribe to the XPG newsletter?</Typography>}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    name="readNotice"
                                    checked={form.readNotice}
                                    onChange={handleChange}
                                    sx={{ color: errors.readNotice ? '#f87171' : 'rgba(255,255,255,0.55)', '&.Mui-checked': { color: '#23b0ff' } }}
                                />
                            }
                            label={<Typography sx={{ color: errors.readNotice ? '#f87171' : 'rgba(255,255,255,0.82)' }}>I have read and understood the full notice</Typography>}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    name="agreePrivacy"
                                    checked={form.agreePrivacy}
                                    onChange={handleChange}
                                    sx={{ color: errors.agreePrivacy ? '#f87171' : 'rgba(255,255,255,0.55)', '&.Mui-checked': { color: '#23b0ff' } }}
                                />
                            }
                            label={<Typography sx={{ color: errors.agreePrivacy ? '#f87171' : 'rgba(255,255,255,0.82)' }}>I agree to the privacy policy</Typography>}
                        />
                    </Stack>

                    {submitError && (
                        <Typography role="alert" sx={{ color: '#ff6b6b', fontSize: 14 }}>
                            {submitError}
                        </Typography>
                    )}

                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        sx={{
                            alignSelf: 'center',
                            width: 160,
                            py: 1,
                            bgcolor: '#23b0ff',
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: 1.2,
                            '&:hover': { bgcolor: '#1aa1ef' }
                        }}
                    >
                        {isSubmitting ? 'Registering...' : 'Register'}
                    </Button>

                    <Box textAlign="center" sx={{ mt: 1 }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.78)', fontSize: 14, mb: 0.5 }}>
                            Already have an account?
                        </Typography>
                        <Link component={RouterLink} to="/" underline="hover" sx={{ color: '#23b0ff', fontWeight: 700 }}>
                            Return to login page
                        </Link>
                    </Box>

                    <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.08)' }} />
                </Stack>
            </Box>
        </Box>
    );
}

export default Register;
