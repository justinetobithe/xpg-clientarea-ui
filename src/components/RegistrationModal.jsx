// src/components/RegistrationModal.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './css/RegistrationModal.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSmile, faEnvelope, faLock, faTimes } from '@fortawesome/free-solid-svg-icons';
import xpgLogo from '../assets/images/XPG logo.png';
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

function RegistrationModal({ isOpen, onClose, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [firebaseError, setFirebaseError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Resetowanie stanu po zamknięciu modala
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        fullName: '',
        email: '',
        password: '',
      });
      setErrors({});
      setFirebaseError('');
      setIsSubmitting(false);
      setRegistrationSuccess(false);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    }
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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFirebaseError('');

    if (validate()) {
      setIsSubmitting(true);
      try {
        // Tworzymy użytkownika w Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        const user = userCredential.user;

        // Zapisujemy dane użytkownika w Firestore z domyślnym dostępem false
        await setDoc(doc(db, 'users', user.uid), {
          fullName: formData.fullName,
          email: formData.email,
          role: 'user',
          access: false,
          createdAt: new Date(),
        });

        // Wylogowujemy użytkownika, aby globalny stan (np. header) nie zmieniał się
        await signOut(auth);

        // Wyświetlamy komunikat o przyjęciu prośby o dostęp
        setRegistrationSuccess(true);
      } catch (error) {
        console.error('Registration error:', error);
        setFirebaseError(error.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          <FontAwesomeIcon icon={faTimes} />
        </button>
        <div className={styles.logoContainer}>
          <img src={xpgLogo} alt="XPG Logo" className={styles.logo} />
        </div>

        {registrationSuccess ? (
          <div className={styles.successMessage}>
            <h2>Registration Received!</h2>
            <p>Your request is pending admin approval.</p>
          </div>
        ) : (
          <>
            <h2 className={styles.header}>Request Access</h2>
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.inputGroup}>
                <FontAwesomeIcon icon={faSmile} className={styles.inputIcon} />
                <input
                  type="text"
                  name="fullName"
                  placeholder="Your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`${styles.inputField} ${errors.fullName ? styles.inputError : ''}`}
                />
                {errors.fullName && <span className={styles.error}>{errors.fullName}</span>}
              </div>

              <div className={styles.inputGroup}>
                <FontAwesomeIcon icon={faEnvelope} className={styles.inputIcon} />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  className={`${styles.inputField} ${errors.email ? styles.inputError : ''}`}
                />
                {errors.email && <span className={styles.error}>{errors.email}</span>}
              </div>

              <div className={styles.inputGroup}>
                <FontAwesomeIcon icon={faLock} className={styles.inputIcon} />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`${styles.inputField} ${errors.password ? styles.inputError : ''}`}
                />
                {errors.password && <span className={styles.error}>{errors.password}</span>}
              </div>

              {firebaseError && <span className={styles.firebaseError}>{firebaseError}</span>}

              <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Request Access'}
              </button>

              <div className={styles.linksContainer}>
                <a href="/forgot-password" className={styles.forgotPasswordLink}>
                  Forgot your password?
                </a>
                <span className={styles.alreadyAccount}>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className={styles.signInLink}
                    onClick={onSwitchToLogin}
                  >
                    Sign in
                  </button>
                </span>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

RegistrationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSwitchToLogin: PropTypes.func.isRequired,
};

export default RegistrationModal;
