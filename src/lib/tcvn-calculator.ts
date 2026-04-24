/**
 * TCVN Material Calculation Engine
 * Tính toán khối lượng vật liệu theo tiêu chuẩn Việt Nam
 * Chạy hoàn toàn Client-side (không cần server)
 */

export interface MaterialItem {
  name: string
  quantity: number
  unit: string
  category: string
  searchKeyword: string // Từ khoá để match với DB product
}

export interface BoQResult {
  elementName: string
  elementType: string
  dimensions: Record<string, number>
  materials: MaterialItem[]
  totalEstimate?: number
}

// ============================================
// ĐỊNH MỨC VẬT LIỆU THEO TCVN (mỗi 1m³ hoặc 1m²)
// ============================================

const TCVN_RATES = {
  // Xây tường 1m³ (gạch ống 4 lỗ 8x8x18)
  brick_wall: {
    'Gạch ống 4 lỗ': { qty: 115, unit: 'viên', keyword: 'gạch ống' },
    'Xi măng PCB40': { qty: 0.5, unit: 'bao', keyword: 'xi măng' },
    'Cát xây tô': { qty: 0.1, unit: 'm³', keyword: 'cát xây' },
    'Nước': { qty: 0.08, unit: 'm³', keyword: '' },
  },

  // Đổ bê tông sàn 1m³ (B20 - tỉ lệ 1:2:4)
  concrete_slab: {
    'Xi măng PCB40': { qty: 7.5, unit: 'bao', keyword: 'xi măng' },
    'Cát bê tông vàng': { qty: 0.5, unit: 'm³', keyword: 'cát bê tông' },
    'Đá 1x2': { qty: 0.8, unit: 'm³', keyword: 'đá 1x2' },
    'Thép CB300V Φ10': { qty: 100, unit: 'kg', keyword: 'thép' },
    'Nước': { qty: 0.2, unit: 'm³', keyword: '' },
  },

  // Trát tường 1m² (dày 1.5cm)
  plaster: {
    'Xi măng PCB30': { qty: 0.07, unit: 'bao', keyword: 'xi măng' },
    'Cát mịn': { qty: 0.012, unit: 'm³', keyword: 'cát xây' },
  },

  // Ốp lát gạch 1m²
  tile_floor: {
    'Gạch ceramic 60x60': { qty: 2.8, unit: 'viên', keyword: 'gạch ốp' },
    'Xi măng trắng': { qty: 0.25, unit: 'kg', keyword: 'xi măng' },
    'Keo dán gạch': { qty: 3.5, unit: 'kg', keyword: '' },
  },

  // Sơn tường 1m² (2 lớp)
  paint: {
    'Sơn nước nội thất': { qty: 0.25, unit: 'lít', keyword: 'sơn' },
    'Sơn lót kháng kiềm': { qty: 0.1, unit: 'lít', keyword: 'sơn lót' },
    'Bột trét tường': { qty: 0.8, unit: 'kg', keyword: '' },
  },

  // Mái tôn 1m²
  roof_ton: {
    'Tôn lạnh mạ kẽm': { qty: 1.1, unit: 'm', keyword: 'tôn' },
    'Xà gồ thép': { qty: 3.5, unit: 'kg', keyword: 'thép' },
    'Đinh vít mái': { qty: 8, unit: 'cái', keyword: '' },
  },
} as const

export type ElementType = keyof typeof TCVN_RATES

// Metadata gắn vào từng mesh trong mô hình 3D
export interface MeshMetadata {
  elementType: ElementType
  name: string
  // Dimensions (m)
  width?: number    // Chiều dài (m)
  height?: number   // Chiều cao (m)  
  depth?: number    // Chiều dày/dày (m)
  area?: number     // Diện tích m² (cho sàn, mái)
  volume?: number   // Thể tích m³ (tự tính nếu không có)
}

export function calculateBoQ(mesh: MeshMetadata): BoQResult {
  const rates = TCVN_RATES[mesh.elementType]
  if (!rates) {
    return {
      elementName: mesh.name,
      elementType: mesh.elementType,
      dimensions: {},
      materials: [],
    }
  }

  // Tính thể tích / diện tích
  let quantity = 0
  const dimensions: Record<string, number> = {}

  if (mesh.volume) {
    quantity = mesh.volume
    dimensions['Thể tích'] = mesh.volume
  } else if (mesh.area) {
    quantity = mesh.area
    dimensions['Diện tích'] = mesh.area
  } else if (mesh.width && mesh.height && mesh.depth) {
    quantity = mesh.width * mesh.height * mesh.depth
    dimensions['Dài'] = mesh.width
    dimensions['Cao'] = mesh.height
    dimensions['Dày'] = mesh.depth
  } else if (mesh.width && mesh.height) {
    quantity = mesh.width * mesh.height
    dimensions['Dài'] = mesh.width
    dimensions['Cao'] = mesh.height
  }

  const materials: MaterialItem[] = Object.entries(rates).map(([name, rate]) => ({
    name,
    quantity: Math.ceil(quantity * rate.qty * 100) / 100,
    unit: rate.unit,
    category: getCategoryFromType(mesh.elementType),
    searchKeyword: rate.keyword,
  }))

  return {
    elementName: mesh.name,
    elementType: mesh.elementType,
    dimensions,
    materials: materials.filter((m) => m.searchKeyword), // Lọc bỏ Nước
  }
}

function getCategoryFromType(type: ElementType): string {
  const map: Record<ElementType, string> = {
    brick_wall: 'Xây dựng thô',
    concrete_slab: 'Bê tông',
    plaster: 'Trát tô',
    tile_floor: 'Hoàn thiện',
    paint: 'Sơn bả',
    roof_ton: 'Mái che',
  }
  return map[type] || 'Khác'
}

// Tổng hợp nhiều phần tử thành 1 BoQ tổng
export function mergeBoQ(results: BoQResult[]): MaterialItem[] {
  const merged = new Map<string, MaterialItem>()

  for (const result of results) {
    for (const mat of result.materials) {
      const existing = merged.get(mat.name)
      if (existing) {
        existing.quantity = Math.ceil((existing.quantity + mat.quantity) * 100) / 100
      } else {
        merged.set(mat.name, { ...mat })
      }
    }
  }

  return Array.from(merged.values())
}
