"use client";

import { useState } from "react";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Lock } from "lucide-react";

export default function LoginForm() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Integration logic stub
    if (!userId || !password || !totp) {
      setError("Please fill in all fields including MFA code.");
      return;
    }
    // Proceed to authenticate with backend...
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="p-8 bg-slate-800 shadow-xl rounded-2xl w-full max-w-md border border-slate-700">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">PHANTASM Secure Login</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">User ID / Badge Number</label>
            <input 
              type="text" 
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full p-2.5 rounded bg-slate-900 border border-slate-600 text-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
              placeholder="e.g. IO-10492"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 rounded bg-slate-900 border border-slate-600 text-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">MFA Authenticator Code</label>
            <input 
              type="text" 
              value={totp}
              onChange={(e) => setTotp(e.target.value)}
              className="w-full p-2.5 rounded bg-slate-900 border border-slate-600 text-white focus:ring-2 focus:ring-blue-500 outline-none transition font-mono tracking-widest" 
              placeholder="000 000"
              maxLength={6}
            />
          </div>

          <div className="pt-2">
            <ShinyButton 
              type="submit"
              variant="brand"
              size="md"
              shape="rounded"
              fullWidth
            >
              <Lock className="w-3.5 h-3.5 mr-1.5" />
              <span>Authenticate & Proceed</span>
            </ShinyButton>
          </div>
        </form>
      </div>
    </div>
  );
}
