import React, { useState } from 'react';
import {
  Device,
  MetricPeriod,
} from '../../types/costi';
import { StatusBadge } from '../common/StatusBadge';
import { DeviceIcon } from '../common/DeviceIcon';
import { generateTimeSeriesMetrics } from '../../utils/costiLogic';
import {
  X,
  Maximize2,
  Clock,
  Activity,
  HardDrive,
  Cpu,
  Zap,
  Network,
  Video,
  Shield,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Share2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface DeviceDetailModalProps {
  device: Device;
  onClose: () => void;
  onPinFloatingWindow: (device: Device) => void;
  onOpenTopology?: () => void;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  device,
  onClose,
  onPinFloatingWindow,
  onOpenTopology,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<MetricPeriod>('24h');

  // Generate realistic time-series data based on device metrics & selected period
  const primaryMetricBase =
    device.type === 'server' || device.type === 'esxi'
      ? device.telemetry.cpuUsagePercent || 35
      : device.type === 'switch'
      ? device.telemetry.pingLatencyMs || 5
      : device.type === 'ups'
      ? device.telemetry.loadPercent || 40
      : device.telemetry.pingLatencyMs || 10;

  const chartData = generateTimeSeriesMetrics(device.type, selectedPeriod, primaryMetricBase);

  const periods: { id: MetricPeriod; label: string }[] = [
    { id: '1h', label: '1 Hora' },
    { id: '6h', label: '6 Horas' },
    { id: '24h', label: '24 Horas' },
    { id: '7d', label: '7 Días' },
    { id: '30d', label: '30 Días' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl glass-panel-elevated border border-slate-700/80 bg-slate-950/95 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-cyan-400">
              <DeviceIcon type={device.type} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold font-mono text-slate-100">
                  {device.name}
                </span>
                <StatusBadge status={device.status} size="sm" />
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800">
                  {device.ip}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                {device.model} · Sitio {device.siteId.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onPinFloatingWindow(device);
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 transition-colors"
              title="Fijar en ventana flotante para comparar"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
              title="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
              <span className="text-slate-400 font-mono text-[11px]">Disponibilidad</span>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                {device.availability.toFixed(2)}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Últimos 30 días</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
              <span className="text-slate-400 font-mono text-[11px]">Tiempo Activo (Uptime)</span>
              <div className="text-lg font-bold font-mono text-slate-100 mt-1">
                {device.telemetry.uptimeDays ?? '—'} días
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Sin reinicios no programados</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
              <span className="text-slate-400 font-mono text-[11px]">Latencia Ping (ICMP)</span>
              <div className="text-lg font-bold font-mono text-cyan-400 mt-1">
                {device.telemetry.pingLatencyMs !== undefined
                  ? `${device.telemetry.pingLatencyMs} ms`
                  : 'N/A'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Pérdida: {device.telemetry.packetLossPercent ?? 0}%
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
              <span className="text-slate-400 font-mono text-[11px]">Agente de Monitoreo</span>
              <div className="text-sm font-bold font-mono text-slate-200 mt-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Zabbix 7.4 / SNMP</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Último sondeo: hace 6s</div>
            </div>
          </div>

          {/* Device Type-Specific Detailed Panels */}

          {/* 1. SWITCHES: Port Map & Interfaces */}
          {device.type === 'switch' && (
            <div className="space-y-4 p-4 rounded-xl glass-panel border border-slate-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-200">
                    Matriz de Puertos e Interfaces ({device.telemetry.activePortsCount || 18} / {device.telemetry.totalPorts || 24} Activos)
                  </h3>
                </div>
                {onOpenTopology && (
                  <button
                    onClick={onOpenTopology}
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    <span>Ver en Topología</span>
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Visual Port Matrix Grid (1 to 24/48 ports simulation) */}
              <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                <div className="grid grid-cols-12 sm:grid-cols-24 gap-1.5 text-center">
                  {Array.from({ length: device.telemetry.totalPorts || 24 }, (_, i) => {
                    const portNumber = i + 1;
                    const isActive = portNumber <= (device.telemetry.activePortsCount || 18);
                    const isGigabit = portNumber % 2 === 0;

                    return (
                      <div
                        key={portNumber}
                        className={`p-1 rounded flex flex-col items-center justify-center border text-[9px] font-mono transition-colors ${
                          isActive
                            ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
                            : 'bg-slate-900/60 border-slate-800 text-slate-600'
                        }`}
                        title={`Puerto ${portNumber}: ${isActive ? 'UP (1 Gbps) - VLAN 10' : 'DOWN (Sin Enlace)'}`}
                      >
                        <span className="font-bold">{portNumber}</span>
                        <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isActive ? 'bg-emerald-400' : 'bg-slate-700'}`}></span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Port UP
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-700"></span> Port DOWN
                    </span>
                  </div>
                  <span>Protocolo: {device.telemetry.snmpVersion || 'SNMPv3'}</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. SERVERS & ESXI: CPU, RAM, Storage Partitions & Services */}
          {(device.type === 'server' || device.type === 'esxi') && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Storage Partitions */}
                <div className="p-4 rounded-xl glass-panel border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-200">
                      Uso de Almacenamiento & Particiones
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {(device.telemetry.storagePartitions || [
                      { name: 'C: (Sistema)', totalGb: 200, usedGb: 74 },
                      { name: 'D: (Datos)', totalGb: 800, usedGb: 310 },
                    ]).map((part) => {
                      const pct = Math.round((part.usedGb / part.totalGb) * 100);
                      return (
                        <div key={part.name} className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-300">{part.name}</span>
                            <span className="text-slate-400">
                              {part.usedGb} GB / {part.totalGb} GB ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct > 85 ? 'bg-rose-500' : pct > 70 ? 'bg-amber-400' : 'bg-cyan-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* System Services Status */}
                <div className="p-4 rounded-xl glass-panel border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-200">
                      Servicios Críticos Supervisados
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {(device.telemetry.services || [
                      { name: 'Zabbix Agent 2', status: 'running', critical: true },
                      { name: 'Windows Time (NTP)', status: 'running', critical: false },
                      { name: 'SQL Server (MSSQLSERVER)', status: 'running', critical: true },
                    ]).map((srv) => (
                      <div
                        key={srv.name}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs"
                      >
                        <span className="font-mono text-slate-300">{srv.name}</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>En Ejecución</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. UPS APC: Battery, Runtime, Voltage, Electrical Diagnostic */}
          {device.type === 'ups' && (
            <div className="p-4 rounded-xl glass-panel border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-200">
                    Telemetría Eléctrica & Baterías (APC Smart-UPS SNMP)
                  </h3>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  Fuente: Red Comercial (Utility)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-mono">Tensión Entrada</span>
                  <div className="text-base font-bold font-mono text-slate-100 mt-1">
                    {device.telemetry.inputVoltage || 224} V AC
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Rango normal</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-mono">Tensión Salida</span>
                  <div className="text-base font-bold font-mono text-slate-100 mt-1">
                    {device.telemetry.outputVoltage || 220} V AC
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Estabilizada</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-mono">Carga Inversor</span>
                  <div className="text-base font-bold font-mono text-cyan-400 mt-1">
                    {device.telemetry.loadPercent || 36}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">3.6 kVA / 10 kVA</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-mono">Autonomía Restante</span>
                  <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                    {device.telemetry.batteryRuntimeMinutes || 54} min
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Batería: 100%</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-900/40 text-xs text-blue-200 leading-relaxed font-sans">
                <strong>Análisis de Correlación Eléctrica:</strong> Este equipo APC se encuentra funcionando con parámetros de entrada nominales. En caso de incidentes en switches o servidores adyacentes, esta telemetría confirma que el suministro eléctrico no ha sufrido cortes generales.
              </div>
            </div>
          )}

          {/* 4. CAMERAS / AFIP CAMERAS: RTSP stream status, fps, bitrate */}
          {(device.type === 'camera' || device.type === 'afip_camera') && (
            <div className="p-4 rounded-xl glass-panel border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-200">
                    Estado de Transmisión RTSP & Parámetros de Video
                  </h3>
                </div>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded border ${
                    device.telemetry.rtspStatus === 'active'
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                      : 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                  }`}
                >
                  RTSP: {device.telemetry.rtspStatus === 'active' ? 'Flujo Activo' : 'Inestable'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">Resolución</span>
                  <div className="text-slate-200 font-bold mt-1">
                    {device.telemetry.resolution || '1080p (FHD)'}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">Tasa de Cuadros</span>
                  <div className="text-slate-200 font-bold mt-1">
                    {device.telemetry.fps || 25} FPS
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">Tasa de Bits (Bitrate)</span>
                  <div className="text-cyan-400 font-bold mt-1">
                    {device.telemetry.bitrateKbps || 4096} Kbps
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">Pérdida de Paquetes</span>
                  <div className="text-slate-200 font-bold mt-1">
                    {device.telemetry.packetLossPercent || 0}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 10: HISTÓRICOS & GRÁFICOS CON SELECTOR DE PERÍODO */}
          <div className="p-5 rounded-xl glass-panel border border-slate-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-200">
                  Comportamiento Histórico de Métricas
                </h3>
                <p className="text-[11px] text-slate-400 font-sans">
                  {device.type === 'server' || device.type === 'esxi'
                    ? 'Evolución de Carga de CPU (%) y Memoria RAM'
                    : device.type === 'switch'
                    ? 'Latencia Ping ICMP (ms) y Tráfico de Enlace'
                    : device.type === 'ups'
                    ? 'Carga de Inversor (%) y Nivel de Batería'
                    : 'Latencia y Tasa de Pérdida de Paquetes'}
                </p>
              </div>

              {/* Period Selector (1h, 6h, 24h, 7d, 30d) */}
              <div className="flex items-center gap-1 p-1 bg-slate-950/90 rounded-lg border border-slate-800">
                {periods.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPeriod(p.id)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors font-mono ${
                      selectedPeriod === p.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {p.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Chart Viewport */}
            <div className="w-full h-56 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="secGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    stroke="#475569"
                    fontSize={10}
                    tickLine={false}
                    fontFamily="monospace"
                  />
                  <YAxis
                    stroke="#475569"
                    fontSize={10}
                    tickLine={false}
                    fontFamily="monospace"
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Métrica Principal"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#metricGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="secondary"
                    name="Métrica Secundaria"
                    stroke="#3B82F6"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    fillOpacity={1}
                    fill="url(#secGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Events for this Device */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-300">
              Registro de Eventos y Alarmas del Equipo ({device.events.length})
            </h3>
            {device.events.length === 0 ? (
              <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
                Sin alertas activas ni eventos anómalos registrados en los últimos 7 días.
              </div>
            ) : (
              <div className="space-y-2">
                {device.events.map((ev) => (
                  <div
                    key={ev.id}
                    className={`p-3 rounded-lg border flex items-start justify-between gap-3 text-xs ${
                      ev.severity === 'critical'
                        ? 'bg-rose-950/40 border-rose-900/60 text-rose-200'
                        : 'bg-amber-950/30 border-amber-900/40 text-amber-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="font-semibold">{ev.message}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Detectado: {ev.timestamp} · Duración: {ev.duration}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold shrink-0 ${
                        ev.status === 'active'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {ev.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            Zabbix Item ID: 489201 · Interfaz: {device.ip}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-medium transition-colors"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
};
