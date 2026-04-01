export interface UnitConversion {
  name: string;
  factor: number;
  label: string;
}

export const UNIT_CONVERSIONS: Record<string, UnitConversion[]> = {
  'viên': [
    { name: 'viên', factor: 1, label: 'Viên' },
    { name: 'thiên', factor: 1000, label: 'Thiên' },
    { name: 'vạn', factor: 10000, label: 'Vạn' },
  ],
  'kg': [
    { name: 'kg', factor: 1, label: 'Kg' },
    { name: 'tấn', factor: 1000, label: 'Tấn' },
    { name: 'tạ', factor: 100, label: 'Tạ' },
    { name: 'yến', factor: 10, label: 'Yến' },
  ],
  'm2': [
    { name: 'm2', factor: 1, label: 'M2' },
    { name: 'thùng', factor: 1.44, label: 'Thùng' }, // Default for some tiles, can be overridden by product specific data
  ],
  'bao': [
    { name: 'bao', factor: 1, label: 'Bao' },
    { name: 'tấn', factor: 20, label: 'Tấn' }, // 1 ton = 20 bags of 50kg
  ],
};

export function getAvailableUnits(baseUnit: string): UnitConversion[] {
  const normalizedBase = baseUnit.toLowerCase();
  return UNIT_CONVERSIONS[normalizedBase] || [{ name: normalizedBase, factor: 1, label: baseUnit }];
}

export function convertToBase(quantity: number, factor: number): number {
  return quantity * factor;
}

export function convertFromBase(baseQuantity: number, factor: number): number {
  return baseQuantity / factor;
}
