"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Waves, ShieldAlert, KeyRound, Mail, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("researcher@aquavision.ai");
  const [password, setPassword] = useState("Research2026!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (role: "admin" | "researcher") => {
    if (role === "admin") {
      setEmail("admin@aquavision.ai");
      setPassword("AquaVision2026!");
    } else {
      setEmail("researcher@aquavision.ai");
      setPassword("Research2026!");
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-slate-950 px-4 py-12">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-cyan-900/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-sky-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.35)] mb-4">
            <Waves className="h-8 w-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            AquaVision <span className="text-cyan-400">AI</span>
          </h1>
          <p className="text-xs text-slate-400">
            Automated Underwater Marine Debris & Anomaly Detection System
          </p>
          <div className="inline-block rounded-full bg-slate-900 border border-slate-800 px-3 py-0.5 text-[10px] font-mono text-cyan-400">
            SIH26057 • SIDE-SCAN SONAR INTELLIGENCE
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-8 backdrop-blur-xl shadow-2xl space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-100">Operator Sign In</h2>
            <p className="text-xs text-slate-400">
              Access the survey screening console and review queue.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-950/60 border border-red-800/60 p-3 text-xs text-red-300">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="operator@aquavision.ai"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="pl-9"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Enter Mission Console <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Demo credential presets */}
          <div className="border-t border-slate-800/80 pt-4 space-y-2">
            <div className="text-[11px] font-mono text-slate-500 text-center">
              QUICK DEMO CREDENTIALS:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials("researcher")}
                className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-left hover:border-cyan-700/60 transition-colors"
              >
                <div className="text-[11px] font-semibold text-cyan-400">Researcher</div>
                <div className="text-[10px] text-slate-400 font-mono">researcher@...</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("admin")}
                className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-left hover:border-cyan-700/60 transition-colors"
              >
                <div className="text-[11px] font-semibold text-cyan-400">Admin</div>
                <div className="text-[10px] text-slate-400 font-mono">admin@...</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer honesty disclaimer */}
        <p className="text-center text-[10px] text-slate-600 font-mono">
          PRECOMPUTED SSS DEMO DATA • HONESTY PROTOCOL ACTIVE
        </p>
      </div>
    </div>
  );
}
