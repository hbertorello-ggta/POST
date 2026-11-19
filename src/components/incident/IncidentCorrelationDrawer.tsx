import React, { useState } from 'react';
import {
  IncidentCorrelation,
  Site,
  Device,
  OperationalStatus,
} from '../../types/costi';
import { StatusBadge } from '../common/StatusBadge';
import { DeviceIcon } from '../common/DeviceIcon';
import {
  X,
  AlertTriangle,
  AlertOctagon,
  Zap,
  Radio,
  Shield,
  Layers,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface IncidentCorrelationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: IncidentCorrelation[];
  sites: Site[];
  devices: Device[];
  onSelectDevice: (device: Device) => void;
  onSelectSite: (siteId: string) => void;
}

export const IncidentCorrelationDrawer: React.FC<IncidentCorrelationDrawerProps> = ({
  isOpen,
  onClose,
  incidents,
  sites,
  devices,
  onSelectDevice,
  onSelectSite,
}) => {
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'correlation' | 'all_events'>('correlation');

  if (!isOpen) return null;

  const filteredIncidents =
    selectedSiteFilter === 'all'
      ? incidents
      : incidents.filter((inc) => inc.siteId === selectedSiteFilter);

  // All active device events for the all_events tab
  const allEvents = devices
    .flatMap((d) =>
      d.events.map((ev) => ({
        ...ev,
        device: d,
        site: sites.find((s) => s.id === d.siteId),
      }))
    )
    .sort((a, b) => (a.status === 'active' ? -1 : 1));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl h-full glass-panel-elevated bg-slate-950/95 border-l border-slate-700/80 shadow-2xl flex flex-col overflow-hidden">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-mono">
                Gestión de Eventos & Diagnóstico Correlacionado
              </h2>
              <p className="text-[11px] text-slate-400">
                Análisis de causa raíz e investigación cruzada eléctrica/conectividad
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Filter Bar */}
        <div className="px-6 py-2.5 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('correlation')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'correlation'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Causa Raíz & Correlación ({incidents.length})
            </button>
            <button
              onClick={() => setActiveTab('all_events')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'all_events'
                  ? 'bg-slate-800 text-slate-200 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Eventos Individuales ({allEvents.length})
            </button>
          </div>

          {/* Site Filter dropdown */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedSiteFilter}
              onChange={(e) => setSelectedSiteFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">Todos los sitios</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'correlation' ? (
            <div className="space-y-6">
              {filteredIncidents.length === 0 ? (
                <div className="text-center py-12 glass-panel rounded-xl text-slate-400 text-xs">
                  No hay incidentes correlacionados activos en el sitio seleccionado.
                </div>
              ) : (
                filteredIncidents.map((inc) => {
                  const rootDevice = devices.find((d) => d.id === inc.rootCauseDeviceId);
                  const site = sites.find((s) => s.id === inc.siteId);

                  return (
                    <div
                      key={inc.id}
                      className="p-5 rounded-2xl bg-slate-900/90 border border-rose-900/60 shadow-xl space-y-4 text-xs"
                    >
                      {/* Incident Title & Meta */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60">
                              {inc.confidence === 'probable' ? 'Causa Probable' : 'Causa Confirmada'}
                            </span>
                            <span className="text-slate-500">·</span>
                            <span className="font-mono text-cyan-400 font-semibold uppercase">
                              Sitio {site?.name}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-100 font-mono">
                            {inc.title}
                          </h3>
                        </div>

                        <StatusBadge status="critical" size="sm" />
                      </div>

                      {/* Probable Root Cause Device spotlight */}
                      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-900/40 space-y-2">
                        <div className="text-[10px] uppercase font-mono tracking-wider text-rose-400 font-bold flex items-center gap-1.5">
                          <AlertOctagon className="w-3.5 h-3.5" />
                          <span>Dispositivo Origen Identificado</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400">
                              <Shield className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-mono font-bold text-slate-200">
                                {inc.rootCauseDeviceName}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {rootDevice?.model} · IP: {rootDevice?.ip}
                              </div>
                            </div>
                          </div>

                          {rootDevice && (
                            <button
                              onClick={() => {
                                onSelectDevice(rootDevice);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 text-[11px] font-mono border border-slate-800 transition-colors flex items-center gap-1"
                            >
                              <span>Inspeccionar</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans pt-1">
                          {inc.rootCauseDescription}
                        </p>
                      </div>

                      {/* Scope & Affected Devices Grouping (Section 11.1) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-300 font-semibold">
                            Alcance: {inc.affectedDevicesCount} Dispositivos Dependientes Afectados
                          </span>
                          <span className="text-slate-500">
                            Duración: {inc.duration}
                          </span>
                        </div>

                        <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 space-y-2">
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            En lugar de reportar {inc.affectedDevicesCount} alarmas aisladas sin contexto, el motor de correlación C.O.S.TI agrupa estos dispositivos como consecuencia directa de la caída del firewall/enlace perimetral:
                          </p>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {inc.affectedDeviceIds.map((devId) => {
                              const dev = devices.find((d) => d.id === devId);
                              if (!dev) return null;
                              return (
                                <button
                                  key={devId}
                                  onClick={() => {
                                    onSelectDevice(dev);
                                    onClose();
                                  }}
                                  className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center gap-1 transition-colors"
                                >
                                  <DeviceIcon type={dev.type} className="w-3 h-3 text-slate-400" />
                                  <span>{dev.name}</span>
                                </button>
                              );
                            })}
                            <span className="text-[10px] font-mono px-2 py-1 text-slate-500">
                              + 9 dispositivos secundarios
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Electrical vs Connectivity Diagnosis (Section 11.2) */}
                      <div className="p-4 rounded-xl bg-blue-950/25 border border-blue-900/50 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-blue-300 font-mono font-bold">
                            <Zap className="w-4 h-4 text-amber-400" />
                            <span>Diagnóstico Eléctrico Cruzado (APC UPS)</span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/40">
                            Suministro OK
                          </span>
                        </div>

                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {inc.powerCorrelation.diagnosisNote}
                        </p>

                        <div className="pt-2 border-t border-blue-900/40 grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                          <div className="p-1.5 rounded bg-slate-950/60">
                            <span className="text-slate-400">Estado UPS</span>
                            <div className="text-emerald-400 font-bold">Online en Red</div>
                          </div>
                          <div className="p-1.5 rounded bg-slate-950/60">
                            <span className="text-slate-400">Nivel Batería</span>
                            <div className="text-slate-200 font-bold">
                              {inc.powerCorrelation.upsBatteryPercent}%
                            </div>
                          </div>
                          <div className="p-1.5 rounded bg-slate-950/60">
                            <span className="text-slate-400">Autonomía</span>
                            <div className="text-slate-200 font-bold">
                              {inc.powerCorrelation.upsEstimatedRuntimeMin} min
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action to jump to Site */}
                      <button
                        onClick={() => {
                          onSelectSite(inc.siteId);
                          onClose();
                        }}
                        className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Abrir Detalle Completo del Sitio {site?.name}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* ALL INDIVIDUAL EVENTS TAB */
            <div className="space-y-2">
              {allEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => {
                    if (ev.device) onSelectDevice(ev.device);
                    onClose();
                  }}
                  className={`p-3 rounded-lg border flex items-start justify-between gap-3 text-xs cursor-pointer transition-colors ${
                    ev.severity === 'critical'
                      ? 'bg-rose-950/30 border-rose-900/50 hover:border-rose-700'
                      : 'bg-amber-950/20 border-amber-900/40 hover:border-amber-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400 font-bold">
                        {ev.device?.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({ev.site?.name} · {ev.device?.type})
                      </span>
                    </div>
                    <p className="text-slate-200">{ev.message}</p>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {ev.timestamp} · Duración: {ev.duration}
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold shrink-0 ${
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
    </div>
  );
};
