import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth as authApi } from "./api-client";
import type { LoginRequest } from "./types";

interface User {
  id: string;
  email: string;
  role: "merchant" | "admin";
  merchant_id?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (creds: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("sp_token");
    const stored = localStorage.getItem("sp_user");
    if (token && stored) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.clear(); }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (creds: LoginRequest) => {
    const res = await authApi.login(creds);
    localStorage.setItem("sp_token", res.token);
    localStorage.setItem("sp_user", JSON.stringify(res.user));
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    localStorage.removeItem("sp_token");
    localStorage.removeItem("sp_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
