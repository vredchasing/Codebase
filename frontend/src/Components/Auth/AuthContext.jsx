import React, { createContext, useState, useEffect } from 'react';
import { api, API_ENDPOINTS, handleError } from '../../utils';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await api.get(API_ENDPOINTS.AUTH.GET_USER);
        setUser(response.data?.user || null);
      } catch (err) {
        handleError(err, 'AuthContext');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
