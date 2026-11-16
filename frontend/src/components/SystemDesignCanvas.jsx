import React, { useState } from 'react'
import {
  X,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  Zap,
  Layers,
  ArrowRight,
  Database,
  Server,
  Cpu,
  Globe,
  Radio,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Maximize2,
} from 'lucide-react'

// Standard System Architecture Templates
const TEMPLATES = {
  three_tier: {
    name: '3-Tier Web Application',
    description: 'Client -> Load Balancer -> App Cluster -> Database',
    nodes: [
      { id: 'n1', type: 'client', label: 'Client App (React)', x: 60, y: 140 },
      { id: 'n2', type: 'lb', label: 'Load Balancer (Nginx)', x: 260, y: 140 },
      { id: 'n3', type: 'service', label: 'Backend API (FastAPI)', x: 460, y: 140 },
      { id: 'n4', type: 'db', label: 'Primary DB (PostgreSQL)', x: 680, y: 140 },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4' },
    ],
  },
  high_concurrency: {
    name: 'High-Throughput Cache Pipeline',
    description: 'API Gateway + Redis Cache + Read Replicas for 50k QPS',
    nodes: [
      { id: 'n1', type: 'client', label: 'Client / Mobile App', x: 60, y: 150 },
      { id: 'n2', type: 'gateway', label: 'API Gateway (Envoy)', x: 260, y: 150 },
      { id: 'n3', type: 'service', label: 'Microservice Cluster', x: 460, y: 150 },
      { id: 'n4', type: 'cache', label: 'Redis Cluster (LRU)', x: 460, y: 40 },
      { id: 'n5', type: 'db', label: 'Primary DB (PostgreSQL)', x: 680, y: 90 },
      { id: 'n6', type: 'replica', label: 'Read Replica (x3)', x: 680, y: 220 },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4' },
      { from: 'n3', to: 'n5' },
      { from: 'n3', to: 'n6' },
    ],
  },
  event_driven: {
    name: 'Event-Driven Microservices',
    description: 'Decoupled async publishing via Kafka Event Bus',
    nodes: [
      { id: 'n1', type: 'client', label: 'Order Client', x: 60, y: 140 },
      { id: 'n2', type: 'service', label: 'Order Ingestion API', x: 260, y: 140 },
      { id: 'n3', type: 'queue', label: 'Kafka Message Bus', x: 470, y: 140 },
      { id: 'n4', type: 'service', label: 'Payment Worker', x: 680, y: 70 },
      { id: 'n5', type: 'service', label: 'Inventory Worker', x: 680, y: 210 },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4' },
      { from: 'n3', to: 'n5' },
    ],
  },
}

const COMPONENT_PALETTE = [
  { type: 'client', label: 'Client / Web App', icon: Globe, color: 'border-blue-400 bg-blue-50/90 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' },
  { type: 'gateway', label: 'API Gateway', icon: Server, color: 'border-indigo-400 bg-indigo-50/90 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300' },
  { type: 'lb', label: 'Load Balancer', icon: Cpu, color: 'border-purple-400 bg-purple-50/90 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300' },
  { type: 'service', label: 'Backend Microservice', icon: Server, color: 'border-emerald-400 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' },
  { type: 'cache', label: 'Redis Cache', icon: Zap, color: 'border-amber-400 bg-amber-50/90 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' },
  { type: 'db', label: 'Primary DB (PostgreSQL)', icon: Database, color: 'border-cyan-400 bg-cyan-50/90 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300' },
  { type: 'replica', label: 'Read Replica', icon: Database, color: 'border-teal-400 bg-teal-50/90 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300' },
  { type: 'queue', label: 'Message Queue (Kafka)', icon: Radio, color: 'border-rose-400 bg-rose-50/90 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300' },
]

export default function SystemDesignCanvas({
  isOpen,
  onClose,
  onAttachToAnswer,
  targetQuestionText = '',
}) {
  const [nodes, setNodes] = useState(TEMPLATES.three_tier.nodes)
  const [edges, setEdges] = useState(TEMPLATES.three_tier.edges)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [edgeStartId, setEdgeStartId] = useState(null)
  const [draggingNodeId, setDraggingNodeId] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  if (!isOpen) return null

  const handleApplyTemplate = (key) => {
    const t = TEMPLATES[key]
    if (!t) return
    setNodes(t.nodes)
    setEdges(t.edges)
    setSelectedNodeId(null)
    setEdgeStartId(null)
  }

  const handleAddNode = (item) => {
    const newId = `n_${Date.now()}`
    const newNode = {
      id: newId,
      type: item.type,
      label: item.label,
      x: 100 + Math.random() * 200,
      y: 80 + Math.random() * 140,
    }
    setNodes((prev) => [...prev, newNode])
  }

  const handleDeleteNode = (id) => {
    setNodes((prev) => prev.filter((n) => n.id !== id))
    setEdges((prev) => prev.filter((e) => e.from !== id && e.to !== id))
    if (selectedNodeId === id) setSelectedNodeId(null)
    if (edgeStartId === id) setEdgeStartId(null)
  }

  const handleConnectClick = (nodeId) => {
    if (!edgeStartId) {
      setEdgeStartId(nodeId)
    } else {
      if (edgeStartId !== nodeId) {
        const exists = edges.some(
          (e) => (e.from === edgeStartId && e.to === nodeId) || (e.from === nodeId && e.to === edgeStartId)
        )
        if (!exists) {
          setEdges((prev) => [...prev, { from: edgeStartId, to: nodeId }])
        }
      }
      setEdgeStartId(null)
    }
  }

  // Node Dragging Handlers
  const handleMouseDown = (e, nodeId) => {
    e.stopPropagation()
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return
    setDraggingNodeId(nodeId)
    setDragOffset({
      x: e.clientX - node.x,
      y: e.clientY - node.y,
    })
  }

  const handleMouseMove = (e) => {
    if (!draggingNodeId) return
    const canvasRect = e.currentTarget.getBoundingClientRect()
    const newX = Math.max(20, Math.min(canvasRect.width - 160, e.clientX - dragOffset.x))
    const newY = Math.max(20, Math.min(canvasRect.height - 70, e.clientY - dragOffset.y))

    setNodes((prev) =>
      prev.map((n) => (n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n))
    )
  }

  const handleMouseUp = () => {
    setDraggingNodeId(null)
  }

  // Automated System Design Architecture Linter
  const analyzeArchitecture = () => {
    const hasCache = nodes.some((n) => n.type === 'cache')
    const hasQueue = nodes.some((n) => n.type === 'queue')
    const hasDB = nodes.some((n) => n.type === 'db')
    const hasReplica = nodes.some((n) => n.type === 'replica')
    const hasLB = nodes.some((n) => n.type === 'lb' || n.type === 'gateway')
    const serviceCount = nodes.filter((n) => n.type === 'service').length

    const strengths = []
    const alerts = []

    if (hasLB) strengths.push('Ingress traffic distributed via Load Balancer / Gateway')
    if (hasCache) strengths.push('Low-latency caching reduces database read pressure')
    if (hasReplica) strengths.push('Read/Write separation configured for horizontal scaling')
    if (hasQueue) strengths.push('Asynchronous message queue prevents cascade blocking')

    if (!hasCache && hasDB) {
      alerts.push('Direct database reads without Redis cache layer — risk of IOPS saturation under peak concurrency')
    }
    if (!hasLB && nodes.length > 2) {
      alerts.push('Single point of failure: Ingress traffic hits application cluster without an intermediate load balancer')
    }
    if (!hasReplica && hasDB && serviceCount > 1) {
      alerts.push('Single database node bottleneck: Consider provisioning read replicas for high read-to-write ratios')
    }

    const dynamicProbe = hasCache
      ? 'In your architecture, how do you handle cache invalidation and prevent cache stampedes (thundering herd) when high-concurrency keys expire?'
      : hasQueue
      ? 'What dead-letter queue (DLQ) policy and consumer retry backoff have you architected for failed messages?'
      : 'What telemetry metric or alert threshold would notify you that the database connection pool is exhausting?'

    return { strengths, alerts, dynamicProbe }
  }

  const audit = analyzeArchitecture()

  const handleExportToAnswer = () => {
    const componentList = nodes.map((n) => `${n.label} (${n.type})`).join(' -> ')
    const summary = (
      `\n\n[SYSTEM DESIGN ARCHITECTURE BLUEPRINT]:\n` +
      `• Topology: ${nodes.length} components, ${edges.length} connections.\n` +
      `• Data Path: ${componentList}\n` +
      `• Resiliency Guardrails: ${audit.strengths.join('; ') || 'Standard layered architecture'}.\n` +
      `• Trade-off Addressed: Mitigated bottlenecks by decoupling compute and storage tiers.`
    )
    if (onAttachToAnswer) {
      onAttachToAnswer(summary)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] shadow-2xl text-[#0F172A] dark:text-[#F8FAFC] overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC]/90 dark:bg-[#1E293B]/90">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-xs">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                  Interactive System Design Whiteboard
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#8B5CF6]/10 text-[#8B5CF6] dark:text-[#38BDF8] border border-[#8B5CF6]/20">
                  AI Architecture Linter
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Draw architecture, inspect single points of failure &amp; correlate with interview answers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportToAnswer}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition"
              title="Attach diagram breakdown to your interview transcript"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Attach Diagram to Answer</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Templates & Quick Components */}
        <div className="px-6 py-2.5 border-b border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-900/40 flex items-center justify-between gap-3 flex-wrap text-xs">
          {/* Preset Blueprint Selectors */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-stone-400">Templates:</span>
            <button
              type="button"
              onClick={() => handleApplyTemplate('three_tier')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-emerald-500 transition"
            >
              3-Tier Web
            </button>
            <button
              type="button"
              onClick={() => handleApplyTemplate('high_concurrency')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-emerald-500 transition"
            >
              High-Throughput Cache
            </button>
            <button
              type="button"
              onClick={() => handleApplyTemplate('event_driven')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-emerald-500 transition"
            >
              Event-Driven Kafka
            </button>
          </div>

          {/* Add Component Palette */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            <span className="text-[10px] uppercase font-bold text-stone-400 shrink-0">Add Block:</span>
            {COMPONENT_PALETTE.slice(0, 5).map((comp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddNode(comp)}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 flex items-center gap-1 transition shrink-0"
              >
                <Plus className="w-3 h-3 text-emerald-500" />
                <span>{comp.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setNodes([])
              setEdges([])
            }}
            className="px-2 py-1 rounded-lg text-[10px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Canvas</span>
          </button>
        </div>

        {/* Main Canvas + Analysis Split */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* Interactive Drag & Drop SVG Canvas */}
          <div
            className="flex-1 h-full relative bg-[#F8FAFC] dark:bg-[#0B111D] overflow-hidden select-none cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Grid Pattern */}
            <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none">
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Connecting Directed Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#059669" />
                </marker>
              </defs>
              {edges.map((edge, idx) => {
                const source = nodes.find((n) => n.id === edge.from)
                const target = nodes.find((n) => n.id === edge.to)
                if (!source || !target) return null
                const x1 = source.x + 70
                const y1 = source.y + 25
                const x2 = target.x + 70
                const y2 = target.y + 25

                return (
                  <g key={idx}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#059669"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                      markerEnd="url(#arrow)"
                    />
                  </g>
                )
              })}
            </svg>

            {/* Canvas Architectural Nodes */}
            {nodes.map((node) => {
              const paletteItem = COMPONENT_PALETTE.find((c) => c.type === node.type) || COMPONENT_PALETTE[0]
              const IconComp = paletteItem.icon
              const isSelected = selectedNodeId === node.id
              const isConnecting = edgeStartId === node.id

              return (
                <div
                  key={node.id}
                  style={{ left: `${node.x}px`, top: `${node.y}px` }}
                  onMouseDown={(e) => handleMouseDown(e, node.id)}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`absolute w-36 sm:w-40 p-2.5 rounded-2xl border-2 shadow-md cursor-grab active:cursor-grabbing transition-shadow ${
                    paletteItem.color
                  } ${isSelected ? 'ring-2 ring-emerald-500 shadow-lg' : ''} ${
                    isConnecting ? 'ring-2 ring-amber-400 animate-pulse' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="p-1 rounded-lg bg-white/70 dark:bg-stone-800">
                      <IconComp className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleConnectClick(node.id)
                        }}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          isConnecting
                            ? 'bg-amber-500 text-white'
                            : 'bg-white/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-emerald-500 hover:text-white'
                        } transition`}
                        title="Connect with another node"
                      >
                        {isConnecting ? 'Pick target' : 'Link'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteNode(node.id)
                        }}
                        className="p-1 rounded text-stone-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] font-bold truncate">{node.label}</div>
                  <div className="text-[9px] uppercase tracking-wider opacity-60 font-mono">
                    {node.type}
                  </div>
                </div>
              )
            })}

            {/* Instruction tooltip badge */}
            <div className="absolute bottom-3 left-4 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 text-[10px] text-stone-500 dark:text-stone-400 font-mono shadow-sm flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-emerald-500" />
              <span>Drag blocks to position &bull; Click &quot;Link&quot; then another block to connect</span>
            </div>
          </div>

          {/* Right Sidebar: AI Architecture Linter & Drill-Down Correlator */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-stone-200 dark:border-stone-800 p-4 space-y-4 overflow-y-auto bg-white/60 dark:bg-stone-900/60">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-white">
                  AI Architecture Linter
                </h4>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Audits single points of failure &amp; concurrency bottlenecks in your diagram.
              </p>
            </div>

            {/* Strengths Verified */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                Verified Design Patterns ({audit.strengths.length})
              </span>
              {audit.strengths.length > 0 ? (
                <ul className="space-y-1 text-xs">
                  {audit.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-stone-700 dark:text-stone-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-[11px] leading-snug">{str}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-stone-400 italic">No patterns detected yet. Add components.</p>
              )}
            </div>

            {/* Bottlenecks / Warnings */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                Potential Failure Modes ({audit.alerts.length})
              </span>
              {audit.alerts.length > 0 ? (
                <ul className="space-y-1 text-xs">
                  {audit.alerts.map((al, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl border border-rose-200 dark:border-rose-900/30">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                      <span className="text-[11px] leading-snug">{al}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  No critical bottlenecks detected.
                </p>
              )}
            </div>

            {/* Dynamic Interviewer Cross-Examination Correlated with Diagram */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                <Zap className="w-3.5 h-3.5" />
                <span>Interviewer Correlation Probe</span>
              </div>
              <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 leading-relaxed italic">
                &ldquo;{audit.dynamicProbe}&rdquo;
              </p>
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                Correlated with your drawn components
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportToAnswer}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <FileCheck className="w-4 h-4" />
              <span>Attach Blueprint to Response</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

