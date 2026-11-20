import React from 'react';
import {
  Server,
  Network,
  Cpu,
  Shield,
  Wifi,
  HardDrive,
  Scale,
  Barcode,
  BatteryCharging,
  Video,
  Camera,
  Monitor,
  Clock,
  DoorClosed,
  Layers,
  Radio,
  Share2,
} from 'lucide-react';
import { DeviceType } from '../../types/monitoring';

interface DeviceIconProps {
  type: DeviceType;
  className?: string;
}

export const DeviceIcon: React.FC<DeviceIconProps> = ({ type, className = 'w-4 h-4' }) => {
  switch (type) {
    case 'esxi':
      return <Layers className={className} />;
    case 'server':
      return <Server className={className} />;
    case 'switch':
      return <Network className={className} />;
    case 'firewall':
      return <Shield className={className} />;
    case 'router':
      return <Share2 className={className} />;
    case 'link':
      return <Radio className={className} />;
    case 'ap':
      return <Wifi className={className} />;
    case 'storage':
      return <HardDrive className={className} />;
    case 'scale':
      return <Scale className={className} />;
    case 'datalogic':
      return <Barcode className={className} />;
    case 'ups':
      return <BatteryCharging className={className} />;
    case 'dvx':
      return <Video className={className} />;
    case 'camera':
      return <Camera className={className} />;
    case 'afip_camera':
      return <Camera className={`${className} text-cyan-400`} />;
    case 'pc':
      return <Monitor className={className} />;
    case 'clock':
      return <Clock className={className} />;
    case 'turnstile':
      return <DoorClosed className={className} />;
    case 'prod_device':
      return <Cpu className={className} />;
    default:
      return <Server className={className} />;
  }
};
