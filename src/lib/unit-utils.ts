
/**
 * Utility to determine the correct unit for construction materials
 */
export function getUnitFromProductName(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('cát') || n.includes('đá') || n.includes('bê tông')) return 'm3';
    if (n.includes('thép') || n.includes('sắt') || n.includes('đinh') || n.includes('dây buộc')) return 'kg';
    if (n.includes('xi măng') || n.includes('bột trét') || n.includes('vữa')) return 'bao';
    if (n.includes('sơn') || n.includes('chống thấm') || n.includes('dầu')) {
        if (n.includes('18l') || n.includes('thùng')) return 'thùng';
        if (n.includes('5l') || n.includes('lon')) return 'lon';
        return 'lít';
    }
    if (n.includes('gạch')) {
        if (n.includes('ốp') || n.includes('lát')) return 'm2';
        return 'viên';
    }
    if (n.includes('tôn') || n.includes('ống') || n.includes('dây điện')) return 'm';
    if (n.includes('giàn giáo') || n.includes('xe rùa') || n.includes('máy')) return 'bộ';

    return 'pcs'; // Default
}
