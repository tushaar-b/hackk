"use client";

import React from 'react';
import { 
  Hexagon, 
  Scale, 
  Building2, 
  Coins, 
  Network, 
  Settings, 
  LogOut, 
  CheckCircle2
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  currentStep?: number;
  onStepChange?: (step: number) => void;
  activeCase?: { caseId: string; seedAddress: string } | null;
}

const STAGES = [
  { id: 1, label: "Statutory Reference", icon: Scale, subtitle: "Legal Mandate & FIR" },
  { id: 2, label: "Investigating Unit", icon: Building2, subtitle: "Police Station & Officer" },
  { id: 3, label: "Target Seed Address", icon: Coins, subtitle: "Suspect Wallet Address" },
  { id: 4, label: "Graph Resolution", icon: Network, subtitle: "On-Chain Attribution" },
];

export default function AppShell({ 
  children, 
  currentStep = 1, 
  onStepChange,
  activeCase
}: AppShellProps) {
  const activeStage = activeCase ? 4 : currentStep;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex overflow-hidden">
      
      {/* Sidebar - Clean Institutional Design */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-20 shrink-0 select-none shadow-xs">
        
        {/* Brand Header */}
        <div className="h-20 flex items-center px-5 border-b border-slate-200 space-x-3">
          <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
            <img 
              src="/logo.png" 
              alt="PHANTASM Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base tracking-tight font-extrabold text-slate-900 leading-tight font-mono">PHANTASM</span>
            <span className="text-[9.5px] font-mono tracking-widest text-[#1B729E] uppercase font-bold">TRACK • HUNT • SECURE</span>
          </div>
        </div>
        
        {/* Navigation Stages */}
        <nav className="flex-1 py-6 px-3.5 space-y-1.5">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Case Setup Steps
          </div>

          {STAGES.map((stage) => {
            const Icon = stage.icon;
            const isActive = activeStage === stage.id;
            const isCompleted = activeStage > stage.id;
            const isClickable = Boolean(onStepChange);

            return (
              <button
                key={stage.id}
                type="button"
                disabled={!isClickable}
                onClick={() => onStepChange?.(stage.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-150 text-left group ${
                  isActive
                    ? 'bg-sky-50 border border-sky-200 text-[#1B729E] font-semibold shadow-xs'
                    : 'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`transition-colors ${
                    isActive ? 'text-[#1B729E]' : isCompleted ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    <Icon className="w-4 h-4" strokeWidth={isActive ? 2.2 : 1.8} />
                  </div>
                  <div>
                    <span className={`block text-xs font-semibold ${
                      isActive ? 'text-[#1B729E]' : 'text-slate-800'
                    }`}>
                      {stage.label}
                    </span>
                    <span className="block text-[11px] text-slate-500 font-normal">
                      {stage.subtitle}
                    </span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div>
                  {isActive && (
                    <span className="inline-block w-2 h-2 rounded-full bg-[#1B729E]" />
                  )}
                  {isCompleted && !isActive && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>
        
        {/* Bottom Settings Link */}
        <div className="p-3.5 border-t border-slate-200">
          <button 
            type="button"
            className="w-full flex items-center px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors group text-xs font-medium"
          >
            <Settings className="w-4 h-4 mr-2.5 text-slate-500 group-hover:text-slate-800" />
            <span>Settings & API Keys</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 bg-white p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
              <img src="/logo.png" alt="Phantasm" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold tracking-wider uppercase text-slate-900 leading-tight">
                Investigation Suite
              </h2>
              <p className="text-[10.5px] text-slate-500 font-mono">
                Lawful Attribution & Crypto Asset Tracking
              </p>
            </div>
          </div>

          {/* Officer Session Indicator */}
          <div className="flex items-center space-x-3.5">
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-slate-800">Offc. A. Sharma (IO)</span>
              <span className="text-[11px] text-[#1B729E] font-mono font-medium">SHM-8891-ND</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-mono text-xs font-semibold">
              AS
            </div>
            <button className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors" title="End Session">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8 relative">
          {children}
        </main>
      </div>
      
    </div>
  );
}
