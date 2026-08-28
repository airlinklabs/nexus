import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api, ApiError } from '../api/client.js';

type User = {
  readonly userId: string;
  readonly username: string;
  readonly avatar: string | null;
};

type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: User }
  | { status: 'unauthenticated' };

const AuthContext = createContext<{
  auth: AuthState;
  logout: () => Promise<void>;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    api.auth
      .me()
      .then((user) => setAuth({ status: 'authenticated', user }))
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) {
          setAuth({ status: 'unauthenticated' });
        } else {
          setAuth({ status: 'unauthenticated' });
        }
      });
  }, []);

  const logout = async () => {
    await api.auth.logout();
    setAuth({ status: 'unauthenticated' });
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ auth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
