// src/components/AuthModalManager.jsx
import React, { useState } from 'react';
import Login from './Login';
import RegistrationModal from './RegistrationModal';

function AuthModalManager() {
  // modalType can be 'login', 'register', or null (closed)
  const [modalType, setModalType] = useState(null);

  const openLogin = () => setModalType('login');
  const openRegister = () => setModalType('register');
  const closeModal = () => setModalType(null);

  return (
    <>
      {modalType === 'login' && (
        <Login
          isOpen={true}
          onClose={closeModal}
          onSwitchToRegister={openRegister}
        />
      )}
      {modalType === 'register' && (
        <RegistrationModal
          isOpen={true}
          onClose={closeModal}
          onSwitchToLogin={openLogin}
        />
      )}
    </>
  );
}

export default AuthModalManager;
