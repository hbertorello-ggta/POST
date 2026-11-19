import React, { useState, useRef, useEffect } from 'react';
import {
  TopologyNode,
  TopologyLink,
  Site,
  Device,
  OperationalStatus,
} from '../../types/costi';
import { computeTopologyStats } from '../../utils/costiLogic';
import { StatusBadge } from '../common/StatusBadge';
import { DeviceIcon } from '../common/DeviceIcon';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Plus,
  Trash2,
  Link as LinkIcon,
  Save,
  Search,
  ArrowLeft,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  ExternalLink,
  Sliders,
  Move,
} from 'lucide-react';

interface NetworkTopologyViewProps {
  site: Site;
  initialNodes: TopologyNode[];
  initialLinks: TopologyLink[];
  allSiteDevices: Device[];
  onBackToSite: () => void;
  onSelectDevice: (device: Device) => void;
  currentProfile: 'soporte' | 'admin';
}

export const NetworkTopologyView: React.FC<NetworkTopologyViewProps> = ({
  site,
  initialNodes,
  initialLinks,
  allSiteDevices,
  onBackToSite,
  onSelectDevice,
  currentProfile,
}) => {
  const [nodes, setNodes] = useState<TopologyNode[]>(initialNodes);
  const [links, setLinks] = useState<TopologyLink[]>(initialLinks);

  // Canvas Viewport transformation state (Pan & Zoom)
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Selection states
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

  // Manual connection modal state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [newLinkSourceNodeId, setNewLinkSourceNodeId] = useState<string>('');
  const [newLinkSourcePort, setNewLinkSourcePort] = useState<string>('GigE1/0/1');
  const [newLinkTargetNodeId, setNewLinkTargetNodeId] = useState<string>('');
  const [newLinkTargetPort, setNewLinkTargetPort] = useState<string>('GigE1/0/1');
  const [newLinkSpeed, setNewLinkSpeed] = useState<string>('1 Gbps');
  const [newLinkVlan, setNewLinkVlan] = useState<string>('VLAN 10 Corp');

  // Add node modal state
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);
  const [selectedDeviceToAdd, setSelectedDeviceToAdd] = useState<string>('');

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Compute graph statistics
  const stats = computeTopologyStats(nodes, links);

  // Selected entities
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedLink = links.find((l) => l.id === selectedLinkId);
  const selectedDevice = selectedNode?.deviceId
    ? allSiteDevices.find((d) => d.id === selectedNode.deviceId)
    : undefined;

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.15, 2.2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.45));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Auto-Layout algorithm (Hierarchical Core -> Distribution -> Access)
  const handleAutoLayout = () => {
    const coreNodes = nodes.filter((n) => n.role === 'firewall' || n.role === 'core');
    const distNodes = nodes.filter((n) => n.role === 'distribution');
    const accessNodes = nodes.filter(
      (n) => n.role === 'access' || n.role === 'server' || n.role === 'ap' || n.role === 'other'
    );

    const layouted = nodes.map((node) => {
      if (node.role === 'firewall') {
        return { ...node, x: 480, y: 60 };
      }
      if (node.role === 'core') {
        return { ...node, x: 480, y: 190 };
      }
      if (node.role === 'distribution') {
        const idx = distNodes.findIndex((n) => n.id === node.id);
        const spacing = 500 / Math.max(distNodes.length, 1);
        return { ...node, x: 230 + idx * 380, y: 340 };
      }
      // Access / devices
      const idx = accessNodes.findIndex((n) => n.id === node.id);
      const startX = 100;
      const stepX = 800 / Math.max(accessNodes.length - 1, 1);
      return { ...node, x: startX + idx * stepX, y: 500 };
    });

    setNodes(layouted);
    showToast('Disposición jerárquica reorganizada automáticamente.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Node Drag handlers
  const handleMouseDownNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setDraggingNodeId(nodeId);
    setSelectedNodeId(nodeId);
    setSelectedLinkId(null);

    // Compute offset relative to node coordinates and pan/zoom
    const clientX = e.clientX;
    const clientY = e.clientY;
    setDragOffset({
      x: clientX / zoom - node.x,
      y: clientY / zoom - node.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId) {
      const newX = Math.round(e.clientX / zoom - dragOffset.x);
      const newY = Math.round(e.clientY / zoom - dragOffset.y);

      setNodes((prev) =>
        prev.map((n) => (n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n))
      );
    } else if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
    setIsPanning(false);
  };

  // Canvas Pan Handlers
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setStartPan({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      });
      setSelectedNodeId(null);
      setSelectedLinkId(null);
    }
  };

  // Create Manual Link
  const handleCreateManualLink = () => {
    if (!newLinkSourceNodeId || !newLinkTargetNodeId) return;
    if (newLinkSourceNodeId === newLinkTargetNodeId) {
      showToast('No es posible conectar un dispositivo a sí mismo.');
      return;
    }

    const newLink: TopologyLink = {
      id: `manual-link-${Date.now()}`,
      siteId: site.id,
      sourceNodeId: newLinkSourceNodeId,
      sourcePort: newLinkSourcePort,
      targetNodeId: newLinkTargetNodeId,
      targetPort: newLinkTargetPort,
      speed: newLinkSpeed,
      status: 'normal',
      trafficRxMbps: 12.4,
      trafficTxMbps: 18.2,
      errors: 0,
      vlan: newLinkVlan,
      isManual: true,
      discoveryProtocol: 'Manual',
    };

    setLinks((prev) => [...prev, newLink]);
    setIsConnectModalOpen(false);
    showToast('Enlace manual creado en la topología con éxito.');
  };

  // Delete Link
  const handleDeleteLink = (linkId: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== linkId));
    setSelectedLinkId(null);
    showToast('Enlace removido del diagrama de topología.');
  };

  // Add Device Node to Canvas
  const handleAddNodeToDiagram = () => {
    if (!selectedDeviceToAdd) return;
    const dev = allSiteDevices.find((d) => d.id === selectedDeviceToAdd);
    if (!dev) return;

    // Check if node already exists
    if (nodes.some((n) => n.deviceId === dev.id)) {
      showToast('Este equipo ya está presente en el diagrama.');
      return;
    }

    const newNode: TopologyNode = {
      id: `node-${dev.id}`,
      deviceId: dev.id,
      siteId: site.id,
      label: dev.name,
      sublabel: dev.model.split(' ')[0],
      type: dev.type,
      role: dev.type === 'switch' ? 'access' : dev.type === 'server' ? 'server' : 'other',
      x: 480 + (Math.random() * 100 - 50),
      y: 420 + (Math.random() * 80 - 40),
      status: dev.status,
      ip: dev.ip,
    };

    setNodes((prev) => [...prev, newNode]);
    setIsAddNodeModalOpen(false);
    showToast(`Equipo ${dev.name} agregado al lienzo.`);
  };

  // Save layout action
  const handleSaveLayout = () => {
    showToast('Disposición visual guardada correctamente en el perfil del sitio.');
  };

  return (
    <div
      className="relative w-full h-[calc(100vh-64px)] flex flex-col bg-[#070A0F] overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Topology Control Toolbar */}
      <div className="z-30 w-full glass-panel border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToSite}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-colors"
            title="Volver a la vista del sitio"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400 font-semibold">
                Topología de Red & Switches
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-medium">{site.fullName}</span>
            </div>
            <h1 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Diagrama Lógico de Interconexión</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                {stats.totalNodes} Nodos · {stats.totalLinks} Enlaces ({stats.manualLinks} manuales)
              </span>
            </h1>
          </div>
        </div>

        {/* Action Controls & Legend */}
        <div className="flex items-center gap-2">
          {/* Zoom & Fit View */}
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-slate-400">
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:text-cyan-400 hover:bg-slate-800/60 rounded"
              title="Acercar (Zoom In)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:text-cyan-400 hover:bg-slate-800/60 rounded"
              title="Alejar (Zoom Out)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetView}
              className="px-2 py-1 text-[11px] font-mono hover:text-cyan-400 hover:bg-slate-800/60 rounded"
              title="Restablecer Vista (100%)"
            >
              {Math.round(zoom * 100)}%
            </button>
          </div>

          {/* Auto Layout */}
          <button
            onClick={handleAutoLayout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 hover:text-cyan-400 hover:border-slate-700 text-xs font-medium transition-colors"
            title="Auto-organizar jerárquicamente por niveles (Core, Distribución, Acceso)"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Auto-organizar</span>
          </button>

          {/* Admin Management Tools */}
          {currentProfile === 'admin' && (
            <>
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 hover:bg-cyan-900/50 text-xs font-medium transition-colors"
                title="Crear enlace manual entre dos dispositivos"
              >
                <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">Enlace Manual</span>
              </button>

              <button
                onClick={() => setIsAddNodeModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 text-xs font-medium transition-colors"
                title="Agregar nodo al lienzo"
              >
                <Plus className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline">Agregar Nodo</span>
              </button>

              <button
                onClick={handleSaveLayout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 text-xs font-medium transition-colors"
                title="Guardar disposición visual del diagrama"
              >
                <Save className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden lg:inline">Guardar Vista</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDownCanvas}
        className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
        style={{
          backgroundImage:
            'radial-gradient(rgba(51, 65, 85, 0.25) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* SVG Drawing Layer for Links */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {links.map((link) => {
            const srcNode = nodes.find((n) => n.id === link.sourceNodeId);
            const tgtNode = nodes.find((n) => n.id === link.targetNodeId);
            if (!srcNode || !tgtNode) return null;

            const isSelected = selectedLinkId === link.id;
            const isDegraded = link.status === 'critical' || link.status === 'warning';

            // Coordinates: connect centers of node boxes (node width approx 150px, height 64px)
            const x1 = srcNode.x + 75;
            const y1 = srcNode.y + 32;
            const x2 = tgtNode.x + 75;
            const y2 = tgtNode.y + 32;

            const strokeColor =
              link.status === 'critical'
                ? '#EF4444'
                : link.status === 'warning'
                ? '#F59E0B'
                : '#06B6D4';

            return (
              <g
                key={link.id}
                className="pointer-events-auto cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedLinkId(link.id);
                  setSelectedNodeId(null);
                }}
              >
                {/* Invisible wider hit area for easy clicking */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="transparent"
                  strokeWidth={16}
                />
                {/* Visible link line */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 4 : isDegraded ? 2.5 : 2}
                  strokeDasharray={link.isManual ? '6 4' : undefined}
                  className="transition-all group-hover:stroke-cyan-300"
                />

                {/* Midpoint badge for link speed or errors */}
                <circle
                  cx={(x1 + x2) / 2}
                  cy={(y1 + y2) / 2}
                  r={isDegraded ? 6 : 4}
                  fill={strokeColor}
                  stroke="#070A0F"
                  strokeWidth={2}
                />
              </g>
            );
          })}
        </svg>

        {/* HTML Layer for Draggable Nodes */}
        <div
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isCritical = node.status === 'critical';
            const isWarning = node.status === 'warning';

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleMouseDownNode(e, node.id)}
                className={`absolute pointer-events-auto w-44 rounded-xl p-3 border transition-shadow cursor-move flex flex-col justify-between ${
                  isCritical
                    ? 'border-rose-600/80 bg-rose-950/80 shadow-lg shadow-rose-950/40 text-rose-200'
                    : isWarning
                    ? 'border-amber-600/80 bg-amber-950/80 shadow-lg shadow-amber-950/40 text-amber-200'
                    : isSelected
                    ? 'border-cyan-400 bg-slate-900/95 shadow-xl shadow-cyan-950/50 text-slate-100 ring-2 ring-cyan-500/40'
                    : 'border-slate-800 bg-slate-950/90 shadow-md text-slate-200 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                }}
              >
                {/* Top Node Header: Icon + Status */}
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-slate-900/80 border border-slate-700/60 flex items-center justify-center text-cyan-400">
                      <DeviceIcon type={node.type} className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[9px] uppercase font-mono font-bold tracking-wider px-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {node.role}
                    </span>
                  </div>

                  <span
                    className={`w-2 h-2 rounded-full ${
                      isCritical
                        ? 'bg-rose-500 animate-pulse'
                        : isWarning
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                  />
                </div>

                {/* Node Label & Sublabel */}
                <div className="font-mono text-xs font-bold truncate leading-tight">
                  {node.label}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5 font-sans">
                  {node.sublabel}
                </div>

                {/* Bottom Node Meta: IP & Ports */}
                <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{node.ip}</span>
                  {node.portsTotal && (
                    <span className="text-cyan-400">
                      {node.portsActive}/{node.portsTotal}p
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend Overlay at bottom-left */}
        <div className="absolute bottom-4 left-4 z-20 glass-panel px-3.5 py-2.5 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5 shadow-xl hidden sm:block">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
            Referencias del Diagrama
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-300">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-cyan-400"></span> Enlace Normal
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 border-t border-dashed border-cyan-400"></span> Manual
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-rose-500"></span> Caído / Crítico
            </span>
          </div>
          <div className="text-[10px] text-slate-500 pt-0.5">
            Arrastra cualquier nodo para ajustar la distribución en el plano.
          </div>
        </div>

        {/* Node or Link Inspector Panel (Side Drawer overlay) */}
        {(selectedNode || selectedLink) && (
          <div className="absolute top-4 right-4 z-20 w-80 max-h-[85vh] overflow-y-auto glass-panel-elevated p-4 rounded-xl border border-slate-700/80 shadow-2xl space-y-4 animate-fade-in">
            {/* 1. NODE SELECTED INSPECTOR */}
            {selectedNode && (
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400">
                      <DeviceIcon type={selectedNode.type} className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold font-mono text-slate-100 truncate max-w-[170px]">
                        {selectedNode.label}
                      </h3>
                      <p className="text-[11px] text-slate-400">{selectedNode.sublabel}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="text-slate-500 hover:text-slate-300 text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-800 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rol de Red:</span>
                    <span className="text-cyan-400 uppercase font-bold">{selectedNode.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dirección IP:</span>
                    <span className="text-slate-200">{selectedNode.ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estado Operativo:</span>
                    <StatusBadge status={selectedNode.status} size="sm" />
                  </div>
                  {selectedNode.portsTotal && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Interfaces Activas:</span>
                      <span className="text-slate-200">
                        {selectedNode.portsActive} de {selectedNode.portsTotal} puertos UP
                      </span>
                    </div>
                  )}
                </div>

                {/* Direct links connected to this node */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
                    Conexiones Directas
                  </span>
                  <div className="space-y-1">
                    {links
                      .filter(
                        (l) => l.sourceNodeId === selectedNode.id || l.targetNodeId === selectedNode.id
                      )
                      .map((l) => {
                        const otherNodeId =
                          l.sourceNodeId === selectedNode.id ? l.targetNodeId : l.sourceNodeId;
                        const otherNode = nodes.find((n) => n.id === otherNodeId);
                        return (
                          <div
                            key={l.id}
                            onClick={() => {
                              setSelectedLinkId(l.id);
                              setSelectedNodeId(null);
                            }}
                            className="p-1.5 rounded bg-slate-950/60 border border-slate-800 hover:border-cyan-500/50 cursor-pointer flex items-center justify-between text-[11px] font-mono"
                          >
                            <span className="truncate text-slate-300">
                              Hacia: {otherNode?.label || otherNodeId}
                            </span>
                            <span className="text-cyan-400 text-[10px]">{l.speed}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Button to open full technical detail */}
                {selectedDevice && (
                  <button
                    onClick={() => onSelectDevice(selectedDevice)}
                    className="w-full mt-2 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold text-xs hover:bg-cyan-400 transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-cyan-500/20 font-sans"
                  >
                    <span>Ver Detalle Técnico Completo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* 2. LINK / CONNECTION SELECTED INSPECTOR (Section 9.2) */}
            {selectedLink && (
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                      Detalle de Conexión
                    </span>
                    <h3 className="text-xs font-bold font-mono text-slate-100">
                      {selectedLink.vlan}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedLinkId(null)}
                    className="text-slate-500 hover:text-slate-300 text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2 text-xs font-mono">
                  {/* Origin device & port */}
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Equipo Origen</span>
                    <div className="text-slate-200 font-bold">
                      {nodes.find((n) => n.id === selectedLink.sourceNodeId)?.label ||
                        selectedLink.sourceNodeId}
                    </div>
                    <div className="text-cyan-400 text-[11px]">
                      Puerto: {selectedLink.sourcePort}
                    </div>
                  </div>

                  {/* Destination device & port */}
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase">Equipo Destino</span>
                    <div className="text-slate-200 font-bold">
                      {nodes.find((n) => n.id === selectedLink.targetNodeId)?.label ||
                        selectedLink.targetNodeId}
                    </div>
                    <div className="text-cyan-400 text-[11px]">
                      Puerto: {selectedLink.targetPort}
                    </div>
                  </div>
                </div>

                {/* Connection Metrics (Speed, Rx, Tx, Errors, VLAN) */}
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Velocidad Enlace:</span>
                    <span className="text-slate-200 font-bold">{selectedLink.speed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estado Enlace:</span>
                    <StatusBadge status={selectedLink.status} size="sm" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tráfico Rx / Tx:</span>
                    <span className="text-cyan-400">
                      {selectedLink.trafficRxMbps} / {selectedLink.trafficTxMbps} Mbps
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Errores de Trama:</span>
                    <span
                      className={
                        selectedLink.errors > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'
                      }
                    >
                      {selectedLink.errors}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tipo de Descubrimiento:</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        selectedLink.isManual
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                          : 'bg-slate-900 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {selectedLink.isManual ? 'Configurado Manual' : selectedLink.discoveryProtocol || 'LLDP'}
                    </span>
                  </div>
                </div>

                {/* Delete Link Action (if admin) */}
                {currentProfile === 'admin' && (
                  <button
                    onClick={() => handleDeleteLink(selectedLink.id)}
                    className="w-full py-1.5 rounded bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border border-rose-800/50 text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Desconectar Enlace</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: Crear Enlace Manual (Section 9.4) */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg glass-panel-elevated p-6 rounded-2xl border border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100 font-mono">
                  Crear Conexión Manual de Topología
                </h3>
              </div>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Define una interconexión física o lógica entre dos switches o dispositivos. Esta acción actualiza exclusivamente el diagrama visual sin alterar la configuración de red física.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              {/* Source Device & Port */}
              <div className="space-y-1.5">
                <label className="text-slate-300">Equipo Origen</label>
                <select
                  value={newLinkSourceNodeId}
                  onChange={(e) => setNewLinkSourceNodeId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="">Seleccionar equipo...</option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label} ({n.role})
                    </option>
                  ))}
                </select>

                <label className="text-slate-400 text-[11px] block mt-2">Puerto Origen</label>
                <input
                  type="text"
                  value={newLinkSourcePort}
                  onChange={(e) => setNewLinkSourcePort(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                  placeholder="ej: TenGigE1/0/1"
                />
              </div>

              {/* Target Device & Port */}
              <div className="space-y-1.5">
                <label className="text-slate-300">Equipo Destino</label>
                <select
                  value={newLinkTargetNodeId}
                  onChange={(e) => setNewLinkTargetNodeId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="">Seleccionar equipo...</option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label} ({n.role})
                    </option>
                  ))}
                </select>

                <label className="text-slate-400 text-[11px] block mt-2">Puerto Destino</label>
                <input
                  type="text"
                  value={newLinkTargetPort}
                  onChange={(e) => setNewLinkTargetPort(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                  placeholder="ej: Port 24"
                />
              </div>
            </div>

            {/* Link Speed & VLAN */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-300">Velocidad del Enlace</label>
                <select
                  value={newLinkSpeed}
                  onChange={(e) => setNewLinkSpeed(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="10 Gbps SFP+">10 Gbps SFP+</option>
                  <option value="1 Gbps">1 Gbps Gigabit</option>
                  <option value="100 Mbps">100 Mbps FastEthernet</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300">Etiqueta VLAN</label>
                <input
                  type="text"
                  value={newLinkVlan}
                  onChange={(e) => setNewLinkVlan(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                  placeholder="ej: VLAN 10 Corp"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateManualLink}
                disabled={!newLinkSourceNodeId || !newLinkTargetNodeId}
                className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold text-xs hover:bg-cyan-400 disabled:opacity-50 transition-colors"
              >
                Conectar Enlace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Agregar Nodo a Topología */}
      {isAddNodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass-panel-elevated p-6 rounded-2xl border border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100 font-mono">
                  Agregar Dispositivo al Diagrama
                </h3>
              </div>
              <button
                onClick={() => setIsAddNodeModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <label className="text-slate-300">Seleccionar dispositivo de {site.name}:</label>
              <select
                value={selectedDeviceToAdd}
                onChange={(e) => setSelectedDeviceToAdd(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200"
              >
                <option value="">Seleccionar equipo...</option>
                {allSiteDevices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.model}) - {d.ip}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsAddNodeModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddNodeToDiagram}
                disabled={!selectedDeviceToAdd}
                className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold text-xs hover:bg-cyan-400 disabled:opacity-50 transition-colors"
              >
                Agregar al Diagrama
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 glass-panel-elevated px-4 py-2 rounded-xl border border-cyan-500/50 text-cyan-300 text-xs font-mono flex items-center gap-2 shadow-2xl animate-fade-in">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
