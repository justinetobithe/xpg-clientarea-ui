import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Button,
  Link,
  Divider
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import xpgLogo from '../assets/images/xpg-logo-2.png';
import { signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [firebaseError, setFirebaseError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remember, setRemember] = useState(false);
  const authCtx = typeof useAuth === 'function' ? useAuth() : null;
  const setAccessGranted = authCtx?.setAccessGranted;
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email address is required.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email address.';
    if (!formData.password) newErrors.password = 'Password is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFirebaseError('');
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.access === true) {
          if (typeof setAccessGranted === 'function') setAccessGranted(true);
          navigate('/', { replace: true });
        } else {
          setFirebaseError('Your account is pending admin approval.');
          await signOut(auth);
        }
      } else {
        setFirebaseError('User data not found.');
        await signOut(auth);
      }
    } catch (error) {
      switch (error.code) {
        case 'auth/user-not-found':
          setFirebaseError('User not found.');
          break;
        case 'auth/wrong-password':
          setFirebaseError('Incorrect password.');
          break;
        case 'auth/invalid-email':
          setFirebaseError('Invalid email address.');
          break;
        default:
          setFirebaseError('Error logging in. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100dvh',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'fixed',
          inset: 0,
          backgroundImage: 'url(/image/general-background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(6px)',
          transform: 'scale(1.06)',
          zIndex: -2
        },
        '&::after': {
          content: '""',
          position: 'fixed',
          inset: 0,
          background: 'linear-gradient(rgba(6,7,10,0.78), rgba(6,7,10,0.9))',
          zIndex: -1
        },
        display: 'grid',
        placeItems: 'center',
        p: 2
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{
          width: '100%',
          maxWidth: 560,
          bgcolor: '#1a1b22',
          color: 'rgba(255,255,255,0.92)',
          borderRadius: 2,
          boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
          px: { xs: 3, sm: 5 },
          py: { xs: 4, sm: 5 }
        }}
      >
        <Stack alignItems="center" spacing={1} mb={1.5}>
          <Box component="img" src={xpgLogo} alt="XPG Logo" sx={{ height: 100, opacity: 0.95 }} />
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }}>
            CLIENT AREA
          </Typography>
        </Stack>

        <Typography align="center" sx={{ mb: 2.5, color: 'rgba(255,255,255,0.9)', fontSize: 22, fontWeight: 600 }}>
          Client login
        </Typography>

        <Stack spacing={2}>
          <TextField
            fullWidth
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email"
            autoComplete="email"
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

          <TextField
            fullWidth
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
            autoComplete="current-password"
            error={!!errors.password}
            helperText={errors.password || ' '}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ opacity: 0.8, color: '#fff' }} />
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

          <FormControlLabel
            control={
              <Checkbox
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                sx={{ color: 'rgba(255,255,255,0.55)', '&.Mui-checked': { color: '#23b0ff' } }}
              />
            }
            label={<Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Remember me on this device</Typography>}
          />

          {firebaseError && (
            <Typography role="alert" sx={{ color: '#ff6b6b', fontSize: 14, mt: -0.5 }}>
              {firebaseError}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{
              alignSelf: 'center',
              width: 140,
              mt: firebaseError ? 0.5 : 0.5,
              py: 1,
              bgcolor: '#23b0ff',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 1.2,
              '&:hover': { bgcolor: '#1aa1ef' }
            }}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </Button>

          <Box sx={{ textAlign: 'center', mt: 0.5 }}>
            <Link component={RouterLink} to="/forgot-password" underline="hover" sx={{ color: '#23b0ff', fontSize: 14 }}>
              Forgot password?
            </Link>
          </Box>

          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.08)' }} />

          <Box textAlign="center">
            <Typography sx={{ color: 'rgba(255,255,255,0.78)', fontSize: 14, mb: 0.5 }}>
              Create an account?
            </Typography>
            <Link component={RouterLink} to="/register" underline="hover" sx={{ color: '#23b0ff', fontWeight: 700 }}>
              Register for a new account
            </Link>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

export default Login;
