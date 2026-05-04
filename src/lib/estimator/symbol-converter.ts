/**
 * Symbol Converter Algorithm
 * Converts drawing symbols and extracted features into material quantities.
 * This complements the area-based calculation in material-calculator.ts.
 */

export interface DrawingSymbol {
    type: 'door' | 'window' | 'column' | 'socket' | 'material_area' | 'other'
    count: number
    label?: string
    area?: number
    length?: number
    material?: 'tiles' | 'paint' | string
}

export interface SymbolMaterialQuantity {
    productName: string
    quantity: number
    unit: string
    reason: string
}

/**
 * Main algorithm to convert symbols to material quantities
 */
export function convertSymbolsToMaterials(symbols: DrawingSymbol[]): SymbolMaterialQuantity[] {
    const materials: SymbolMaterialQuantity[] = []

    symbols.forEach(symbol => {
        switch (symbol.type) {
            case 'door':
                // For each door, we need hinges, locks, and maybe paint/wood
                materials.push({
                    productName: `Bản lề cửa (${symbol.label || 'Cửa'})`,
                    quantity: symbol.count * 3, // 3 hinges per door
                    unit: 'bộ',
                    reason: `Mỗi bộ cửa ${symbol.label || ''} yêu cầu 3 bộ bản lề`
                })
                materials.push({
                    productName: `Khóa cửa/Tay nắm`,
                    quantity: symbol.count,
                    unit: 'bộ',
                    reason: `Lắp đặt khóa cho ${symbol.count} bộ cửa`
                })
                break

            case 'window':
                materials.push({
                    productName: `Phụ kiện cửa sổ (Chốt/Bản lề)`,
                    quantity: symbol.count * 2,
                    unit: 'bộ',
                    reason: `Phụ kiện cho ${symbol.count} cửa sổ`
                })
                break

            case 'column':
                // Columns need reinforced steel and high-grade concrete
                // Assuming standard column 20x20cm, 3.5m height
                const colVol = symbol.count * (0.2 * 0.2 * 3.5)
                materials.push({
                    productName: 'Bê tông thương phẩm mác 300 (Cột)',
                    quantity: Number(colVol.toFixed(2)),
                    unit: 'm³',
                    reason: `Đổ bê tông cho ${symbol.count} cột kết cấu`
                })
                materials.push({
                    productName: 'Thép thanh D16/D18 (Cốt thép cột)',
                    quantity: Number((symbol.count * 0.045).toFixed(2)), // ~45kg per column
                    unit: 'tấn',
                    reason: `Cốt thép chịu lực cho hệ thống cột`
                })
                break

            case 'socket':
                materials.push({
                    productName: 'Đế âm đơn/đôi (Điện)',
                    quantity: symbol.count,
                    unit: 'cái',
                    reason: `Đế âm cho ${symbol.count} vị trí ổ cắm/công tắc`
                })
                materials.push({
                    productName: 'Dây điện đơn CV 2.5',
                    quantity: symbol.count * 5, // ~5m per socket
                    unit: 'm',
                    reason: `Dây nguồn cho hệ thống điện`
                })
                break

            case 'material_area':
                if (symbol.material === 'tiles' && symbol.area) {
                    materials.push({
                        productName: 'Gạch trang trí/Gạch nhấn',
                        quantity: Math.ceil(symbol.area * 1.05),
                        unit: 'm²',
                        reason: `Diện tích gạch trang trí theo ký hiệu ${symbol.label || ''}`
                    })
                }
                break
        }
    })

    return materials
}
