import React from 'react';
import {
  Building2,
  Cpu,
  Camera,
  Users,
  ChevronRight,
  ShieldCheck,
  Radio,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react';
import { Site, FunctionalArea, FunctionalAreaId } from '../../types/monitoring';
import { StatusBadge } from '../common/StatusBadge';

interface OverviewViewProps {
  sites: Site[];
  functionalAreas: FunctionalArea[];
  onSelectSite: (siteId: string) => void;
  onSelectGlobalArea: (areaId: FunctionalAreaId) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  sites,
  functionalAreas,
  onSelectSite,
  onSelectGlobalArea,
}) => {
  // Global functional areas to display in the dedicated section
  const globalNavAreas = functionalAreas.filter((a) => a.id !== 'infraestructura');

  // Overall system summary stats (minimalist, clean)
  const totalSites = sites.length;
  const criticalSites = sites.filter((s) => s.status === 'critical').length;
  const warningSites = sites.filter((s) => s.status === 'warning').length;
  const normalSites = sites.filter((s) => s.status === 'normal').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hero Welcome / Executive Status Kicker */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-800/40">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
              Supervisión de Sitios Distribuidos
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Portal de Soporte Técnico
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl font-normal leading-relaxed">
            Consola centralizada para supervisión continua, topología de red y diagnóstico de
            infraestructura técnica distribuida en 7 sitios.
          </p>
        </div>

        {/* Global health badge */}
        <div className="flex items-center gap-3 glass-panel px-4 py-2.5 rounded-xl border border-slate-800 self-start md:self-auto">
          <div className="text-right">
            <div className="text-[11px] text-slate-400 uppercase font-mono">Disponibilidad Red</div>
            <div className="text-base font-bold text-slate-100 font-mono">99.78%</div>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50"></span>
            <span className="text-slate-300">
              {normalSites}/{totalSites} Operativos
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: SITIOS DISTRIBUIDOS (7 Site Cards) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Sitios Operativos ({sites.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-normal">
            Selecciona un sitio para acceder al desglose de infraestructura y áreas
          </span>
        </div>

        {/* Grid of 7 Sites */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sites.map((site) => {
            const isCritical = site.status === 'critical';
            const isWarning = site.status === 'warning';

            return (
              <div
                key={site.id}
                onClick={() => onSelectSite(site.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectSite(site.id);
                  }
                }}
                className={`group relative text-left p-5 rounded-xl transition-all duration-200 cursor-pointer glass-panel hover:glass-panel-elevated hover:scale-[1.01] hover:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
                  isCritical
                    ? 'border-rose-900/60 bg-rose-950/15 hover:border-rose-700/80'
                    : isWarning
                    ? 'border-amber-900/50 bg-amber-950/10 hover:border-amber-700/70'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Discrete availability glow line on top */}
                <div
                  className={`absolute top-0 left-4 right-4 h-[2px] rounded-full transition-colors ${
                    isCritical
                      ? 'bg-rose-500'
                      : isWarning
                      ? 'bg-amber-400'
                      : 'bg-cyan-500/40 group-hover:bg-cyan-400'
                  }`}
                />

                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-900/90 border border-slate-700/60 flex items-center justify-center text-slate-300 group-hover:text-cyan-400 transition-colors">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {site.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 tracking-tight">{site.location}</p>
                    </div>
                  </div>

                  <StatusBadge status={site.status} size="sm" />
                </div>

                {/* Subtitle / Description */}
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4 min-h-[36px]">
                  {site.description}
                </p>

                {/* Bottom Card Footer: Availability indicator + Navigation cue */}
                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">Disponibilidad</span>
                    <span
                      className={`font-semibold ${
                        isCritical
                          ? 'text-rose-400'
                          : isWarning
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {site.availability.toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 group-hover:text-cyan-400 transition-colors text-xs font-sans font-medium">
                    <span>Ingresar</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* Active incident badge if any */}
                {site.activeIncidentsCount > 0 && (
                  <div className="mt-2.5 px-2 py-1 rounded bg-rose-950/60 border border-rose-900/60 flex items-center justify-between text-[11px] text-rose-300 font-mono">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                      <span>{site.activeIncidentsCount} incidente activo</span>
                    </div>
                    <span className="text-[10px] text-rose-400 underline">Ver diagnóstico</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: NAVEGACIÓN GLOBAL POR ÁREAS FUNCIONALES */}
      <section className="space-y-4 pt-4 border-t border-slate-800/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Áreas Funcionales Globales (Consolidadas)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-normal">
            Supervisión transversal del mismo sector en todos los sitios donde está implementado
          </span>
        </div>

        {/* 3 Global Area Cards: Producción, CCTV, RRHH */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {globalNavAreas.map((area) => {
            // Find which sites implement this area
            const implementedSites = sites.filter((s) => s.implementedAreas.includes(area.id));
            const hasAlert = implementedSites.some(
              (s) => s.status === 'critical' || s.status === 'warning'
            );

            const getAreaIcon = () => {
              switch (area.id) {
                case 'produccion':
                  return <Cpu className="w-5 h-5 text-cyan-400" />;
                case 'cctv':
                  return <Camera className="w-5 h-5 text-cyan-400" />;
                case 'rrhh':
                  return <Users className="w-5 h-5 text-cyan-400" />;
                default:
                  return <Cpu className="w-5 h-5 text-cyan-400" />;
              }
            };

            return (
              <div
                key={area.id}
                onClick={() => onSelectGlobalArea(area.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectGlobalArea(area.id);
                  }
                }}
                className="group relative p-6 rounded-xl text-left glass-panel hover:glass-panel-elevated hover:border-cyan-500/50 hover:scale-[1.01] transition-all duration-200 cursor-pointer border border-slate-800/80 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-800/40 flex items-center justify-center group-hover:border-cyan-500/60 transition-colors">
                      {getAreaIcon()}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400 font-semibold">
                        Consolidado
                      </span>
                      <h3 className="text-lg font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {area.name} Global
                      </h3>
                    </div>
                  </div>

                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-4 min-h-[34px]">
                  {area.description}
                </p>

                {/* Coverage & Sitios implementados */}
                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                    <span className="text-slate-400">Implementado en:</span>
                    <span className="text-cyan-400 font-semibold">
                      {implementedSites.length} de {sites.length} sitios
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {hasAlert ? (
                      <span className="text-[11px] text-amber-400 font-mono">
                        Requiere atención
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-mono">
                        Estado normal
                      </span>
                    )}
                  </div>
                </div>

                {/* Subtle list of site pills */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {implementedSites.map((s) => (
                    <span
                      key={s.id}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/90 text-slate-300 border border-slate-800"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
