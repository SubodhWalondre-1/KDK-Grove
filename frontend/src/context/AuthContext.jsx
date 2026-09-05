import { createContext, useContext } from 'react';
import { useAuthStore } from '../store/authStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    // Fallback to store directly if used outside provider
    const token = useAuthStore.getState().token;
    const user = useAuthStore.getState().user;
    const login = useAuthStore.getState().login;
    const logout = useAuthStore.getState().logout;
    return { token, user, isAuthenticated: Boolean(token), login, logout };
  }
  return context;
}

export default AuthContext;
