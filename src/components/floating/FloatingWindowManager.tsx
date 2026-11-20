import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EASE_OUT } from '../../lib/motion';
import {
  FloatingWindowItem,
  MetricPeriod,
  Device,
} from '../../types/monitoring';
import { DeviceIcon } from '../common/DeviceIcon';
import { StatusBadge } from '../common/StatusBadge';
import { generateTimeSeriesMetrics } from '../../utils/monitoringLogic';
import {
  X,
  Minimize2,
  Maximize2,
  Move,
  Activity,
  Layers,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface FloatingWindowManagerProps {
  windows: FloatingWindowItem[];
  onCloseWindow: (windowId: string) => void;
  onToggleMinimize: (windowId: string) => void;
  onUpdatePosition: (windowId: string, x: number, y: number) => void;
  onUpdatePeriod: (windowId: string, period: MetricPeriod) => void;
  onOpenDeviceDetail: (device: Device) => void;
}

export const FloatingWindowManager: React.FC<FloatingWindowManagerProps> = ({
  windows,
  onCloseWindow,
  onToggleMinimize,
  onUpdatePosition,
  onUpdatePeriod,
  onOpenDeviceDetail,
}) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDownHeader = (e: React.MouseEvent, win: FloatingWindowItem) => {
    setDraggingId(win.id);
    setDragOffset({
      x: e.clientX - win.x,
      y: e.clientY - win.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId) return;
    const newX = Math.max(10, Math.min(window.innerWidth - 360, e.clientX - dragOffset.x));
    const newY = Math.max(70, Math.min(window.innerHeight - 80, e.clientY - dragOffset.y));
    onUpdatePosition(draggingId, newX, newY);
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-50 overflow-hidden ${
        draggingId ? 'cursor-grabbing pointer-events-auto' : ''
      }`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <AnimatePresence>
      {windows.map((win) => {
        const { device, period, x, y, minimized } = win;

        const baseVal =
          device.type === 'server' || device.type === 'esxi'
            ? device.telemetry.cpuUsagePercent || 30
            : device.type === 'ups'
            ? device.telemetry.loadPercent || 40
            : device.telemetry.pingLatencyMs || 5;

        const chartData = generateTimeSeriesMetrics(device.type, period, baseVal);

        const periods: MetricPeriod[] = ['1h', '6h', '24h', '7d'];

        return (
          <motion.div
            key={win.id}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="absolute pointer-events-auto w-80 glass-panel-elevated rounded-xl border border-slate-700/90 shadow-2xl overflow-hidden bg-slate-950/95 transition-shadow"
            style={{ left: `${x}px`, top: `${y}px` }}
          >
            {/* Draggable Window Header */}
            <div
              onMouseDown={(e) => handleMouseDownHeader(e, win)}
              className="px-3 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between cursor-move select-none"
            >
              <div className="flex items-center gap-2 truncate">
                <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
                  <DeviceIcon type={device.type} className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold font-mono text-slate-100 truncate">
                  {device.name}
                </span>
                <span className="text-[10px] uppercase font-mono text-slate-500">
                  {device.siteId}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onToggleMinimize(win.id)}
                  className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title={minimized ? 'Restaurar' : 'Minimizar'}
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onCloseWindow(win.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Cerrar ventana flotante"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Window Body (When not minimized) */}
            {!minimized && (
              <div className="p-3 space-y-3">
                {/* Status & Key Metric Row */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <StatusBadge status={device.status} size="sm" />
                  <span className="text-slate-400 text-[11px]">{device.ip}</span>
                </div>

                {/* Period Selector Tabs */}
                <div className="flex items-center justify-between gap-1 p-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono">
                  {periods.map((p) => (
                    <button
                      key={p}
                      onClick={() => onUpdatePeriod(win.id, p)}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        period === p
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Compact Mini Chart */}
                <div className="w-full h-28 pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 2, right: 2, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`grad-${win.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" hide />
                      <YAxis stroke="#475569" fontSize={9} tickLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderColor: '#334155',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontFamily: 'monospace',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#06B6D4"
                        strokeWidth={1.5}
                        fill={`url(#grad-${win.id})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Open full modal link */}
                <button
                  onClick={() => onOpenDeviceDetail(device)}
                  className="w-full py-1 text-center text-[11px] text-cyan-400 hover:text-cyan-300 font-mono border-t border-slate-800 pt-1.5 transition-colors"
                >
                  Abrir análisis completo →
                </button>
              </div>
            )}
          </motion.div>
        );
      })}
      </AnimatePresence>
    </div>
  );
};
