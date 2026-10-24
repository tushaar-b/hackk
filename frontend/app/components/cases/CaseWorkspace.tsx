"use client";

import React, { useState, useEffect } from 'react';
import { 
  Network, 
  FileText, 
  CheckCircle2, 
  Activity, 
  Play, 
  Cpu, 
  Share2, 
  Lock,
  Download,
  ShieldCheck,
  Building,
  Radio,
  ExternalLink,
  Compass,
  ArrowLeft,
  Edit3
} from 'lucide-react';
import BlockchainGraph from './BlockchainGraph';
import { ShinyButton } from '@/components/ui/shiny-button';

export default function CaseWorkspace({ 
  caseId, 
  seedAddress,
  onBackToSeed
}: { 
  caseId: string; 
  seedAddress: string;
  onBackToSeed?: () => void;
}) {
  const [traceState, setTraceState] = useState('IDLE');
  const [traceResult, setTraceResult] = useState<any>(null);
  const [caseData, setCaseData] = useState<any>(null);
  const [logs, setLogs] = useState<{ time: string; message: string; type: 'info' | 'success' | 'warning' }[]>([]);

  // Rotating status phrases for the animated loader
  const statusPhrases = [
    "Establishing chain of custody...",
    "Cross-referencing ledger entries...",
    "Resolving sub-graphs across hops...",
    "Validating provenance..."
  ];
  const [phraseIndex, setPhraseIndex] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const detectChain = (address: string) => {
    if (/^0x[a-fA-F0-9]{40}$/.test(address)) return 'Ethereum (ERC-20)';
    if (/^(1|3)[a-zA-HJ-NP-Z0-9]{25,39}$/.test(address) || /^(bc1)[a-zA-HJ-NP-Z0-9]{25,39}$/.test(address)) return 'Bitcoin (UTXO)';
    if (/^T[A-Za-z1-9]{33}$/.test(address)) return 'TRON (TRC-20)';
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return 'Solana (SPL)';
    return 'Multi-Chain';
  };

  useEffect(() => {
    const fetchCase = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/cases/${caseId}`);
        if (res.ok) {
          const data = await res.json();
          setCaseData(data);
          addLog(`Case ${caseId} initialized with ${data.authority} mandate.`, 'info');
          addLog(`Seed address validated (${detectChain(data.seed_address)}).`, 'info');
        }
      } catch (err) {
        console.error("Failed to fetch case", err);
      }
    };
    fetchCase();
  }, [caseId]);

  // Rotate loader status phrase every 2.2 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % statusPhrases.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { time, message, type }]);
  };

  const startTrace = async () => {
    setTraceState('INGESTING');
    addLog(`Starting ingestion for seed ${seedAddress}...`, 'info');
    
    try {
      const res = await fetch(`${API_URL}/api/v1/traces/`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseId, seed_address: seedAddress })
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      const traceId = data.trace_id;
      
      pollTrace(traceId);
    } catch (err) {
      console.error("Trace failed to start", err);
      setTraceState('IDLE');
      addLog("Failed to connect to ingestion engine.", 'warning');
    }
  };

  const pollTrace = async (traceId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/traces/${traceId}`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.status !== traceState && data.status !== 'PENDING') {
          setTraceState(data.status);
          addLog(`Pipeline phase updated: ${data.status}`, 'info');
        }
        
        if (data.status === 'COMPLETED') {
          clearInterval(interval);
          setTraceResult(data);
          addLog("Trace completed successfully. Graph resolution finalized.", 'success');
        } else if (data.status === 'FAILED') {
          clearInterval(interval);
          setTraceState('IDLE');
          addLog("Pipeline execution failed.", 'warning');
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col space-y-5">
      
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center shadow-2xs gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1.5 flex-wrap gap-y-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Case: {caseId}</h1>
            <span className="bg-sky-50 text-[#1B729E] border border-sky-200/80 px-2.5 py-0.5 rounded-md text-xs font-semibold font-mono tracking-wider">
              ACTIVE
            </span>
            {onBackToSeed && (
              <button
                onClick={onBackToSeed}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg border border-slate-300 bg-slate-50 hover:bg-white text-slate-700 hover:text-[#1B729E] hover:border-[#1B729E] text-xs font-semibold shadow-2xs transition-all cursor-pointer group"
                title="Go back to Step 3: Target Seed Address"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#1B729E] transition-colors" />
                <span>Go Back to Target Seed Wallet</span>
              </button>
            )}
          </div>
          <p className="text-slate-600 text-xs flex items-center">
            <FileText className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            Authority Mandate: <span className="ml-1 text-slate-800 font-medium">
              {caseData ? caseData.authority : "Sec 94 BNSS (FIR-Verified)"}
            </span>
          </p>
        </div>
        
        <div className="flex flex-col md:items-end">
          <div className="flex items-center text-xs font-semibold text-emerald-700 mb-1">
            <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
            Lawful Status Verified
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-xs text-slate-600 font-mono bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              Seed: <span className="text-slate-900 font-semibold">{seedAddress}</span>
            </div>
            {onBackToSeed && (
              <button
                onClick={onBackToSeed}
                className="text-slate-500 hover:text-[#1B729E] bg-slate-50 hover:bg-sky-50 p-1 rounded-md border border-slate-200 transition-colors"
                title="Change or Edit Seed Wallet"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Graph & Sidebar Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Graph Preview Canvas */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-2xs relative overflow-hidden flex flex-col min-h-[540px] lg:min-h-[580px]">
          
          {/* Canvas Window Header */}
          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-5 h-5 rounded overflow-hidden flex items-center justify-center shrink-0">
                <img src="/logo.png" alt="Phantasm" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Graph Resolution Engine</h2>
              {traceState === 'COMPLETED' && (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  {traceResult?.hop_count !== undefined ? `${traceResult.hop_count}-HOP` : '3-HOP'} ATTR PATH ACTIVE
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {traceState === 'COMPLETED' && (
                <span className="text-[11px] font-mono text-slate-500 font-medium hidden sm:inline">
                  Destination: <span className="text-slate-800 font-bold">{traceResult?.vasp_name || traceResult?.vasp_node || 'vasp_exchange_dynamic'}</span>
                </span>
              )}
              <div className="flex items-center space-x-1.5 pl-2">
                <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                <span className="w-2 h-2 rounded-full bg-slate-300"></span>
              </div>
            </div>
          </div>
          
          {/* Canvas Body */}
          <div className="flex-1 flex flex-col relative overflow-hidden bg-[#F8FAFC]">
            {traceState === 'COMPLETED' ? (
              <BlockchainGraph 
                caseId={caseId} 
                seedAddress={seedAddress} 
                traceResult={traceResult} 
                traceState={traceState} 
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 [background-image:radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:20px_20px]">
                <div className="relative z-20 bg-white/95 backdrop-blur-sm border-2 border-[#1B4B5A]/30 rounded-2xl p-6 sm:p-8 max-w-md text-center shadow-xl my-auto">
                  <div className="space-y-5">
                    {/* Glowing Phantasm Wolf Emblem Ingestion Header */}
                    <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 rounded-2xl bg-sky-400/20 animate-ping opacity-30" />
                      <div className="relative w-24 h-24 rounded-2xl bg-white border-2 border-sky-200/80 shadow-md p-1.5 flex items-center justify-center overflow-hidden">
                        <img 
                          src="/logo.png" 
                          alt="Phantasm Wolf" 
                          className="w-full h-full object-contain filter drop-shadow-sm" 
                        />
                      </div>
                    </div>

                    <div>
                      {/* Cycling Investigative Phrase */}
                      <div className="h-7 overflow-hidden relative">
                        <p 
                          key={phraseIndex} 
                          className="font-serif text-base font-bold text-[#1B4B5A] tracking-wide transition-all duration-500 animate-pulse"
                        >
                          {statusPhrases[phraseIndex]}
                        </p>
                      </div>
                      <p className="text-xs text-[#4A5A62] font-mono mt-1">
                        {['INGESTING', 'CLASSIFYING', 'ATTRIBUTING', 'SEALING', 'PENDING'].includes(traceState) ? `PIPELINE PHASE: ${traceState}` : 'Awaiting manual ingestion trigger or auto-analysis...'}
                      </p>
                    </div>

                    {/* Thin Animated Teal Progress Bar */}
                    <div className="w-full bg-[#EAE6DF] h-1.5 rounded-full overflow-hidden border border-[#C7D3D6]">
                      <div className={`h-full bg-[#1B4B5A] rounded-full transition-all duration-700 ${['INGESTING', 'CLASSIFYING', 'ATTRIBUTING', 'SEALING', 'PENDING'].includes(traceState) ? 'w-3/4 animate-pulse' : 'w-1/3'}`}></div>
                    </div>

                    {/* CTA Button to start ingestion */}
                    {traceState === 'IDLE' && (
                      <ShinyButton
                        onClick={startTrace}
                        variant="primary"
                        size="md"
                        shape="rounded"
                        fullWidth
                        className="shadow-lg shadow-sky-950/40"
                      >
                        <Play className="w-3.5 h-3.5 text-sky-400 fill-current" />
                        <span>START INK-TRACE INGESTION</span>
                      </ShinyButton>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Guided NEXT STEP & Activity Log Side Column */}
        <div className="flex flex-col space-y-5">
          
          {/* Action Step Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-[#1B729E] uppercase tracking-wider font-mono">NEXT ACTION</span>
              <span className="text-[10px] text-slate-400 font-mono">PHASE 04</span>
            </div>
            
            {traceState === 'IDLE' ? (
              <>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Execute Ingestion Pipeline</h4>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Fetch live on-chain UTXO / account transaction ledger data and expand the multigraph entity tree.
                </p>
                <ShinyButton 
                  onClick={startTrace}
                  variant="brand"
                  size="md"
                  shape="rounded"
                  fullWidth
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>START INGESTION</span>
                </ShinyButton>
              </>
            ) : traceState === 'COMPLETED' ? (
              <>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Generate Legal Dossier</h4>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  The evidence has been sealed with cryptographic Merkle proof bundles. Download the court-ready forensic PDF.
                </p>
                <ShinyButton 
                  onClick={() => {
                    if (traceResult?.dossier_url) {
                      window.open(traceResult.dossier_url, '_blank');
                    } else {
                      window.open(`${API_URL}/api/v1/dossiers/generate/${caseId}`, '_blank');
                    }
                  }}
                  variant="emerald"
                  size="md"
                  shape="rounded"
                  fullWidth
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>DOWNLOAD FORENSIC DOSSIER (PDF)</span>
                </ShinyButton>
              </>
            ) : (
              <div className="space-y-2">
                <div className={`flex items-center text-xs p-2 rounded-lg font-medium ${['INGESTING', 'PENDING'].includes(traceState) ? 'bg-sky-50 text-[#1B729E] border border-sky-200' : 'text-slate-400'}`}>
                  <Network className="w-3.5 h-3.5 mr-2" /> Ingesting Ledger Transactions
                </div>
                <div className={`flex items-center text-xs p-2 rounded-lg font-medium ${traceState === 'CLASSIFYING' ? 'bg-sky-50 text-[#1B729E] border border-sky-200' : 'text-slate-400'}`}>
                  <Cpu className="w-3.5 h-3.5 mr-2" /> Classifying Cluster Nodes
                </div>
                <div className={`flex items-center text-xs p-2 rounded-lg font-medium ${traceState === 'ATTRIBUTING' ? 'bg-sky-50 text-[#1B729E] border border-sky-200' : 'text-slate-400'}`}>
                  <Share2 className="w-3.5 h-3.5 mr-2" /> Attributing Entity Paths
                </div>
                <div className={`flex items-center text-xs p-2 rounded-lg font-medium ${traceState === 'SEALING' ? 'bg-sky-50 text-[#1B729E] border border-sky-200' : 'text-slate-400'}`}>
                  <Lock className="w-3.5 h-3.5 mr-2" /> Cryptographic Merkle Sealing
                </div>
              </div>
            )}
          </div>
          
          {/* Activity Log */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex-1 shadow-2xs flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Activity Log</h3>
              <span className="text-[10px] text-slate-400 font-mono">LIVE EVENTS</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 flex-1">
              {logs.map((log, i) => (
                <div key={i} className={`text-xs pl-2.5 py-1.5 rounded-r-md border-l-2 ${
                  log.type === 'success' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900' : 
                  log.type === 'warning' ? 'border-amber-500 bg-amber-50/50 text-amber-900' : 
                  'border-[#1B729E] bg-sky-50/40 text-slate-800'
                }`}>
                  <div className="text-[10px] font-mono text-slate-400 mb-0.5">{log.time}</div>
                  <div className="font-medium leading-relaxed">{log.message}</div>
                </div>
              ))}
              {logs.length === 0 && (
                <p className="text-xs text-slate-400 italic py-2">No activity recorded yet...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
