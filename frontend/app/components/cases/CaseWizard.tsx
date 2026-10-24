"use client";

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Scale, 
  FileText, 
  Layers, 
  Building2, 
  UserCheck, 
  Search, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles
} from 'lucide-react';
import { ShinyButton } from '@/components/ui/shiny-button';

interface AuthorityState {
  statuteRef: string;
  firNumber: string;
  policeStation: string;
  ioDesignation: string;
  jurisdictionBench: string;
  incidentType: string;
}

interface CaseWizardProps {
  currentStep?: 1 | 2 | 3;
  initialSeedAddress?: string;
  initialAuthority?: Partial<AuthorityState>;
  onStepChange?: (step: 1 | 2 | 3) => void;
  onComplete?: (caseId: string, seedAddress: string, firNumber: string, ioDesignation: string) => void;
}

const STATUTE_OPTIONS = [
  {
    id: "Sec 94 BNSS",
    title: "Section 94 BNSS",
    badge: "BNSS 2023",
    description: "Production of electronic documents & crypto transaction records",
    icon: Scale,
  },
  {
    id: "Sec 79(3)(b) IT Act",
    title: "Sec 79(3)(b) IT Act",
    badge: "IT ACT 2000",
    description: "Intermediary takedown, metadata disclosure & freeze directive",
    icon: ShieldCheck,
  },
  {
    id: "Sec 91 CrPC",
    title: "Section 91 CrPC",
    badge: "CRPC 1973",
    description: "Summons to produce transaction ledgers and KYC identity files",
    icon: FileText,
  },
  {
    id: "PMLA Sec 50 / FEMA",
    title: "PMLA Sec 50",
    badge: "FINANCIAL CRIME",
    description: "Enforcement Directorate summons & proceeds of crime seizure",
    icon: Layers,
  }
];

export default function CaseWizard({ 
  currentStep: propStep, 
  initialSeedAddress = '',
  initialAuthority,
  onStepChange, 
  onComplete 
}: CaseWizardProps) {
  const [internalStep, setInternalStep] = useState<1 | 2 | 3>(1);
  const currentStep = propStep ?? internalStep;

  const setStep = (step: 1 | 2 | 3) => {
    if (onStepChange) onStepChange(step);
    else setInternalStep(step);
  };

  const [authority, setAuthority] = useState<AuthorityState>({
    statuteRef: initialAuthority?.statuteRef || 'Sec 94 BNSS',
    firNumber: initialAuthority?.firNumber || '',
    policeStation: initialAuthority?.policeStation || '',
    ioDesignation: initialAuthority?.ioDesignation || '',
    jurisdictionBench: initialAuthority?.jurisdictionBench || '',
    incidentType: initialAuthority?.incidentType || ''
  });

  const [seedAddress, setSeedAddress] = useState(initialSeedAddress);
  const [disputedAmount, setDisputedAmount] = useState('');

  const detectChain = (addr: string) => {
    if (!addr) return null;
    const clean = addr.trim();
    if (/^0x[a-fA-F0-9]{40}$/.test(clean)) return 'Ethereum (ERC-20)';
    if (/^(1|3)[a-zA-HJ-NP-Z0-9]{25,39}$/.test(clean) || /^(bc1)[a-zA-HJ-NP-Z0-9]{25,39}$/.test(clean)) return 'Bitcoin (UTXO)';
    if (/^T[A-Za-z1-9]{33}$/.test(clean)) return 'TRON (TRC-20)';
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(clean)) return 'Solana (SPL)';
    return 'Custom / Multi-Chain';
  };

  const detectedChain = detectChain(seedAddress);

  const isStep1Valid = authority.statuteRef.trim() !== '' && authority.firNumber.trim() !== '';
  const isStep2Valid = authority.policeStation.trim() !== '' && authority.ioDesignation.trim() !== '';
  const isStep3Valid = seedAddress.trim() !== '';

  const handleNext = () => {
    if (currentStep === 1 && isStep1Valid) setStep(2);
    else if (currentStep === 2 && isStep2Valid) setStep(3);
  };

  const handleBack = () => {
    if (currentStep === 3) setStep(2);
    else if (currentStep === 2) setStep(1);
  };

  const handleFinalSubmit = () => {
    if (!isStep1Valid || !isStep2Valid || !isStep3Valid) return;
    const newCaseId = `PHT-${Math.floor(1000 + Math.random() * 9000)}`;
    onComplete?.(newCaseId, seedAddress, authority.firNumber, authority.ioDesignation);
  };

  return (
    <div className="max-w-5xl mx-auto py-2 px-2">
      {/* Step Header Indicator */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-white border border-slate-200 p-0.5 flex items-center justify-center shadow-xs shrink-0">
            <img src="/logo.png" alt="Phantasm" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase tracking-wider text-[#1B729E] font-bold font-mono">PHANTASM CASE SETUP</span>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] font-mono text-slate-500 font-semibold">STAGE 0{currentStep} / 03</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              {currentStep === 1 && "Step 1: Statutory Authority & Case FIR"}
              {currentStep === 2 && "Step 2: Police Station & Investigating Officer"}
              {currentStep === 3 && "Step 3: Target Address & Resolution Launch"}
            </div>
          </div>
        </div>

        {/* Progress Pills */}
        <div className="flex items-center space-x-2">
          {[1, 2, 3].map((step) => (
            <button
              key={step}
              onClick={() => {
                if (step === 1) setStep(1);
                if (step === 2 && isStep1Valid) setStep(2);
                if (step === 3 && isStep1Valid && isStep2Valid) setStep(3);
              }}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                currentStep === step 
                  ? 'w-8 bg-[#1B729E]' 
                  : step < currentStep 
                    ? 'w-4 bg-emerald-600' 
                    : 'w-4 bg-slate-200'
              }`}
              title={`Jump to Step ${step}`}
            />
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: STATUTORY REFERENCE & FIR NUMBER */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="animate-fadeIn">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold uppercase tracking-wider text-slate-900 mb-2">
            SELECT STATUTORY REFERENCE
          </h1>
          <p className="text-slate-600 text-sm mb-8">
            Establish legal authority mandate under Indian criminal procedural statutory code for on-chain discovery.
          </p>

          {/* Statutory Reference 4 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {STATUTE_OPTIONS.map((item) => {
              const Icon = item.icon;
              const isSelected = authority.statuteRef === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setAuthority({ ...authority, statuteRef: item.id })}
                  className={`relative cursor-pointer rounded-xl p-4 transition-all duration-150 flex flex-col justify-between select-none ${
                    isSelected
                      ? 'bg-sky-50/50 border-2 border-[#1B729E] shadow-sm'
                      : 'bg-white border border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  {/* Top Badge Tag */}
                  <div className="mb-4">
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                      isSelected 
                        ? 'bg-sky-100 text-[#1B729E] border border-sky-200 font-semibold' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      <Icon className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                      <span>{item.badge}</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Checkmark */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 text-[#1B729E]">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* FIR / DD Number Large Input Bar */}
          <div className="mb-10 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              FIR / DD Number (Incident Registration) <span className="text-[#1B729E]">*</span>
            </label>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono font-bold">
                #
              </div>
              <input
                type="text"
                placeholder="e.g. FIR-2026/08/891 or Station Daily Diary Entry"
                value={authority.firNumber}
                onChange={(e) => setAuthority({ ...authority, firNumber: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 focus:border-[#1B729E] focus:bg-white focus:ring-2 focus:ring-[#1B729E]/15 rounded-lg pl-9 pr-4 py-3 text-slate-900 text-sm font-mono focus:outline-none transition-all"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Official Police Station FIR number, General Diary (GD) entry, or Cyber Crime Portal acknowledgement number.
            </p>
          </div>

          {/* Step 1 Footer */}
          <div className="flex items-center justify-between pt-5 border-t border-slate-200">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Lawful authority validated</span>
            </div>

            <ShinyButton
              onClick={handleNext}
              disabled={!isStep1Valid}
              variant="brand"
              size="md"
              shape="rounded"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </ShinyButton>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: POLICE STATION / UNIT & CREDENTIALS */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="animate-fadeIn">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold uppercase tracking-wider text-slate-900 mb-2">
            INVESTIGATING UNIT & OFFICER RECORD
          </h1>
          <p className="text-slate-600 text-sm mb-8">
            Specify the police station, jurisdictional unit, and authorized investigating officer credentials.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* Police Station / Unit */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Police Station / Unit <span className="text-[#1B729E]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Cyber Crime Police Station, Delhi"
                  value={authority.policeStation}
                  onChange={(e) => setAuthority({ ...authority, policeStation: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#1B729E] focus:bg-white focus:ring-2 focus:ring-[#1B729E]/15 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 text-xs focus:outline-none transition-all"
                />
              </div>


            </div>

            {/* IO Designation & Identification */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Investigating Officer (IO) & ID <span className="text-[#1B729E]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Inspector A. Sharma (Badge #SHM-8891)"
                    value={authority.ioDesignation}
                    onChange={(e) => setAuthority({ ...authority, ioDesignation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#1B729E] focus:bg-white focus:ring-2 focus:ring-[#1B729E]/15 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 text-xs focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Magistrate / Jurisdiction Bench
                </label>
                <input
                  type="text"
                  placeholder="e.g. Special Cyber Court / CMM Bench"
                  value={authority.jurisdictionBench}
                  onChange={(e) => setAuthority({ ...authority, jurisdictionBench: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#1B729E] focus:bg-white focus:ring-2 focus:ring-[#1B729E]/15 rounded-lg px-3 py-2.5 text-slate-900 text-xs focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>



          {/* Step 2 Footer Navigation */}
          <div className="flex items-center justify-between pt-5 border-t border-slate-200">
            <ShinyButton
              onClick={handleBack}
              variant="outline"
              size="sm"
              shape="rounded"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </ShinyButton>

            <ShinyButton
              onClick={handleNext}
              disabled={!isStep2Valid}
              variant="brand"
              size="md"
              shape="rounded"
            >
              <span>Continue to Seed Target</span>
              <ArrowRight className="w-4 h-4" />
            </ShinyButton>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: TARGET BLOCKCHAIN SEED ADDRESS & RESOLUTION */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="animate-fadeIn">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold uppercase tracking-wider text-slate-900 mb-2">
            TARGET BLOCKCHAIN SEED ADDRESS
          </h1>
          <p className="text-slate-600 text-sm mb-8">
            Seed the multigraph engine with suspect wallet address or illicit transfer destination.
          </p>

          {/* Mandate Summary Box */}
          <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-white border border-sky-200 text-[#1B729E] shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-mono font-semibold">ESTABLISHED MANDATE</div>
                <div className="text-xs font-bold text-slate-900">
                  {authority.statuteRef} • {authority.firNumber}
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 text-right">
              <div>{authority.policeStation}</div>
              <div className="text-[#1B729E] font-semibold">{authority.ioDesignation}</div>
            </div>
          </div>

          {/* Seed Address Input */}
          <div className="space-y-3 mb-6 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Suspect Wallet / Seed Recipient Address <span className="text-[#1B729E]">*</span>
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Enter Bitcoin, Ethereum, Tron, or Solana address..."
                value={seedAddress}
                onChange={(e) => setSeedAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:border-[#1B729E] focus:bg-white focus:ring-2 focus:ring-[#1B729E]/15 rounded-lg pl-9 pr-36 py-3 text-slate-900 font-mono text-sm focus:outline-none transition-all"
              />

              {detectedChain && (
                <div className="absolute inset-y-0 right-2.5 flex items-center">
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-sky-100 text-[#1B729E] border border-sky-200">
                    {detectedChain}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Disputed Amount & Threshold */}
          <div className="mb-8 p-5 rounded-xl bg-white border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-5 shadow-2xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Estimated Disputed Value (INR)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-semibold font-mono">
                  ₹
                </div>
                <input
                  type="text"
                  placeholder="2,500,000"
                  value={disputedAmount}
                  onChange={(e) => setDisputedAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#1B729E] focus:bg-white rounded-lg pl-8 pr-3 py-2 text-slate-900 text-xs font-mono focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Finality Confirmations
              </label>
              <div className="py-2 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 flex items-center justify-between">
                <span>Bitcoin: 6 Blocks</span>
                <span className="text-[#1B729E] font-semibold">Ethereum: 12 Epochs</span>
              </div>
            </div>
          </div>

          {/* Step 3 Footer Actions */}
          <div className="flex items-center justify-between pt-5 border-t border-slate-200">
            <ShinyButton
              onClick={handleBack}
              variant="outline"
              size="sm"
              shape="rounded"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </ShinyButton>

            <ShinyButton
              onClick={handleFinalSubmit}
              disabled={!isStep3Valid}
              variant="brand"
              size="md"
              shape="rounded"
            >
              <Sparkles className="w-4 h-4" />
              <span>Initialize Graph Engine</span>
              <ArrowRight className="w-4 h-4" />
            </ShinyButton>
          </div>
        </div>
      )}
    </div>
  );
}
