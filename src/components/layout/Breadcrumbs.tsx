import React from 'react';
import { ChevronRight, Home, Building2, Layers, Cpu, Server } from 'lucide-react';
import { Site, FunctionalArea, DeviceCategory, Device } from '../../types/costi';

interface BreadcrumbsProps {
  currentSite?: Site;
  currentArea?: FunctionalArea;
  currentCategory?: DeviceCategory;
  currentDevice?: Device;
  isGlobalAreaView?: boolean;
  isTopologyView?: boolean;
  onNavigateHome: () => void;
  onNavigateSite?: (siteId: string) => void;
  onNavigateArea?: (areaId: string) => void;
  onNavigateCategory?: (categoryId: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  currentSite,
  currentArea,
  currentCategory,
  currentDevice,
  isGlobalAreaView,
  isTopologyView,
  onNavigateHome,
  onNavigateSite,
  onNavigateArea,
  onNavigateCategory,
}) => {
  return (
    <nav className="w-full bg-slate-950/40 border-b border-slate-800/50 py-2.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 text-xs text-slate-400 overflow-x-auto whitespace-nowrap scrollbar-none">
        {/* Home / Overview */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-1 hover:text-cyan-400 transition-colors shrink-0 text-slate-300 font-medium"
        >
          <Home className="w-3.5 h-3.5 text-cyan-400" />
          <span>Overview</span>
        </button>

        {/* Global Area View indicator */}
        {isGlobalAreaView && currentArea && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="flex items-center gap-1 text-cyan-300 font-semibold shrink-0">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentArea.name} (Consolidado Global)</span>
            </span>
          </>
        )}

        {/* Site Segment */}
        {!isGlobalAreaView && currentSite && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <button
              onClick={() => onNavigateSite && onNavigateSite(currentSite.id)}
              className={`flex items-center gap-1 hover:text-cyan-400 transition-colors shrink-0 font-medium ${
                !currentArea && !isTopologyView && !currentDevice ? 'text-cyan-300 font-semibold' : 'text-slate-300'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentSite.name}</span>
            </button>
          </>
        )}

        {/* Topology View indicator */}
        {isTopologyView && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="flex items-center gap-1 text-cyan-300 font-semibold shrink-0">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Topología de Red & Switches</span>
            </span>
          </>
        )}

        {/* Functional Area Segment */}
        {!isGlobalAreaView && !isTopologyView && currentArea && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <button
              onClick={() => onNavigateArea && onNavigateArea(currentArea.id)}
              className={`flex items-center gap-1 hover:text-cyan-400 transition-colors shrink-0 ${
                !currentCategory && !currentDevice ? 'text-cyan-300 font-semibold' : 'text-slate-300'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentArea.name}</span>
            </button>
          </>
        )}

        {/* Category Segment */}
        {currentCategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <button
              onClick={() => onNavigateCategory && onNavigateCategory(currentCategory.id)}
              className={`hover:text-cyan-400 transition-colors shrink-0 ${
                !currentDevice ? 'text-cyan-300 font-semibold' : 'text-slate-300'
              }`}
            >
              <span>{currentCategory.name}</span>
            </button>
          </>
        )}

        {/* Specific Device Segment */}
        {currentDevice && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="flex items-center gap-1 text-cyan-300 font-mono font-semibold shrink-0">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentDevice.name}</span>
            </span>
          </>
        )}
      </div>
    </nav>
  );
};
