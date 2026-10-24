"use client";

import { useState } from "react";
import { ShinyButton } from "@/components/ui/shiny-button";
import { ShieldCheck } from "lucide-react";

interface SignOffPanelProps {
  confidenceScore: number;
  recipientDesignation: string;
  onSignOff: (mfaCode: string) => void;
}

export default function SignOffPanel({ confidenceScore, recipientDesignation, onSignOff }: SignOffPanelProps) {
  const [totp, setTotp] = useState("");

  const handleSignOff = () => {
    if (totp.length === 6) {
      onSignOff(totp);
    }
  };

  return (
    <div className="p-6 bg-slate-800 rounded-xl border border-slate-700 shadow-xl max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-2">Supervisor SAHYOG Sign-Off</h2>
      
      <div className="mb-6 space-y-3">
        <div className="flex justify-between items-center p-3 bg-slate-900 rounded border border-slate-600">
          <span className="text-slate-400 text-sm">Algorithmic Confidence</span>
          <span className={`font-bold ${confidenceScore >= 0.85 ? 'text-green-400' : 'text-amber-400'}`}>
            {(confidenceScore * 100).toFixed(1)}%
          </span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-slate-900 rounded border border-slate-600">
          <span className="text-slate-400 text-sm">Named Recipient</span>
          <span className="text-white font-medium">{recipientDesignation}</span>
        </div>
      </div>

      <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg mb-6">
        <p className="text-sm text-blue-200 mb-3">
          To authorize this dispatch, please re-authenticate using your MFA token. This action will be immutably recorded in the audit log.
        </p>
        <input 
          type="text" 
          value={totp}
          onChange={(e) => setTotp(e.target.value)}
          placeholder="6-digit MFA"
          className="w-full p-2.5 rounded bg-slate-900 border border-slate-600 text-white font-mono tracking-widest focus:ring-2 focus:ring-blue-500 outline-none"
          maxLength={6}
        />
      </div>

      <ShinyButton 
        onClick={handleSignOff}
        disabled={totp.length !== 6}
        variant="emerald"
        size="md"
        shape="rounded"
        fullWidth
      >
        <ShieldCheck className="w-4 h-4 mr-1.5" />
        <span>Authorize SAHYOG Dispatch</span>
      </ShinyButton>
    </div>
  );
}
