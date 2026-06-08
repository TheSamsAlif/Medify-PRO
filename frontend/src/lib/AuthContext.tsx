import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api, clearToken, loadToken, saveToken } from "./api";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthCtx {
  user: User | null;
  bootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (params: { name: string; email: string; password: string; age?: number; language?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await loadToken();
        if (t) {
          const res = await api.get("/auth/me");
          setUser(res.data);
        }
      } catch {
        await clearToken();
      } finally {
        setBootstrapping(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    await saveToken(res.data.token);
    setUser(res.data.user);
  }, []);

  const register = useCallback(async (params: { name: string; email: string; password: string; age?: number; language?: string }) => {
    const res = await api.post("/auth/register", params);
    await saveToken(res.data.token);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, bootstrapping, login, register, logout }), [user, bootstrapping, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
