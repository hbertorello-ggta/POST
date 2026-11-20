import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { viewVariants } from './lib/motion';
import {
  SiteId,
  FunctionalAreaId,
  Device,
  FloatingWindowItem,
  MetricPeriod,
} from './types/monitoring';
import {
  SITES,
  FUNCTIONAL_AREAS,
  CATEGORIES,
  DEVICES,
  PILAR_TOPOLOGY_NODES,
  PILAR_TOPOLOGY_LINKS,
  ACTIVE_INCIDENTS,
} from './data/mockData';
import { Navbar } from './components/layout/Navbar';
import { Breadcrumbs } from './components/layout/Breadcrumbs';
import { OverviewView } from './components/overview/OverviewView';
import { SiteDetailView } from './components/site/SiteDetailView';
import { GlobalAreaView } from './components/global/GlobalAreaView';
import { NetworkTopologyView } from './components/topology/NetworkTopologyView';
import { DeviceDetailModal } from './components/device/DeviceDetailModal';
import { IncidentCorrelationDrawer } from './components/incident/IncidentCorrelationDrawer';
import { FloatingWindowManager } from './components/floating/FloatingWindowManager';
import { sound } from './lib/audio';

type ViewMode = 'overview' | 'site_detail' | 'global_area' | 'topology';

export default function App() {
  // Navigation & View state
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedSiteId, setSelectedSiteId] = useState<SiteId>('pilar');
  const [selectedAreaId, setSelectedAreaId] = useState<FunctionalAreaId>('infraestructura');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);

  // Active user profile ('soporte' | 'admin')
  const [currentProfile, setCurrentProfile] = useState<'soporte' | 'admin'>('soporte');

  // Business Rules & UX Modes
  const [isGuardMode, setIsGuardMode] = useState<boolean>(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(sound.isEnabled());

  // Modal & Drawer states
  const [selectedDeviceForModal, setSelectedDeviceForModal] = useState<Device | null>(null);
  const [isIncidentsDrawerOpen, setIsIncidentsDrawerOpen] = useState(false);

  // Floating Windows state
  const [floatingWindows, setFloatingWindows] = useState<FloatingWindowItem[]>([]);

  // Count active productive incidents vs support alerts
  const productiveCount = ACTIVE_INCIDENTS.filter((i) => i.severity === 'critical').length;
  const supportAlertsCount = ACTIVE_INCIDENTS.filter((i) => i.severity === 'warning').length;

  // Sound alert on initial mount if there are active productive incidents
  useEffect(() => {
    if (productiveCount > 0 && isSoundEnabled) {
      const timer = setTimeout(() => {
        sound.playCriticalAlarm();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [productiveCount, isSoundEnabled]);

  // Find current active objects
  const currentSite = SITES.find((s) => s.id === selectedSiteId);
  const currentArea = FUNCTIONAL_AREAS.find((a) => a.id === selectedAreaId);
  const currentCategory = CATEGORIES.find((c) => c.id === selectedCategoryId);

  // Handlers for Navigation
  const handleNavigateHome = () => {
    sound.playClick();
    setViewMode('overview');
    setSelectedCategoryId(undefined);
  };

  const handleSelectSite = (siteId: string) => {
    sound.playClick();
    const validSiteId = siteId as SiteId;
    setSelectedSiteId(validSiteId);
    const siteObj = SITES.find((s) => s.id === validSiteId);
    if (siteObj && !siteObj.implementedAreas.includes(selectedAreaId)) {
      setSelectedAreaId(siteObj.implementedAreas[0] || 'infraestructura');
    }
    setViewMode('site_detail');
    setSelectedCategoryId(undefined);
  };

  const handleSelectGlobalArea = (areaId: FunctionalAreaId) => {
    sound.playClick();
    setSelectedAreaId(areaId);
    setViewMode('global_area');
    setSelectedCategoryId(undefined);
  };

  const handleSelectSiteArea = (siteId: SiteId, areaId: FunctionalAreaId) => {
    sound.playClick();
    setSelectedSiteId(siteId);
    setSelectedAreaId(areaId);
    setViewMode('site_detail');
    setSelectedCategoryId(undefined);
  };

  const handleOpenTopology = () => {
    sound.playClick();
    setViewMode('topology');
  };

  // Device Detail Handlers
  const handleOpenDeviceDetail = (device: Device) => {
    sound.playClick();
    setSelectedDeviceForModal(device);
  };

  const handleCloseDeviceDetail = () => {
    setSelectedDeviceForModal(null);
  };

  // Floating Window Management Handlers
  const handlePinFloatingWindow = (device: Device) => {
    sound.playClick();
    if (floatingWindows.some((w) => w.device.id === device.id)) {
      setFloatingWindows((prev) =>
        prev.map((w) => (w.device.id === device.id ? { ...w, minimized: false } : w))
      );
      return;
    }

    const newWindow: FloatingWindowItem = {
      id: `win-${device.id}-${Date.now()}`,
      device,
      period: '24h',
      x: 80 + (floatingWindows.length % 5) * 40,
      y: 120 + (floatingWindows.length % 5) * 40,
      minimized: false,
    };

    setFloatingWindows((prev) => [...prev, newWindow]);
  };

  const handleCloseFloatingWindow = (id: string) => {
    setFloatingWindows((prev) => prev.filter((w) => w.id !== id));
  };

  const handleToggleMinimizeFloatingWindow = (id: string) => {
    setFloatingWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, minimized: !w.minimized } : w))
    );
  };

  const handleToggleSound = () => {
    const newState = sound.toggle();
    setIsSoundEnabled(newState);
  };

  const handleToggleGuardMode = () => {
    const next = !isGuardMode;
    setIsGuardMode(next);
    if (next) {
      sound.playWarningBeep();
      document.documentElement.setAttribute('data-mode', 'guard');
    } else {
      sound.playClick();
      document.documentElement.removeAttribute('data-mode');
    }
  };

  // Direccion de la transicion: entrar a un nivel mas profundo = zoom in, volver = zoom out.
  const VIEW_DEPTH: Record<string, number> = { overview: 0, global_area: 1, site_detail: 1, topology: 2 };
  const depth = VIEW_DEPTH[viewMode] ?? 0;
  const prevDepth = useRef(depth);
  const direction = depth >= prevDepth.current ? 1 : -1;
  useEffect(() => { prevDepth.current = depth; }, [depth]);
  const viewKey =
    viewMode === 'site_detail' || viewMode === 'topology'
      ? `${viewMode}-${selectedSiteId}`
      : viewMode === 'global_area'
      ? `global_area-${selectedAreaId}`
      : viewMode;

  // Filter sites if Guard Mode is active
  const displayedSites = isGuardMode
    ? SITES.filter((s) => s.status === 'critical' || s.status === 'warning')
    : SITES;

  return (
    <div className={`min-h-screen flex flex-col font-sans text-slate-100 ${isGuardMode ? 'bg-[#06080d]' : 'bg-[#080c14]'}`}>
      {/* Primary Top Header Navigation */}
      <Navbar
        currentProfile={currentProfile}
        onToggleProfile={setCurrentProfile}
        activeIncidentsCount={ACTIVE_INCIDENTS.length}
        activeProductiveCount={productiveCount}
        activeSupportCount={supportAlertsCount}
        onOpenIncidents={() => {
          sound.playClick();
          setIsIncidentsDrawerOpen(true);
        }}
        floatingWindowsCount={floatingWindows.length}
        onNavigateHome={handleNavigateHome}
        devices={DEVICES}
        sites={SITES}
        onSelectDevice={handleOpenDeviceDetail}
        onSelectSite={handleSelectSite}
        isGuardMode={isGuardMode}
        onToggleGuardMode={handleToggleGuardMode}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Breadcrumb Navigation Trail */}
      <Breadcrumbs
        currentSite={currentSite}
        currentArea={currentArea}
        currentCategory={currentCategory}
        isGlobalAreaView={viewMode === 'global_area'}
        isTopologyView={viewMode === 'topology'}
        onNavigateHome={handleNavigateHome}
        onNavigateSite={handleSelectSite}
        onNavigateArea={(areaId: string) => {
          setSelectedAreaId(areaId as FunctionalAreaId);
          setSelectedCategoryId(undefined);
        }}
      />

      {/* Guard Mode Alert Banner */}
      {isGuardMode && (
        <div className="bg-red-950/70 border-b border-red-700/60 px-4 py-2.5 text-center text-xs font-mono text-red-200 flex items-center justify-center gap-3">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          <span>
            <strong>MODO GUARDIA ACTIVO:</strong> Filtrando únicamente equipos e incidentes que detienen la producción fabril.
          </span>
          <button
            onClick={handleToggleGuardMode}
            className="underline text-red-300 hover:text-white font-semibold ml-2"
          >
            Desactivar modo guardia
          </button>
        </div>
      )}

      {/* Main Dynamic Viewport */}
      <main className="flex-1 pb-16">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={viewKey}
            custom={direction}
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
        {viewMode === 'overview' && (
          <OverviewView
            sites={displayedSites}
            functionalAreas={FUNCTIONAL_AREAS}
            onSelectSite={handleSelectSite}
            onSelectGlobalArea={handleSelectGlobalArea}
          />
        )}

        {viewMode === 'site_detail' && currentSite && (
          <SiteDetailView
            site={currentSite}
            allFunctionalAreas={FUNCTIONAL_AREAS}
            categories={CATEGORIES}
            devices={DEVICES}
            initialAreaId={selectedAreaId}
            onBackToOverview={handleNavigateHome}
            onSelectDevice={handleOpenDeviceDetail}
            onOpenTopology={handleOpenTopology}
            onPinFloatingWindow={handlePinFloatingWindow}
            currentProfile={currentProfile}
          />
        )}

        {viewMode === 'global_area' && currentArea && (
          <GlobalAreaView
            areaId={selectedAreaId}
            sites={SITES}
            devices={DEVICES}
            functionalAreas={FUNCTIONAL_AREAS}
            onBackToOverview={handleNavigateHome}
            onSelectSiteArea={handleSelectSiteArea}
          />
        )}

        {viewMode === 'topology' && currentSite && (
          <NetworkTopologyView
            site={currentSite}
            initialNodes={PILAR_TOPOLOGY_NODES}
            initialLinks={PILAR_TOPOLOGY_LINKS}
            allSiteDevices={DEVICES.filter((d) => d.siteId === selectedSiteId)}
            onSelectDevice={handleOpenDeviceDetail}
            onBackToSite={() => setViewMode('site_detail')}
            currentProfile={currentProfile}
          />
        )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modal: Device Complete Technical Diagnostics */}
      <AnimatePresence>
      {selectedDeviceForModal && (
        <DeviceDetailModal
          key="device-modal"
          device={selectedDeviceForModal}
          onClose={handleCloseDeviceDetail}
          onPinFloatingWindow={handlePinFloatingWindow}
          onOpenTopology={handleOpenTopology}
        />
      )}
      </AnimatePresence>

      {/* Drawer: Incident Correlation, Root Cause & Power/UPS Assessment */}
      <IncidentCorrelationDrawer
        isOpen={isIncidentsDrawerOpen}
        onClose={() => setIsIncidentsDrawerOpen(false)}
        incidents={ACTIVE_INCIDENTS}
        sites={SITES}
        devices={DEVICES}
        onSelectDevice={handleOpenDeviceDetail}
        onSelectSite={handleSelectSite}
      />

      {/* Floating Draggable Diagnostic Windows Layer */}
      <FloatingWindowManager
        windows={floatingWindows}
        onCloseWindow={handleCloseFloatingWindow}
        onToggleMinimize={handleToggleMinimizeFloatingWindow}
        onUpdatePosition={(id: string, x: number, y: number) => {
          setFloatingWindows((prev) =>
            prev.map((w) => (w.id === id ? { ...w, x, y } : w))
          );
        }}
        onUpdatePeriod={(id: string, period: MetricPeriod) => {
          setFloatingWindows((prev) =>
            prev.map((w) => (w.id === id ? { ...w, period } : w))
          );
        }}
        onOpenDeviceDetail={handleOpenDeviceDetail}
      />
    </div>
  );
}
