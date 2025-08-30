
export interface CableUsageDetails {
  quantity: number;
  typeName: string;
  category: string;
  length: string;
  version?: string;
}

export interface DetailedEquipmentUsage {
  cables: { [typeId: string]: CableUsageDetails };
  gauges: number; // For backward compatibility - total of all gauges
  gauges1502: number; // 1502 pressure gauges
  pencilGauges: number; // Pencil gauges
  adapters: number;
  computers: number;
  satellite: number;
  shearstreamBoxes: number; // ShearStream boxes (main boxes)
  directConnections: number;
  totalConnections: number;
}
