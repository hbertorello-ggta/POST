import React, { useState } from 'react';
import {
  Site,
  FunctionalArea,
  FunctionalAreaId,
  DeviceCategory,
  Device,
} from '../../types/costi';
import { filterDevices } from '../../utils/costiLogic';
import { StatusBadge } from '../common/StatusBadge';
import { DeviceIcon } from '../common/DeviceIcon';
import {
  Building2,
  Cpu,
  Camera,
  Users,
  Server,
  Network,
  Share2,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Search,
  Maximize2,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface SiteDetailViewProps {
  site: Site;
  allFunctionalAreas: FunctionalArea[];
  categories: DeviceCategory[];
  devices: Device[];
  initialAreaId?: FunctionalAreaId;
  onBackToOverview: () => void;
  onSelectDevice: (device: Device) => void;
  onOpenTopology: () => void;
  onPinFloatingWindow: (device: Device) => void;
  currentProfile: 'soporte' | 'admin';
}

export const SiteDetailView: React.FC<SiteDetailViewProps> = ({
  site,
  allFunctionalAreas,
  categories,
  devices,
  initialAreaId,
  onBackToOverview,
  onSelectDevice,
  onOpenTopology,
  onPinFloatingWindow,
  currentProfile,
}) => {
  // Only the areas implemented in this site
  const implementedAreas = allFunctionalAreas.filter((a) =>
    site.implementedAreas.includes(a.id)
  );

  const [activeAreaId, setActiveAreaId] = useState<FunctionalAreaId>(
    initialAreaId && site.implementedAreas.includes(initialAreaId)
      ? initialAreaId
      : implementedAreas[0]?.id || 'infraestructura'
  );

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [deviceSearch, setDeviceSearch] = useState<string>('');

  // Categories belonging to the active functional area
  const areaCategories = categories.filter((c) => c.areaId === activeAreaId);

  // Filter devices for current site and active area
  const siteAreaDevices = filterDevices(
    devices,
    site.id,
    activeAreaId,
    selectedCategoryId === 'all' ? undefined : selectedCategoryId,
    deviceSearch
  );

  const getAreaIcon = (areaId: FunctionalAreaId) => {
    switch (areaId) {
      case 'infraestructura':
        return <Server className="w-4 h-4" />;
      case 'produccion':
        return <Cpu className="w-4 h-4" />;
      case 'cctv':
        return <Camera className="w-4 h-4" />;
      case 'rrhh':
        return <Users className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* 7.1 Encabezado del Sitio */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToOverview}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-colors"
            title="Regresar a la pantalla principal (Overview)"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400 font-semibold">
                Detalle de Sitio
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400">{site.location}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-100">{site.fullName}</h1>
              <StatusBadge status={site.status} size="md" />
            </div>
          </div>
        </div>

        {/* Site Telemetry Badges & Quick Action */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="glass-panel px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px]">Disponibilidad: </span>
            <span
              className={`font-bold ${
                site.status === 'critical'
                  ? 'text-rose-400'
                  : site.status === 'warning'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {site.availability.toFixed(2)}%
            </span>
          </div>

          <div className="glass-panel px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 text-[11px] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Último sync: {site.lastUpdate.split(' ')[1]}</span>
          </div>

          {/* Quick launch to network topology */}
          <button
            onClick={onOpenTopology}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 hover:bg-cyan-900/50 hover:border-cyan-600 transition-all font-sans font-medium"
            title="Abrir la Topología de Red y Switches de este sitio"
          >
            <Network className="w-4 h-4 text-cyan-400" />
            <span>Topología de Red</span>
          </button>
        </div>
      </div>

      {/* 7.2 Tabs de Áreas Funcionales Implementadas */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-px overflow-x-auto scrollbar-none">
          {implementedAreas.map((area) => {
            const isActive = activeAreaId === area.id;
            const areaDevices = devices.filter(
              (d) => d.siteId === site.id && d.areaId === area.id
            );
            const hasIssue = areaDevices.some(
              (d) => d.status === 'critical' || d.status === 'warning'
            );

            return (
              <button
                key={area.id}
                onClick={() => {
                  setActiveAreaId(area.id);
                  setSelectedCategoryId('all');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {getAreaIcon(area.id)}
                <span>{area.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {areaDevices.length}
                </span>
                {hasIssue && (
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* 7.3 Organización Visual: Categorías y Buscador de Dispositivos */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                selectedCategoryId === 'all'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Todos ({devices.filter((d) => d.siteId === site.id && d.areaId === activeAreaId).length})
            </button>

            {areaCategories.map((cat) => {
              const catDevices = devices.filter(
                (d) =>
                  d.siteId === site.id &&
                  d.areaId === activeAreaId &&
                  d.categoryId === cat.id
              );
              if (catDevices.length === 0) return null;

              const isCatActive = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    isCatActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <DeviceIcon type={cat.deviceType} className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({catDevices.length})</span>
                </button>
              );
            })}
          </div>

          {/* Quick Filter Search */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={deviceSearch}
              onChange={(e) => setDeviceSearch(e.target.value)}
              placeholder="Filtrar por nombre o IP..."
              className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono"
            />
          </div>
        </div>

        {/* Special Banner for Switches Category: Prompt to Network Topology */}
        {activeAreaId === 'infraestructura' && (selectedCategoryId === 'all' || selectedCategoryId === 'infra_switches') && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-slate-900 border border-cyan-800/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700/50 flex items-center justify-center text-cyan-400 shrink-0">
                <Network className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-slate-200">
                  Visualización de Topología de Switches de {site.name}
                </span>
                <p className="text-slate-400 text-[11px]">
                  Explora la jerarquía de interconexión (Core, Distribución y Acceso), puertos, VLANs y enlaces en el diagrama interactivo.
                </p>
              </div>
            </div>
            <button
              onClick={onOpenTopology}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-semibold text-xs hover:bg-cyan-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm shadow-cyan-500/30"
            >
              <span>Abrir Diagrama de Red</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 7.4 Listado de Dispositivos */}
        <div className="space-y-2">
          {siteAreaDevices.length === 0 ? (
            <div className="text-center py-12 glass-panel rounded-xl border border-slate-800/80 text-slate-400 text-xs">
              No se encontraron dispositivos para los filtros seleccionados en este sector.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {siteAreaDevices.map((device) => {
                const isCritical = device.status === 'critical';
                const isWarning = device.status === 'warning';

                return (
                  <div
                    key={device.id}
                    className={`group p-4 rounded-xl glass-panel hover:glass-panel-elevated transition-all border text-left flex flex-col justify-between ${
                      isCritical
                        ? 'border-rose-900/60 bg-rose-950/20'
                        : isWarning
                        ? 'border-amber-900/60 bg-amber-950/15'
                        : 'border-slate-800/70 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Top Row: Icon + Name + Status */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/60 flex items-center justify-center text-slate-300 group-hover:text-cyan-400 transition-colors shrink-0">
                            <DeviceIcon type={device.type} className="w-4 h-4" />
                          </div>
                          <div>
                            <h3
                              onClick={() => onSelectDevice(device)}
                              className="text-xs font-bold font-mono text-slate-100 hover:text-cyan-300 transition-colors cursor-pointer"
                              title="Ver métricas técnicas completas"
                            >
                              {device.name}
                            </h3>
                            <div className="text-[11px] text-slate-400 font-mono truncate max-w-[160px]">
                              {device.ip}
                            </div>
                          </div>
                        </div>

                        <StatusBadge status={device.status} size="sm" />
                      </div>

                      {/* Model & Specs */}
                      <p className="text-[11px] text-slate-400 line-clamp-1 mb-2 font-sans">
                        {device.model}
                      </p>

                      {/* Quick telemetry pills according to device type */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono mb-3">
                        {device.telemetry.uptimeDays !== undefined && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-900/90 text-slate-400 border border-slate-800">
                            Up: {device.telemetry.uptimeDays}d
                          </span>
                        )}
                        {device.telemetry.pingLatencyMs !== undefined && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-900/90 text-slate-400 border border-slate-800">
                            Ping: {device.telemetry.pingLatencyMs}ms
                          </span>
                        )}
                        {device.telemetry.cpuUsagePercent !== undefined && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-900/90 text-slate-400 border border-slate-800">
                            CPU: {device.telemetry.cpuUsagePercent}%
                          </span>
                        )}
                        {device.telemetry.totalPorts !== undefined && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-900/90 text-slate-400 border border-slate-800">
                            Puertos: {device.telemetry.activePortsCount}/{device.telemetry.totalPorts}
                          </span>
                        )}
                        {device.telemetry.batteryCapacityPercent !== undefined && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                            Bat: {device.telemetry.batteryCapacityPercent}% ({device.telemetry.batteryRuntimeMinutes}m)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 text-[11px]">
                        Disp: <strong className="text-slate-200">{device.availability}%</strong>
                      </span>

                      <div className="flex items-center gap-1">
                        {/* Pin to floating window button */}
                        <button
                          onClick={() => onPinFloatingWindow(device)}
                          className="p-1 rounded text-slate-500 hover:text-cyan-400 hover:bg-slate-800/80 transition-colors"
                          title="Fijar a ventana flotante para comparar"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Open full detail */}
                        <button
                          onClick={() => onSelectDevice(device)}
                          className="px-2 py-0.5 rounded text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40 text-[11px] font-sans font-medium flex items-center gap-1 transition-colors"
                        >
                          <span>Detalle</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
