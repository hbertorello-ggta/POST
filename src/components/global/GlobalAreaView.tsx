import React from 'react';
import {
  Site,
  FunctionalArea,
  FunctionalAreaId,
  Device,
  SiteId,
} from '../../types/monitoring';
import { getGlobalAreaSummaries } from '../../utils/monitoringLogic';
import { StatusBadge } from '../common/StatusBadge';
import {
  ChevronRight,
  Cpu,
  Camera,
  Users,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowLeft,
  Server,
  Layers,
} from 'lucide-react';

interface GlobalAreaViewProps {
  areaId: FunctionalAreaId;
  sites: Site[];
  devices: Device[];
  functionalAreas: FunctionalArea[];
  onSelectSiteArea: (siteId: SiteId, areaId: FunctionalAreaId) => void;
  onBackToOverview: () => void;
}

export const GlobalAreaView: React.FC<GlobalAreaViewProps> = ({
  areaId,
  sites,
  devices,
  functionalAreas,
  onSelectSiteArea,
  onBackToOverview,
}) => {
  const currentArea = functionalAreas.find((a) => a.id === areaId);
  const areaSummaries = getGlobalAreaSummaries(sites, devices, areaId);

  const implementedSummaries = areaSummaries.filter((s) => s.isImplemented);
  const nonImplementedSummaries = areaSummaries.filter((s) => !s.isImplemented);

  const totalMonitoredDevices = implementedSummaries.reduce(
    (acc, s) => acc + s.totalDevices,
    0
  );

  const getAreaIcon = () => {
    switch (areaId) {
      case 'produccion':
        return <Cpu className="w-5 h-5 text-cyan-400" />;
      case 'cctv':
        return <Camera className="w-5 h-5 text-cyan-400" />;
      case 'rrhh':
        return <Users className="w-5 h-5 text-cyan-400" />;
      default:
        return <Layers className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header with Back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToOverview}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-colors"
            title="Volver a la pantalla principal"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-semibold">
                Navegación Global Consolidada
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-950/70 border border-cyan-800/50 flex items-center justify-center">
                {getAreaIcon()}
              </div>
              <span>{currentArea?.name} – Vista Corporativa</span>
            </h1>
          </div>
        </div>

        {/* Global Area Stats summary */}
        <div className="flex items-center gap-4 text-xs font-mono glass-panel px-4 py-2 rounded-xl border border-slate-800">
          <div>
            <div className="text-slate-400 text-[10px]">Sitios Activos</div>
            <div className="text-slate-200 font-bold">
              {implementedSummaries.length} / {sites.length}
            </div>
          </div>
          <div className="h-6 w-px bg-slate-800"></div>
          <div>
            <div className="text-slate-400 text-[10px]">Dispositivos Supervisados</div>
            <div className="text-cyan-400 font-bold">{totalMonitoredDevices}</div>
          </div>
        </div>
      </div>

      {/* Explanatory description */}
      <div className="p-4 rounded-xl glass-panel border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
        <p>
          Esta pantalla consolida el estado funcional de <strong>{currentArea?.name}</strong> en
          todos los sitios de la compañía. Al seleccionar un sitio, ingresarás al detalle de
          dispositivos locales de ese sector específico.
        </p>
      </div>

      {/* Grid of Implemented Sites for this Area */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 font-mono">
          Sitios con {currentArea?.name} Implementado ({implementedSummaries.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {implementedSummaries.map((summary) => {
            const isCritical = summary.status === 'critical';
            const isWarning = summary.status === 'warning';

            return (
              <div
                key={summary.siteId}
                onClick={() => onSelectSiteArea(summary.siteId, areaId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectSiteArea(summary.siteId, areaId);
                  }
                }}
                className={`group p-5 rounded-xl text-left glass-panel hover:glass-panel-elevated hover:scale-[1.01] hover:border-cyan-500/50 transition-all duration-200 cursor-pointer border ${
                  isCritical
                    ? 'border-rose-900/60 bg-rose-950/20'
                    : isWarning
                    ? 'border-amber-900/60 bg-amber-950/15'
                    : 'border-slate-800/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {summary.siteName}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Sector {currentArea?.name}
                    </p>
                  </div>
                  <StatusBadge status={summary.status} size="sm" />
                </div>

                {/* Device Breakdown Counters */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 mb-4 text-xs font-mono">
                  <div className="text-center">
                    <div className="text-emerald-400 font-bold text-sm">
                      {summary.normalCount}
                    </div>
                    <div className="text-[10px] text-slate-400">Normal</div>
                  </div>
                  <div className="text-center border-x border-slate-800">
                    <div className="text-amber-400 font-bold text-sm">
                      {summary.warningCount}
                    </div>
                    <div className="text-[10px] text-slate-400">Alerta</div>
                  </div>
                  <div className="text-center">
                    <div className="text-rose-400 font-bold text-sm">
                      {summary.criticalCount}
                    </div>
                    <div className="text-[10px] text-slate-400">Crítico</div>
                  </div>
                </div>

                {/* Bottom link & availability */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">
                    Disp: <strong className="text-slate-200">{summary.availability}%</strong>
                  </span>
                  <div className="flex items-center gap-1 text-cyan-400 group-hover:translate-x-0.5 transition-transform font-sans font-medium">
                    <span>Ver dispositivos locales</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Non-implemented sites section (if any) */}
      {nonImplementedSummaries.length > 0 && (
        <section className="space-y-3 pt-6 border-t border-slate-800/50">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Sitios sin {currentArea?.name} ({nonImplementedSummaries.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {nonImplementedSummaries.map((summary) => (
              <div
                key={summary.siteId}
                className="p-3.5 rounded-lg glass-panel border border-slate-800/40 text-xs flex items-center justify-between text-slate-400 opacity-60"
              >
                <span className="font-medium text-slate-300">{summary.siteName}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500">
                  No implementado
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
