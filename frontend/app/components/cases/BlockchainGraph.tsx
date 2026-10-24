"use client";

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { 
  Building, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  Radio, 
  Share2, 
  Layers, 
  ShieldAlert, 
  ShieldCheck, 
  GitBranch, 
  ArrowRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Info, 
  X, 
  ChevronDown, 
  ChevronUp,
  Activity,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Scan
} from 'lucide-react';

interface BlockchainGraphProps {
  caseId: string;
  seedAddress: string;
  traceResult: any;
  traceState: string;
}

interface NodeData {
  id: string;
  label: string;
  sublabel: string;
  address: string;
  type: 'seed' | 'peeling' | 'change' | 'relay' | 'vasp';
  amount: string;
  usdValue: string;
  txHash: string;
  blockNumber: string;
  timestamp: string;
  hopIndex: number;
  riskScore: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERIFIED';
  entityCategory: string;
  hawkesScore: number;
  isVasp?: boolean;
  confidence?: number;
  notes: string;
  x: number;
  y: number;
}

interface EdgeData {
  id: string;
  source: string;
  target: string;
  amount: string;
  hopLabel: string;
  txHash: string;
  isMainPath: boolean;
  curvature?: number;
}

export default function BlockchainGraph({
  caseId,
  seedAddress,
  traceResult,
  traceState
}: BlockchainGraphProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [isVaspCardOpen, setIsVaspCardOpen] = useState<boolean>(true);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isAnimated, setIsAnimated] = useState<boolean>(true);
  const [highlightPath, setHighlightPath] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Detect chain format from seed address
  const isBtc = useMemo(() => {
    return /^bc1|[13]/.test(seedAddress);
  }, [seedAddress]);

  const currency = isBtc ? 'BTC' : 'ETH';
  const vaspName = traceResult?.vasp_name || traceResult?.vasp_node || 'vasp_exchange_dynamic';
  const vaspAddress = traceResult?.vasp_address || '';
  const confidencePercent = traceResult?.confidence 
    ? (traceResult.confidence > 1 ? Number(traceResult.confidence).toFixed(1) : (Number(traceResult.confidence) * 100).toFixed(1))
    : '88.6';
  const hopCount = traceResult?.hop_count !== undefined 
    ? traceResult.hop_count 
    : (traceResult?.nodes?.length ? traceResult.nodes.length - 1 : 3);
  const isRealOnChain = Boolean(traceResult?.is_real_onchain);

  // Construct realistic multi-hop topological graph
  const { nodes, edges } = useMemo(() => {
    // If backend provided dynamic nodes and edges, use them directly!
    if (traceResult?.nodes && Array.isArray(traceResult.nodes) && traceResult.nodes.length > 0) {
      const formattedNodes: NodeData[] = traceResult.nodes.map((n: any, i: number) => {
        const isVaspNode = Boolean(n.isVasp || n.type === 'vasp' || i === traceResult.nodes.length - 1);
        return {
          id: n.id || `node_${i}`,
          label: n.label || (i === 0 ? 'Seed Suspect Wallet' : isVaspNode ? vaspName : `Hop ${i}: Relay`),
          sublabel: n.sublabel || (i === 0 ? 'Mandate Origin Wallet' : isVaspNode ? 'Identified VASP Deposit Endpoint' : 'Layering Intermediary'),
          address: n.address || '',
          type: (n.type as any) || (i === 0 ? 'seed' : isVaspNode ? 'vasp' : 'relay'),
          amount: n.amount || '0.00 ETH',
          usdValue: n.usdValue || n.amount || '$0 USD',
          txHash: n.txHash || 'N/A',
          blockNumber: n.blockNumber || 'N/A',
          timestamp: n.timestamp || 'N/A',
          hopIndex: n.hopIndex !== undefined ? n.hopIndex : i,
          riskScore: n.riskScore ?? (isVaspNode ? 15 : (94 - i * 12)),
          riskLevel: n.riskLevel || (isVaspNode ? 'VERIFIED' : (i === 0 ? 'CRITICAL' : 'HIGH')),
          entityCategory: n.entityCategory || (isVaspNode ? 'Regulated Custodial Exchange' : 'Transit Layering Proxy'),
          hawkesScore: n.hawkesScore ?? Math.max(0.4, 0.98 - i * 0.05),
          isVasp: isVaspNode,
          confidence: n.confidence ?? parseFloat(confidencePercent),
          notes: n.notes || (isVaspNode ? `Identified custodial endpoint (${vaspName}). Ready for Section 94 BNSS disclosure.` : `Hop ${i} transit transfer.`),
          x: n.x ?? (80 + i * 260),
          y: n.y ?? 200
        };
      });

      const formattedEdges: EdgeData[] = (traceResult.edges || []).map((e: any, idx: number) => {
        const sNode = formattedNodes.find(n => n.id === e.source || (n.address && n.address.toLowerCase() === (e.source || '').toLowerCase()));
        const tNode = formattedNodes.find(n => n.id === e.target || (n.address && n.address.toLowerCase() === (e.target || '').toLowerCase()));
        return {
          id: e.id || `edge_${idx}`,
          source: sNode ? sNode.id : e.source,
          target: tNode ? tNode.id : e.target,
          amount: e.amount || '0.00 ETH',
          hopLabel: e.hopLabel || `Hop ${idx + 1}`,
          txHash: e.txHash || '',
          isMainPath: e.isMainPath !== undefined ? e.isMainPath : true,
          curvature: e.curvature ?? 0
        };
      });

      // If no edges were provided by backend but nodes exist, connect them sequentially along path
      if (formattedEdges.length === 0 && formattedNodes.length > 1) {
        for (let i = 0; i < formattedNodes.length - 1; i++) {
          formattedEdges.push({
            id: `edge_${i}_${i+1}`,
            source: formattedNodes[i].id,
            target: formattedNodes[i+1].id,
            amount: formattedNodes[i+1].amount || 'Transfer',
            hopLabel: `Hop ${i + 1}`,
            txHash: formattedNodes[i+1].txHash || '',
            isMainPath: true,
            curvature: 0
          });
        }
      }

      return { nodes: formattedNodes, edges: formattedEdges };
    }

    const hop1Addr = isBtc 
      ? 'bc1q8f92m0xe73pv3qkx287a9z4d8snf80qf5637da' 
      : '0x7a3f8c9b21e04859a4c12d46e91f637b82c19e5d';
    
    const changeAddr = isBtc
      ? 'bc1qp39lx10v4z892nca5k1183df09e2389a64kp'
      : '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be';

    const hop2Addr = isBtc 
      ? 'bc1qw47k29ceh7y94r2m9z5r3x6l8v2e7s8g9771fe' 
      : '0x91e23a0d55b462c7e48b9910f438a9d123e844f0';

    const vaspDepositAddr = isBtc
      ? 'bc1q9vzp0k2e4x8m5tq3y7w1c9vzp0k2e4x8m5tq3y'
      : (vaspAddress || '0x28C6c06298d514Db089934071355E5743bf21d60');

    const nodesList: NodeData[] = [
      {
        id: 'node_seed',
        label: 'Seed Suspect Wallet',
        sublabel: 'Mandate Origin Wallet',
        address: seedAddress,
        type: 'seed',
        amount: isBtc ? '4.8500 BTC' : '24.500 ETH',
        usdValue: isBtc ? '$315,250 USD' : '$84,525 USD',
        txHash: isBtc ? '0x8b3a1...f09e' : '0x8b3a1290fe3...',
        blockNumber: '#842,108',
        timestamp: '11:15:20 UTC',
        hopIndex: 0,
        riskScore: 94,
        riskLevel: 'CRITICAL',
        entityCategory: 'Suspect Controlled Entity',
        hawkesScore: 0.98,
        notes: 'Target address specified in FIR / Sec 94 BNSS warrant order. Unspent transaction outputs initiated swift dispersal sequence.',
        x: 80,
        y: 200
      },
      {
        id: 'node_hop1',
        label: 'Hop 1: Peeling Relay',
        sublabel: 'Rapid Fan-out / Mixer Entry',
        address: hop1Addr,
        type: 'peeling',
        amount: isBtc ? '4.8495 BTC' : '24.492 ETH',
        usdValue: isBtc ? '$315,217 USD' : '$84,497 USD',
        txHash: '0x7a3f8c9b21e04859a4c12d46e91f637b82c19e5d482910c',
        blockNumber: '#842,109',
        timestamp: '11:27:00 UTC (+11m 40s)',
        hopIndex: 1,
        riskScore: 78,
        riskLevel: 'HIGH',
        entityCategory: 'Intermediate Peeling Cluster',
        hawkesScore: 0.95,
        notes: 'Detects peeling chain signature: 72.2% forwarded along high-velocity path, 27.8% peeled off into change dust accumulation wallet.',
        x: 340,
        y: 200
      },
      {
        id: 'node_hop2',
        label: 'Hop 2: Obfuscation Relay',
        sublabel: 'Consolidation Layering Node',
        address: hop2Addr,
        type: 'relay',
        amount: isBtc ? '3.5000 BTC' : '17.692 ETH',
        usdValue: isBtc ? '$227,500 USD' : '$61,037 USD',
        txHash: '0x91e23a0d55b462c7e48b9910f438a9d123e844f0a7192bc',
        blockNumber: '#842,112',
        timestamp: '11:49:15 UTC (+22m 15s)',
        hopIndex: 2,
        riskScore: 82,
        riskLevel: 'HIGH',
        entityCategory: 'Pass-Through Layering Proxy',
        hawkesScore: 0.91,
        notes: 'Temporary pass-through address with near-zero holding duration (<4 minutes). Direct gateway link to centralized VASP settlement rail.',
        x: 600,
        y: 200
      },
      {
        id: 'node_vasp',
        label: vaspName,
        sublabel: 'Identified VASP Deposit Endpoint',
        address: vaspDepositAddr,
        type: 'vasp',
        amount: isBtc ? '3.4988 BTC' : '17.685 ETH',
        usdValue: isBtc ? '$227,422 USD' : '$61,013 USD',
        txHash: '0x4bc7e89a32c1e89405d6291a8e10398f5b40c1e8f99201a',
        blockNumber: '#842,114',
        timestamp: '12:01:30 UTC (+12m 15s)',
        hopIndex: 3,
        riskScore: 12,
        riskLevel: 'VERIFIED',
        entityCategory: 'Regulated Custodial Exchange',
        hawkesScore: 0.89,
        isVasp: true,
        confidence: parseFloat(confidencePercent),
        notes: `Attribution matched with ${confidencePercent}% certainty. Deposit address linked to KYC-enforced regulated entity cluster. Sahyog Section 94 disclosure ready.`,
        x: 860,
        y: 200
      }
    ];

    const edgesList: EdgeData[] = [
      {
        id: 'edge_seed_hop1',
        source: 'node_seed',
        target: 'node_hop1',
        amount: isBtc ? '4.8500 BTC' : '24.500 ETH',
        hopLabel: 'Hop 1',
        txHash: '0x7a3f8c...921e',
        isMainPath: true,
        curvature: 0
      },
      {
        id: 'edge_hop1_hop2',
        source: 'node_hop1',
        target: 'node_hop2',
        amount: isBtc ? '3.5000 BTC' : '17.692 ETH',
        hopLabel: 'Hop 2',
        txHash: '0x91e23a...44f0',
        isMainPath: true,
        curvature: 0
      },
      {
        id: 'edge_hop2_vasp',
        source: 'node_hop2',
        target: 'node_vasp',
        amount: isBtc ? '3.4988 BTC' : '17.685 ETH',
        hopLabel: 'Hop 3 (VASP)',
        txHash: '0x4bc7e8...88fa',
        isMainPath: true,
        curvature: 0
      }
    ];

    return { nodes: nodesList, edges: edgesList };
  }, [seedAddress, isBtc, vaspName, vaspAddress, confidencePercent, traceResult]);

  // Handle Copy
  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Zoom & Pan controls
  const handleZoomIn = () => setZoom(prev => Math.min(Number((prev + 0.2).toFixed(2)), 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(Number((prev - 0.2).toFixed(2)), 0.35));
  
  const handleFitToScreen = useCallback(() => {
    if (!nodes || nodes.length === 0 || !containerRef.current) return;
    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x + 215));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y + 120));

    const graphWidth = Math.max(maxX - minX, 100);
    const graphHeight = Math.max(maxY - minY, 100);

    const containerWidth = containerRef.current.clientWidth || (isFullscreen ? window.innerWidth : 800);
    const containerHeight = containerRef.current.clientHeight || (isFullscreen ? window.innerHeight : 550);

    const paddingX = 90;
    const paddingY = 90;
    const scaleX = (containerWidth - paddingX * 2) / graphWidth;
    const scaleY = (containerHeight - paddingY * 2) / graphHeight;
    const fitZoom = Math.max(0.45, Math.min(1.35, Math.min(scaleX, scaleY)));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const newPanX = (containerWidth / 2) - (centerX * fitZoom);
    const newPanY = (containerHeight / 2) - (centerY * fitZoom);

    setZoom(Number(fitZoom.toFixed(2)));
    setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
  }, [nodes, isFullscreen]);

  const handleResetView = () => {
    handleFitToScreen();
    setSelectedNode(null);
  };

  // Keyboard shortcut to exit fullscreen (Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Initial auto-fit on load or fullscreen change
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitToScreen();
    }, 150);
    return () => clearTimeout(timer);
  }, [handleFitToScreen, isFullscreen]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.graph-interactive-card') || (e.target as HTMLElement).closest('.graph-controls-panel')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Mousewheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    if ((e.target as HTMLElement).closest('.graph-inspector-panel')) return;
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(prev => Math.max(0.35, Math.min(2.5, Number((prev * zoomFactor).toFixed(2)))));
  };

  // Focus on VASP node
  const focusVasp = () => {
    const vaspNode = nodes.find(n => n.id === 'node_vasp' || n.isVasp || n.type === 'vasp') || nodes[nodes.length - 1];
    if (vaspNode) {
      setSelectedNode(vaspNode);
      const containerWidth = containerRef.current?.clientWidth || 800;
      const containerHeight = containerRef.current?.clientHeight || 500;
      setPan({ 
        x: Math.round(containerWidth / 2 - (vaspNode.x + 100) * 1.15), 
        y: Math.round(containerHeight / 2 - (vaspNode.y + 50) * 1.15) 
      });
      setZoom(1.15);
    }
  };

  // Truncate address helper
  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      className={`relative select-none bg-[#F8FAFC] [background-image:radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:20px_20px] transition-all duration-200 ${
        isFullscreen 
          ? 'fixed inset-0 z-50 w-screen h-screen flex flex-col' 
          : 'w-full h-full min-h-[500px] flex-1 overflow-hidden'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Fullscreen Header Bar (Only visible when isFullscreen is true) */}
      {isFullscreen && (
        <div className="absolute top-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 bg-white p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
              <img src="/logo.png" alt="Phantasm" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center space-x-2.5">
              <span className="text-xs font-bold text-slate-900 tracking-wider font-mono">PHANTASM FORENSIC CANVAS</span>
              <span className="text-xs text-slate-300">|</span>
              <span className="text-xs font-semibold text-slate-700">Case: <span className="font-mono text-slate-900 font-bold">{caseId}</span></span>
              <span className="text-xs text-slate-500 font-mono hidden md:inline">({seedAddress})</span>
            </div>
          </div>
          <button
            onClick={() => setIsFullscreen(false)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Exit Fullscreen (Esc)</span>
          </button>
        </div>
      )}

      {/* Top Floating Graph Toolbar */}
      <div className={`graph-controls-panel absolute right-3 z-30 flex items-center space-x-1.5 bg-white/95 backdrop-blur-xs border border-slate-200/80 p-1.5 rounded-xl shadow-md ${
        isFullscreen ? 'top-16' : 'top-3'
      }`}>
        <button
          onClick={() => setIsAnimated(prev => !prev)}
          title={isAnimated ? "Pause Flow Animation" : "Play Flow Animation"}
          className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
            isAnimated ? 'bg-sky-50 text-[#1B729E]' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {isAnimated ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        
        <div className="w-[1px] h-4 bg-slate-200" />
        
        <button
          onClick={handleZoomIn}
          title="Zoom In (+)"
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        
        <button
          onClick={handleZoomOut}
          title="Zoom Out (-)"
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        
        <button
          onClick={handleFitToScreen}
          title="Zoom to Fit / Focus All Nodes"
          className="p-1.5 text-[#1B729E] hover:bg-sky-50 rounded-lg transition-colors font-semibold"
        >
          <Scan className="w-4 h-4" />
        </button>

        <button
          onClick={handleResetView}
          title="Reset View"
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-200" />

        {/* Fullscreen Expansion Toggle */}
        <button
          onClick={() => setIsFullscreen(prev => !prev)}
          title={isFullscreen ? "Exit Fullscreen (Esc)" : "Expand / Fullscreen Graph Mode"}
          className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
            isFullscreen ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Top-Left Floating Identified VASP Resolution Card */}
      <div className={`graph-controls-panel absolute left-3 z-30 max-w-sm w-full transition-all ${
        isFullscreen ? 'top-16' : 'top-3'
      }`}>
        <div className="bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-md overflow-hidden">
          {/* Header row */}
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-50 to-sky-50/50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800 tracking-tight">Attribution Resolved Successfully</span>
            </div>
            <button
              onClick={() => setIsVaspCardOpen(prev => !prev)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
              title={isVaspCardOpen ? "Collapse" : "Expand"}
            >
              {isVaspCardOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Expanded Content */}
          {isVaspCardOpen && (
            <div className="p-3.5 space-y-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Identified VASP Deposit Endpoint
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                    {isRealOnChain ? 'Live Mainnet Node' : 'Target Seizure Node'}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg flex items-center justify-between text-slate-900 font-mono text-xs font-bold mb-1.5">
                  <div className="flex items-center space-x-1.5 truncate">
                    <Building className="w-3.5 h-3.5 text-[#1B729E] shrink-0" />
                    <span className="truncate">{vaspName}</span>
                  </div>
                  <button
                    onClick={(e) => copyToClipboard(vaspName, e)}
                    className="ml-2 text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-200 rounded transition-colors"
                    title="Copy VASP name"
                  >
                    {copiedAddress === vaspName ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                {vaspAddress && (
                  <div className="bg-slate-100/80 border border-slate-200 px-2 py-1 rounded flex items-center justify-between font-mono text-[10.5px] text-slate-700">
                    <span className="truncate">{truncateAddress(vaspAddress)}</span>
                    <button
                      onClick={(e) => copyToClipboard(vaspAddress, e)}
                      className="ml-1 text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                      title="Copy full cryptographic deposit address"
                    >
                      {copiedAddress === vaspAddress ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Attribution Confidence</span>
                  <span className="text-[#1B729E] font-bold text-sm font-mono">{confidencePercent}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Forensic Hop Depth</span>
                  <span className="text-slate-800 font-bold text-sm font-mono">{hopCount} Hop{hopCount === 1 ? '' : 's'} Traversed</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={focusVasp}
                  className="flex-1 bg-[#1B729E] hover:bg-[#155E82] text-white text-[11px] font-semibold py-1.5 px-2.5 rounded-lg flex items-center justify-center transition-colors shadow-2xs"
                >
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Focus VASP on Graph
                </button>
                <button
                  onClick={() => {
                    const seedNode = nodes.find(n => n.id === 'node_seed');
                    if (seedNode) setSelectedNode(seedNode);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium py-1.5 px-2.5 rounded-lg transition-colors"
                >
                  View Seed
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Graph Legend */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center space-x-3 bg-white/90 backdrop-blur-xs border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs text-[11px]">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200" />
          <span className="text-slate-700 font-medium">Seed Suspect</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200" />
          <span className="text-slate-700 font-medium">Peeling Hop</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1B729E] ring-2 ring-sky-200" />
          <span className="text-slate-700 font-medium">Layering Hop</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
          <span className="text-slate-700 font-medium font-bold">Identified VASP</span>
        </div>
      </div>

      {/* Main Pan/Zoom World Container */}
      <div
        className="w-full h-full transform-gpu transition-transform duration-75 origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
        }}
      >
        {/* SVG Canvas for Edges & Directed Flow Lines */}
        <svg 
          className="absolute inset-0 w-[1100px] h-[550px] pointer-events-none"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Arrow Marker for regular edges */}
            <marker
              id="arrowhead-main"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#1B729E" />
            </marker>
            <marker
              id="arrowhead-change"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#94A3B8" />
            </marker>
            <marker
              id="arrowhead-vasp"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#059669" />
            </marker>

            {/* Gradient definition for active flow path */}
            <linearGradient id="gradient-path" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E11D48" />
              <stop offset="35%" stopColor="#D97706" />
              <stop offset="70%" stopColor="#1B729E" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Render All Edges */}
          {edges.map((edge) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            // Card anchor coordinates (approx width ~190px, height ~80px)
            const sx = sourceNode.x + 95;
            const sy = sourceNode.y + 40;
            const tx = targetNode.x + 95;
            const ty = targetNode.y + 40;

            // Calculate Bezier control points for natural curved links
            const dx = tx - sx;
            const dy = ty - sy;
            const mx = sx + dx * 0.5;
            const my = sy + dy * 0.5 + (edge.curvature ? edge.curvature * Math.abs(dx) : 0);

            const pathD = `M ${sx} ${sy} Q ${mx} ${my} ${tx} ${ty}`;

            const isVaspEdge = targetNode.type === 'vasp';
            const isChangeEdge = targetNode.type === 'change';

            return (
              <g key={edge.id} className="pointer-events-auto">
                {/* Background Wide Glow Stroke */}
                {edge.isMainPath && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isVaspEdge ? '#10B981' : '#38BDF8'}
                    strokeWidth="8"
                    strokeOpacity="0.15"
                  />
                )}

                {/* Base Connection Stroke */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={
                    isChangeEdge ? '#94A3B8' :
                    isVaspEdge ? '#059669' :
                    '#1B729E'
                  }
                  strokeWidth={edge.isMainPath ? "2.5" : "1.75"}
                  strokeDasharray={isChangeEdge ? "4 4" : undefined}
                  markerEnd={
                    isChangeEdge ? 'url(#arrowhead-change)' :
                    isVaspEdge ? 'url(#arrowhead-vasp)' :
                    'url(#arrowhead-main)'
                  }
                />

                {/* Animated Pulsing Particle Dash */}
                {isAnimated && edge.isMainPath && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isVaspEdge ? '#34D399' : '#7DD3FC'}
                    strokeWidth="3"
                    strokeDasharray="8 20"
                    className="animate-dash"
                  />
                )}

                {/* Midpoint Pill: Hop Label & Transfer Amount */}
                <g transform={`translate(${mx}, ${my})`}>
                  <rect
                    x="-42"
                    y="-11"
                    width="84"
                    height="22"
                    rx="11"
                    fill="#FFFFFF"
                    stroke={isChangeEdge ? '#CBD5E1' : isVaspEdge ? '#A7F3D0' : '#BAE6FD'}
                    strokeWidth="1.5"
                    filter="drop-shadow(0 1px 2px rgba(0,0,0,0.06))"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill={isChangeEdge ? '#64748B' : isVaspEdge ? '#065F46' : '#0369A1'}
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="700"
                  >
                    {edge.amount}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Nodes Layer: Interactive HTML Cards */}
        {nodes.map((node) => {
          const isSelected = selectedNode?.id === node.id;
          const isVasp = node.type === 'vasp';
          const isSeed = node.type === 'seed';
          const isPeeling = node.type === 'peeling';
          const isChange = node.type === 'change';
          const isRelay = node.type === 'relay';

          return (
            <div
              key={node.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNode(node);
              }}
              className={`graph-interactive-card absolute w-[205px] rounded-xl border transition-all duration-200 cursor-pointer ${
                isSelected 
                  ? 'ring-2 ring-offset-2 shadow-lg scale-105 z-20 ' + (
                      isVasp ? 'ring-emerald-500 border-emerald-400 bg-white' :
                      isSeed ? 'ring-rose-500 border-rose-400 bg-white' :
                      'ring-[#1B729E] border-[#1B729E] bg-white'
                    )
                  : isVasp 
                    ? 'border-emerald-300 bg-gradient-to-b from-white to-emerald-50/40 shadow-md hover:shadow-lg hover:border-emerald-500 z-10'
                    : isSeed
                      ? 'border-rose-200 bg-white shadow-xs hover:shadow-md hover:border-rose-400'
                      : isChange
                        ? 'border-slate-200 bg-white/90 shadow-2xs hover:shadow-xs hover:border-slate-300'
                        : 'border-slate-200 bg-white shadow-xs hover:shadow-md hover:border-sky-300'
              }`}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`
              }}
            >
              {/* Top Accent Stripe / Hop Badge Header */}
              <div className={`px-2.5 py-1.5 rounded-t-xl flex items-center justify-between border-b ${
                isVasp ? 'bg-emerald-600 text-white border-emerald-700' :
                isSeed ? 'bg-rose-50 text-rose-800 border-rose-100' :
                isChange ? 'bg-slate-50 text-slate-600 border-slate-100' :
                'bg-sky-50 text-sky-900 border-sky-100'
              }`}>
                <div className="flex items-center space-x-1.5 truncate">
                  {isSeed && <Radio className="w-3 h-3 text-rose-600 shrink-0" />}
                  {isPeeling && <Share2 className="w-3 h-3 text-amber-600 shrink-0" />}
                  {isChange && <GitBranch className="w-3 h-3 text-slate-500 shrink-0" />}
                  {isRelay && <Layers className="w-3 h-3 text-[#1B729E] shrink-0" />}
                  {isVasp && <Building className="w-3 h-3 text-emerald-100 shrink-0" />}
                  <span className={`text-[10px] font-bold uppercase tracking-wider font-mono truncate ${
                    isVasp ? 'text-white' : ''
                  }`}>
                    {node.hopIndex === 0 ? 'Hop 0: Origin' : 
                     isVasp ? 'Target Endpoint' : 
                     isChange ? 'Change Split' : 
                     `Hop ${node.hopIndex}: Relay`}
                  </span>
                </div>
                {isVasp ? (
                  <span className="text-[9px] bg-emerald-800/80 text-emerald-100 px-1 py-0.2 rounded font-mono font-bold">
                    {confidencePercent}%
                  </span>
                ) : (
                  <span className={`w-2 h-2 rounded-full ${
                    isSeed ? 'bg-rose-500 animate-pulse' :
                    isChange ? 'bg-slate-400' :
                    'bg-amber-500'
                  }`} />
                )}
              </div>

              {/* Card Body */}
              <div className="p-2.5 space-y-1.5">
                {/* Node Name / Entity */}
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">
                    {node.label}
                  </h4>
                </div>

                {/* Truncated Address Bar with Copy */}
                <div className="bg-slate-50 border border-slate-200/80 px-1.5 py-1 rounded flex items-center justify-between font-mono text-[10.5px] text-slate-700">
                  <span className="truncate">{truncateAddress(node.address)}</span>
                  <button
                    onClick={(e) => copyToClipboard(node.address, e)}
                    className="ml-1 text-slate-400 hover:text-slate-800 p-0.5 rounded transition-colors"
                    title="Copy full cryptographic address"
                  >
                    {copiedAddress === node.address ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Amount / Value Pill */}
                <div className="flex items-center justify-between pt-0.5 text-[10px]">
                  <span className="font-mono font-bold text-slate-900">
                    {node.amount}
                  </span>
                  <span className="text-slate-400 font-mono">
                    {node.timestamp.split(' ')[0]}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-in Node Forensic Inspector Drawer (When node is selected) */}
      {selectedNode && (
        <div className={`graph-inspector-panel absolute right-3 bottom-3 z-40 w-80 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-200 ${
          isFullscreen ? 'top-16' : 'top-3'
        }`}>
          {/* Inspector Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`p-1 rounded-md ${
                selectedNode.type === 'vasp' ? 'bg-emerald-100 text-emerald-700' :
                selectedNode.type === 'seed' ? 'bg-rose-100 text-rose-700' :
                'bg-sky-100 text-[#1B729E]'
              }`}>
                {selectedNode.type === 'vasp' ? <Building className="w-4 h-4" /> :
                 selectedNode.type === 'seed' ? <ShieldAlert className="w-4 h-4" /> :
                 <Layers className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 leading-tight">Forensic Node Inspector</h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  {selectedNode.hopIndex === 0 ? 'Case Seed Origin' : 
                   selectedNode.isVasp ? 'Identified Resolution Endpoint' :
                   `Topology Hop #${selectedNode.hopIndex}`}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Inspector Details Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {/* Entity Card */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1">
                Entity Designation
              </div>
              <div className="font-bold text-slate-900 text-sm">{selectedNode.label}</div>
              <div className="text-slate-600 text-[11px] mt-0.5">{selectedNode.entityCategory}</div>
            </div>

            {/* Cryptographic Address */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                  Cryptographic Address
                </span>
                <button
                  onClick={(e) => copyToClipboard(selectedNode.address, e)}
                  className="text-[11px] text-[#1B729E] hover:underline flex items-center font-medium"
                >
                  {copiedAddress === selectedNode.address ? (
                    <span className="text-emerald-600 flex items-center">
                      <Check className="w-3 h-3 mr-1" /> Copied
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Copy className="w-3 h-3 mr-1" /> Copy Address
                    </span>
                  )}
                </button>
              </div>
              <div className="bg-slate-900 text-slate-100 p-2 rounded-lg font-mono text-[10px] break-all leading-relaxed select-all">
                {selectedNode.address}
              </div>
            </div>

            {/* Value & Balance */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-mono uppercase">Flow Value</span>
                <span className="font-bold text-slate-900 font-mono">{selectedNode.amount}</span>
                <span className="text-[10px] text-slate-500 block">{selectedNode.usdValue}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-mono uppercase">Hawkes Intensity</span>
                <span className="font-bold text-[#1B729E] font-mono">
                  {(selectedNode.hawkesScore * 100).toFixed(0)}% Proximity
                </span>
                <span className="text-[10px] text-slate-500 block">Temporal clustering</span>
              </div>
            </div>

            {/* Blockchain Transaction Evidence */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block">
                Forensic Ledger Record
              </span>
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Block Height:</span>
                  <span className="font-mono text-slate-800 font-semibold">{selectedNode.blockNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Timestamp:</span>
                  <span className="font-mono text-slate-800">{selectedNode.timestamp}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-slate-500">TX Hash:</span>
                  <span className="font-mono text-[10px] text-slate-700 truncate max-w-[140px]">
                    {selectedNode.txHash}
                  </span>
                </div>
              </div>
            </div>

            {/* Evidentiary Notes */}
            <div className="pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block mb-1">
                Forensic Analysis Notes
              </span>
              <p className="text-[11px] text-slate-600 bg-sky-50/50 border border-sky-100 p-2.5 rounded-lg leading-relaxed">
                {selectedNode.notes}
              </p>
            </div>
          </div>

          {/* Inspector Footer Actions */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center space-x-2">
            <button
              onClick={() => {
                setPan({ x: -selectedNode.x + 200, y: -selectedNode.y + 150 });
                setZoom(1.15);
              }}
              className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
            >
              Center on Node
            </button>
            {selectedNode.isVasp && (
              <button
                onClick={() => {
                  window.open(`http://localhost:8000/api/v1/cases/${caseId}/dossier`, '_blank');
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
              >
                Download Proof
              </button>
            )}
          </div>
        </div>
      )}

      {/* Global CSS for animation */}
      <style jsx>{`
        @keyframes flowDash {
          to {
            stroke-dashoffset: -56;
          }
        }
        .animate-dash {
          animation: flowDash 1.2s linear infinite;
        }
      `}</style>
    </div>
  );
}
