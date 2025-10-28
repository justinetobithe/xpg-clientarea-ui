// src/contexts/AuthContext.js

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Funkcja wylogowania
  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({ uid: user.uid, email: user.email, ...userData });
          setAccessGranted(userData.access);
          setRole(userData.role);
        } else {
          setCurrentUser(null);
          setAccessGranted(false);
          setRole(null);
        }
      } else {
        setCurrentUser(null);
        setAccessGranted(false);
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    accessGranted,
    setAccessGranted,
    role,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
