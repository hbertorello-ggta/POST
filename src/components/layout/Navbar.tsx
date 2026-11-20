import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Layers,
  Search,
  Volume2,
  VolumeX,
  ShieldAlert,
} from 'lucide-react';
import { Device, Site } from '../../types/monitoring';

interface NavbarProps {
  currentProfile: 'soporte' | 'admin';
  onToggleProfile: (profile: 'soporte' | 'admin') => void;
  activeIncidentsCount: number;
  activeProductiveCount?: number;
  activeSupportCount?: number;
  onOpenIncidents: () => void;
  floatingWindowsCount: number;
  onNavigateHome: () => void;
  devices: Device[];
  sites: Site[];
  onSelectDevice: (device: Device) => void;
  onSelectSite: (siteId: string) => void;
  isGuardMode?: boolean;
  onToggleGuardMode?: () => void;
  isSoundEnabled?: boolean;
  onToggleSound?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProfile,
  onToggleProfile,
  activeIncidentsCount,
  activeProductiveCount = 0,
  activeSupportCount = 0,
  onOpenIncidents,
  floatingWindowsCount,
  onNavigateHome,
  devices,
  sites,
  onSelectDevice,
  onSelectSite,
  isGuardMode = false,
  onToggleGuardMode,
  isSoundEnabled = true,
  onToggleSound,
}) => {
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setCurrentDateTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filtered search results
  const filteredDevices = searchQuery.trim().length > 1
    ? devices.filter((d) =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.model.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  const filteredSites = searchQuery.trim().length > 1
    ? sites.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo Zone */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-3 text-left group focus:outline-none"
            title="Ir a Pantalla Principal (Overview)"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400/60 transition-colors">
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-wider text-slate-100 font-mono">
                  POST
                </span>
                <span className="text-[10px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/70 text-cyan-400 border border-cyan-800/40 uppercase">
                  NOC/SOC
                </span>
              </div>
              <p className="text-[11px] text-slate-400 tracking-tight font-medium">
                IT Operations Center
              </p>
            </div>
          </button>
        </div>

        {/* Search Bar / Quick Lookup */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Buscar switch, servidor, IP (ej: 10.20.0.1, FortiGate, Pilar)..."
              className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-all font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && (filteredDevices.length > 0 || filteredSites.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-1.5 glass-panel-elevated rounded-lg border border-slate-700/70 p-2 shadow-2xl z-50 max-h-80 overflow-y-auto">
              {filteredSites.length > 0 && (
                <div className="mb-2">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 px-2 py-1">
                    Sitios
                  </div>
                  {filteredSites.map((site) => (
                    <button
                      key={site.id}
                      onClick={() => {
                        onSelectSite(site.id);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800/80 flex items-center justify-between text-xs text-slate-200"
                    >
                      <span className="font-semibold">{site.name}</span>
                      <span className="text-[11px] text-slate-400">{site.location}</span>
                    </button>
                  ))}
                </div>
              )}

              {filteredDevices.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 px-2 py-1">
                    Dispositivos
                  </div>
                  {filteredDevices.map((dev) => (
                    <button
                      key={dev.id}
                      onClick={() => {
                        onSelectDevice(dev);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800/80 flex items-center justify-between text-xs text-slate-200 group"
                    >
                      <div>
                        <div className="font-mono text-cyan-400 group-hover:text-cyan-300 font-medium">
                          {dev.name}
                        </div>
                        <div className="text-[11px] text-slate-400">{dev.model}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[11px] text-slate-400">{dev.ip}</div>
                        <div className="text-[10px] uppercase text-slate-500 font-mono">
                          {dev.siteId}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Info & Actions Zone */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* MODO GUARDIA / SOLO PRODUCTIVOS TOGGLE */}
          {onToggleGuardMode && (
            <button
              onClick={onToggleGuardMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-all ${
                isGuardMode
                  ? 'bg-red-600/25 border-red-500/80 text-red-200 shadow-lg shadow-red-900/40 animate-pulse'
                  : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-900/50'
              }`}
              title="Modo Guardia: Filtra y muestra EXCLUSIVAMENTE los fallos que afectan la producción fabril"
            >
              <ShieldAlert className={`w-3.5 h-3.5 ${isGuardMode ? 'text-red-400' : 'text-slate-500'}`} />
              <span>{isGuardMode ? 'GUARDIA ACTIVA' : 'Solo Prod'}</span>
            </button>
          )}

          {/* SONIDO TOGGLE */}
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className={`p-1.5 rounded-lg border text-xs transition-all ${
                isSoundEnabled
                  ? 'bg-slate-900 border-slate-800 text-cyan-400 hover:bg-slate-800'
                  : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-slate-400'
              }`}
              title={isSoundEnabled ? 'Sonido de alertas habilitado (clic para silenciar)' : 'Sonido silenciado (clic para activar)'}
            >
              {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          )}

          {/* Incidents / Alerts Button with Productive vs Support badges */}
          <button
            onClick={onOpenIncidents}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              activeProductiveCount > 0
                ? 'bg-red-950/50 border-red-700/80 text-red-200 hover:bg-red-900/60 shadow-md shadow-red-950'
                : activeIncidentsCount > 0
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-200 hover:bg-amber-900/50'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Abrir panel de Incidentes Correlacionados y Diagnóstico Eléctrico"
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${activeProductiveCount > 0 ? 'text-red-400' : activeIncidentsCount > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Eventos</span>
            {activeProductiveCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-red-500/30 text-red-300 border border-red-500/60">
                {activeProductiveCount} PROD
              </span>
            )}
            {activeSupportCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {activeSupportCount}
              </span>
            )}
          </button>

          {/* Profile Switcher */}
          <div className="flex items-center rounded-lg bg-slate-900/90 border border-slate-800 p-0.5">
            <button
              onClick={() => onToggleProfile('soporte')}
              className={`px-2 py-1 text-[11px] rounded font-medium transition-all ${
                currentProfile === 'soporte'
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Perfil Soporte TI: Visualización de disponibilidad y alarmas"
            >
              Soporte
            </button>
            <button
              onClick={() => onToggleProfile('admin')}
              className={`px-2 py-1 text-[11px] rounded font-medium transition-all ${
                currentProfile === 'admin'
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Perfil Admin: Topología editable y diagnóstico avanzado"
            >
              Admin
            </button>
          </div>

          {/* Floating Windows indicator */}
          {floatingWindowsCount > 0 && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/50 border border-blue-800/40 text-blue-300 text-xs font-mono"
              title="Ventanas de métricas flotantes activas en pantalla"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>{floatingWindowsCount}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
