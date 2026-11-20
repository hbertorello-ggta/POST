/**
 * Types and interfaces for CMS Centro de Monitoreo de Sitios
 */

export type SiteId = 'avex' | 'cresta' | 'sarmiento' | 'pilar' | 'la_china' | 'uruguay' | 'capital';

export type FunctionalAreaId = 'infraestructura' | 'produccion' | 'cctv' | 'rrhh';

export type OperationalStatus = 'normal' | 'warning' | 'critical' | 'unknown';

export type DeviceCriticality = 'productive' | 'support';

export type DeviceType =
  | 'server'
  | 'esxi'
  | 'switch'
  | 'firewall'
  | 'router'
  | 'link'
  | 'ap'
  | 'storage'
  | 'scale'
  | 'datalogic'
  | 'ups'
  | 'dvx'
  | 'camera'
  | 'afip_camera'
  | 'pc'
  | 'clock'
  | 'turnstile'
  | 'prod_device';

export type MetricPeriod = '1h' | '6h' | '24h' | '7d' | '30d';

export interface Site {
  id: SiteId;
  name: string;
  fullName: string;
  location: string;
  status: OperationalStatus;
  availability: number; // e.g. 99.8
  lastUpdate: string;
  activeIncidentsCount: number;
  activeProductiveIncidents?: number;
  activeSupportAlerts?: number;
  implementedAreas: FunctionalAreaId[];
  description: string;
}

export interface FunctionalArea {
  id: FunctionalAreaId;
  name: string;
  code: string;
  description: string;
  iconName: string;
}

export interface DeviceCategory {
  id: string;
  areaId: FunctionalAreaId;
  name: string;
  deviceType: DeviceType;
  description: string;
}

export interface DeviceEvent {
  id: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  duration: string;
  status: 'active' | 'resolved';
  probableRootCauseId?: string;
  isProductive?: boolean;
}

export interface SwitchPort {
  id: number;
  name: string;
  status: 'up' | 'down' | 'disabled';
  speed: string; // '1 Gbps', '10 Gbps SFP+', '100 Mbps'
  vlan: number;
  vlanName: string;
  trafficInMbps: number;
  trafficOutMbps: number;
  errors: number;
  connectedDevice?: string;
  poeStatus?: 'active' | 'off';
}

export interface DeviceTelemetry {
  // Common
  pingLatencyMs?: number;
  packetLossPercent?: number;
  uptimeDays?: number;

  // Server / ESXi
  cpuUsagePercent?: number;
  ramUsagePercent?: number;
  storageUsagePercent?: number;
  storagePartitions?: { name: string; totalGb: number; usedGb: number }[];
  services?: { name: string; status: 'running' | 'stopped' | 'degraded'; critical: boolean }[];
  vmCount?: number;

  // Switch
  totalPorts?: number;
  activePortsCount?: number;
  ports?: SwitchPort[];
  snmpEnabled?: boolean;
  snmpVersion?: 'SNMPv2c' | 'SNMPv3' | 'ICMP Only';

  // UPS (APC)
  inputVoltage?: number; // e.g. 224 V
  outputVoltage?: number; // e.g. 220 V
  batteryCapacityPercent?: number; // e.g. 100%
  batteryRuntimeMinutes?: number; // e.g. 48 min
  loadPercent?: number; // e.g. 38%
  batteryTemperatureC?: number; // e.g. 24 C
  powerSource?: 'utility' | 'battery' | 'bypass';

  // Camera / AFIP Camera
  rtspStatus?: 'active' | 'dropped' | 'unstable';
  fps?: number;
  bitrateKbps?: number;
  resolution?: string;

  // Link
  provider?: string;
  bandwidthMbps?: number;
  jitterMs?: number;

  // Production / RRHH
  firmwareVersion?: string;
  readingsCount?: number;
  lastSync?: string;
}

export interface Device {
  id: string;
  name: string;
  siteId: SiteId;
  areaId: FunctionalAreaId;
  categoryId: string;
  type: DeviceType;
  ip: string;
  model: string;
  status: OperationalStatus;
  availability: number;
  lastSeen: string;
  telemetry: DeviceTelemetry;
  events: DeviceEvent[];
  criticality?: DeviceCriticality;
  isProductive?: boolean;
}

export interface TopologyNode {
  id: string;
  deviceId?: string;
  siteId: SiteId;
  label: string;
  sublabel: string;
  type: DeviceType;
  role: 'core' | 'distribution' | 'access' | 'server' | 'firewall' | 'router' | 'ap' | 'other';
  x: number;
  y: number;
  status: OperationalStatus;
  ip: string;
  portsTotal?: number;
  portsActive?: number;
  criticality?: DeviceCriticality;
  isProductive?: boolean;
}

export interface TopologyLink {
  id: string;
  siteId: SiteId;
  sourceNodeId: string;
  sourcePort: string;
  targetNodeId: string;
  targetPort: string;
  speed: string;
  status: OperationalStatus;
  trafficRxMbps: number;
  trafficTxMbps: number;
  errors: number;
  vlan: string;
  isManual: boolean;
  discoveryProtocol?: 'LLDP' | 'CDP' | 'Manual' | 'SNMP';
}

export interface IncidentCorrelation {
  id: string;
  siteId: SiteId;
  title: string;
  severity: 'critical' | 'warning';
  confidence: 'confirmed' | 'probable';
  rootCauseDeviceId: string;
  rootCauseDeviceName: string;
  rootCauseDescription: string;
  detectedAt: string;
  duration: string;
  affectedDevicesCount: number;
  affectedDeviceIds: string[];
  powerCorrelation: {
    isElectricalIssue: boolean;
    upsDeviceId: string;
    upsName: string;
    upsStatus: string;
    upsBatteryPercent: number;
    upsEstimatedRuntimeMin: number;
    diagnosisNote: string;
  };
}

export interface FloatingWindowItem {
  id: string;
  device: Device;
  period: MetricPeriod;
  x: number;
  y: number;
  minimized: boolean;
}
