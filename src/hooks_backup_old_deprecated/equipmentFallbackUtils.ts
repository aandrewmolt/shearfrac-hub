
interface FallbackEquipmentType {
  id: string;
  name: string;
  category: 'cables' | 'gauges' | 'adapters' | 'communication' | 'power' | 'other';
  length: string;
  version?: string;
}

export const createFallbackEquipmentType = (typeId: string, label: string): FallbackEquipmentType => {
  const name = label.toLowerCase();
  let length = '200ft'; // default
  let category: 'cables' | 'gauges' | 'adapters' | 'communication' | 'power' | 'other' = 'cables';
  let version = undefined;
  
  if (name.includes('100ft')) length = '100ft';
  else if (name.includes('200ft')) length = '200ft';
  else if (name.includes('300ft')) {
    length = '300ft';
    if (name.includes('old') || name.includes('legacy')) {
      version = 'old (Y adapter only)';
    } else if (name.includes('new') || name.includes('direct')) {
      version = 'new (direct to wells)';
    }
  }
  
  if (name.includes('reel')) category = 'other';

  return {
    id: typeId,
    name: label,
    category,
    length,
    version,
  };
};
