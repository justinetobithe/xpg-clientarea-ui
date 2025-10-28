import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase'; // Twój plik konfiguracji Firebase
import leafIcon from '../assets/images/XPG_logo_White_Client-Area.svg';
import './css/ForgotPassword.modal.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [customError, setCustomError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Rozpoczęcie procesu resetowania hasła dla adresu:", email);

    // Reset poprzednich komunikatów
    setCustomError('');
    setSuccessMessage('');

    // Normalizacja adresu email (usuwa spacje i zmienia na małe litery)
    const normalizedEmail = email.trim().toLowerCase();
    console.log("Znormalizowany email:", normalizedEmail);

    if (!normalizedEmail) {
      const errorMsg = 'Error: Email address is required.';
      setCustomError(errorMsg);
      console.error(errorMsg);
      return;
    }

    try {
      // Bezpośrednie wysłanie linku resetującego
      console.log('Wysyłanie linku resetującego hasło na adres:', normalizedEmail);
      await sendPasswordResetEmail(auth, normalizedEmail);
      console.log('Link resetujący hasło został wysłany pomyślnie.');
      setSuccessMessage('Success: A password reset link has been sent to your email address.');
      setEmail('');
    } catch (error) {
      console.error('Błąd podczas resetowania hasła:', error);

      if (error.code === 'auth/invalid-email') {
        setCustomError('Error: The email address format is invalid.');
      } else if (error.code === 'auth/user-not-found') {
        setCustomError('Error: There is no account with that email address in Auth.');
      } else {
        setCustomError(`Error: ${error.message}`);
      }
    }
  };

  return (
    <div className="forgot-password-container">
      {/* Nagłówek (logo) */}
      <header className="forgot-password-header">
        <div className="logo-container">
          <img src={leafIcon} alt="Leaf Icon" className="leaf-icon" />
        </div>
      </header>

      {/* Sekcja informacyjna */}
      <div className="info-section">
        <p className="info-text">
          Please enter your email address. You will receive an email message with instructions on how to reset your password.
        </p>
      </div>

      {/* Karta błędu */}
      {customError && (
        <div className="error-section">
          <p className="error-text">{customError}</p>
        </div>
      )}

      {/* Karta sukcesu */}
      {successMessage && (
        <div className="success-section">
          <p className="success-text">{successMessage}</p>
        </div>
      )}

      {/* Formularz resetowania hasła */}
      <form onSubmit={handleSubmit} className="forgot-password-form">
        <label htmlFor="emailField" className="form-label">
          Email Address
        </label>
        <input
          id="emailField"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="forgot-password-input"
          required
        />
        <button type="submit" className="forgot-password-button">
          Get New Password
        </button>
      </form>
    </div>
  );
}

export default ForgotPassword;
