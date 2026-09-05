import { useAuthStore } from '../store/authStore';
import { useAuthContext } from '../context/AuthContext';

export function useAuth() {
  const storeToken = useAuthStore((s) => s.token);
  const storeUser = useAuthStore((s) => s.user);
  const storeLogin = useAuthStore((s) => s.login);
  const storeLogout = useAuthStore((s) => s.logout);

  return {
    token: storeToken,
    user: storeUser,
    isAuthenticated: Boolean(storeToken),
    login: storeLogin,
    logout: storeLogout,
  };
}

export default useAuth;
