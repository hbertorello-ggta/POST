/**
 * Pure logic and calculations for POST
 * Decoupled from React UI for easy unit testing.
 */

import {
  Device,
  Site,
  SiteId,
  FunctionalAreaId,
  OperationalStatus,
  MetricPeriod,
  TopologyNode,
  TopologyLink,
  IncidentCorrelation,
} from '../types/monitoring';

export interface AreaSummaryForSite {
  siteId: SiteId;
  siteName: string;
  isImplemented: boolean;
  status: OperationalStatus;
  totalDevices: number;
  normalCount: number;
  warningCount: number;
  criticalCount: number;
  availability: number;
}

export interface PowerCorrelationAssessment {
  isPowerCutLikely: boolean;
  verdict: 'electrical_outage_dismissed' | 'electrical_outage_confirmed' | 'unknown';
  summary: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Filter devices by site, functional area, and optional category or search term
 */
export function filterDevices(
  devices: Device[],
  siteId?: SiteId,
  areaId?: FunctionalAreaId,
  categoryId?: string,
  searchQuery?: string
): Device[] {
  return devices.filter((dev) => {
    if (siteId && dev.siteId !== siteId) return false;
    if (areaId && dev.areaId !== areaId) return false;
    if (categoryId && dev.categoryId !== categoryId) return false;
    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = dev.name.toLowerCase().includes(q);
      const matchIp = dev.ip.toLowerCase().includes(q);
      const matchModel = dev.model.toLowerCase().includes(q);
      if (!matchName && !matchIp && !matchModel) return false;
    }
    return true;
  });
}

/**
 * Calculate the consolidated summary of a functional area across all sites
 */
export function getGlobalAreaSummaries(
  sites: Site[],
  devices: Device[],
  areaId: FunctionalAreaId
): AreaSummaryForSite[] {
  return sites.map((site) => {
    const isImplemented = site.implementedAreas.includes(areaId);
    if (!isImplemented) {
      return {
        siteId: site.id,
        siteName: site.name,
        isImplemented: false,
        status: 'unknown',
        totalDevices: 0,
        normalCount: 0,
        warningCount: 0,
        criticalCount: 0,
        availability: 0,
      };
    }

    const siteAreaDevices = devices.filter(
      (d) => d.siteId === site.id && d.areaId === areaId
    );

    const normalCount = siteAreaDevices.filter((d) => d.status === 'normal').length;
    const warningCount = siteAreaDevices.filter((d) => d.status === 'warning').length;
    const criticalCount = siteAreaDevices.filter((d) => d.status === 'critical').length;

    let status: OperationalStatus = 'normal';
    if (criticalCount > 0) status = 'critical';
    else if (warningCount > 0) status = 'warning';

    const avgAvailability =
      siteAreaDevices.length > 0
        ? Number(
            (
              siteAreaDevices.reduce((acc, d) => acc + d.availability, 0) /
              siteAreaDevices.length
            ).toFixed(2)
          )
        : 100;

    return {
      siteId: site.id,
      siteName: site.name,
      isImplemented: true,
      status,
      totalDevices: siteAreaDevices.length,
      normalCount,
      warningCount,
      criticalCount,
      availability: avgAvailability,
    };
  });
}

/**
 * Assesses root cause correlation comparing device drop with UPS telemetry
 */
export function assessPowerCorrelation(
  incident: IncidentCorrelation,
  upsDevice?: Device
): PowerCorrelationAssessment {
  if (!upsDevice || upsDevice.type !== 'ups') {
    return {
      isPowerCutLikely: false,
      verdict: 'unknown',
      summary: 'Sin telemetría SNMP de UPS asociada para corroborar el suministro eléctrico.',
      confidence: 'low',
    };
  }

  const { inputVoltage, batteryCapacityPercent, powerSource } = upsDevice.telemetry;

  // If UPS has normal utility voltage (>200V) and battery is >80%, power is nominal
  if (
    inputVoltage &&
    inputVoltage > 200 &&
    batteryCapacityPercent &&
    batteryCapacityPercent > 80 &&
    powerSource !== 'battery'
  ) {
    return {
      isPowerCutLikely: false,
      verdict: 'electrical_outage_dismissed',
      summary: `La UPS (${upsDevice.name}) recibe ${inputVoltage}V AC normales con batería al ${batteryCapacityPercent}%. Se DESCARTA corte general de energía; la falla se concentra en conectividad de red/hardware.`,
      confidence: 'high',
    };
  }

  if (powerSource === 'battery' || (inputVoltage !== undefined && inputVoltage < 180)) {
    return {
      isPowerCutLikely: true,
      verdict: 'electrical_outage_confirmed',
      summary: `ALERTA: La UPS opera en modo Batería (${inputVoltage || 0}V red). Posible corte de suministro eléctrico en la planta.`,
      confidence: 'high',
    };
  }

  return {
    isPowerCutLikely: false,
    verdict: 'unknown',
    summary: 'Datos de telemetría de UPS inconclusos o en bypass.',
    confidence: 'medium',
  };
}

/**
 * Computes topological graph statistics
 */
export function computeTopologyStats(nodes: TopologyNode[], links: TopologyLink[]) {
  const totalNodes = nodes.length;
  const criticalNodes = nodes.filter((n) => n.status === 'critical').length;
  const warningNodes = nodes.filter((n) => n.status === 'warning').length;
  const normalNodes = nodes.filter((n) => n.status === 'normal').length;

  const totalLinks = links.length;
  const manualLinks = links.filter((l) => l.isManual).length;
  const autoLinks = totalLinks - manualLinks;
  const degradedLinks = links.filter((l) => l.status === 'critical' || l.status === 'warning').length;

  return {
    totalNodes,
    criticalNodes,
    warningNodes,
    normalNodes,
    totalLinks,
    manualLinks,
    autoLinks,
    degradedLinks,
  };
}

/**
 * Generate coherent time-series points based on device type and period
 */
export function generateTimeSeriesMetrics(
  deviceType: string,
  period: MetricPeriod,
  baseValue: number = 30
) {
  const pointsCount = period === '1h' ? 12 : period === '6h' ? 18 : period === '24h' ? 24 : 30;
  const labels: string[] = [];
  const data: Array<{ time: string; value: number; secondary?: number; baseline?: number }> = [];

  for (let i = pointsCount - 1; i >= 0; i--) {
    let timeLabel = '';
    if (period === '1h') timeLabel = `${i * 5}m atrás`;
    else if (period === '6h') timeLabel = `${i * 20}m atrás`;
    else if (period === '24h') timeLabel = `${i}h atrás`;
    else if (period === '7d') timeLabel = `Día -${Math.ceil(i / 4)}`;
    else timeLabel = `Día -${i}`;

    labels.push(timeLabel);

    // Realistic jitter around base value
    const noise = Math.sin(i * 0.7) * 8 + (Math.random() * 6 - 3);
    const val = Math.max(2, Math.min(99, Math.round(baseValue + noise)));
    const secVal = Math.max(1, Math.min(99, Math.round(baseValue * 0.6 + noise * 0.8)));

    data.push({
      time: timeLabel,
      value: val,
      secondary: secVal,
      baseline: baseValue,
    });
  }

  return data;
}
