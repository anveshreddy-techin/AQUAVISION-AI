"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User } from "./types";
import { api } from "./api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isResearcher: boolean;
  isFieldOperator: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("aquavision_token");
      if (storedToken) {
        setToken(storedToken);
        try {
          const profile = await api.get<User>("/auth/me");
          setUser(profile);
        } catch {
          localStorage.removeItem("aquavision_token");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.post<{ access_token: string; user: User }>("/auth/login", {
      email,
      password: pass,
    });
    localStorage.setItem("aquavision_token", res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("aquavision_token");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const isAdmin = user?.role === "admin";
  const isResearcher = user?.role === "researcher" || isAdmin;
  const isFieldOperator = user?.role === "field_operator" || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAdmin,
        isResearcher,
        isFieldOperator,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
