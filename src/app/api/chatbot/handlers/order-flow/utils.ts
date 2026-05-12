const PLACEHOLDER_NAMES = [
    'nguyễn văn a', 'nguyen van a', 'nguyễn thị a', 'nguyen thi a',
    'nguyễn văn b', 'nguyen van b', 'nguyễn thị b', 'nguyen thi b',
    'anh a', 'chị a', 'chi a', 'anh b', 'chị b', 'chi b',
    'khách hàng', 'khach hang', 'customer', 'test', 'abc'
]
const PLACEHOLDER_PHONES = ['0912345678', '0123456789', '0987654321', '0909090909', '0900000000', '0111111111', '0999999999']

export function isPlaceholderGuestInfo(info: { name?: string; phone?: string; address?: string } | undefined): boolean {
    if (!info) return true
    const nameLower = (info.name || '').toLowerCase().trim()
    const phoneTrimmed = (info.phone || '').replace(/\s/g, '')
    if (PLACEHOLDER_NAMES.some(p => nameLower === p || nameLower.includes(p))) return true
    if (PLACEHOLDER_PHONES.includes(phoneTrimmed)) return true
    return false
}

export function sanitizeGuestInfo(info: { name?: string; phone?: string; address?: string } | undefined) {
    if (!info) return undefined
    if (isPlaceholderGuestInfo(info)) return undefined
    if (!info.name && !info.phone && !info.address) return undefined
    return { name: info.name || '', phone: info.phone || '', address: info.address || '' }
}

/**
 * Map Vietnamese colloquial product names to DB-searchable keywords
 */
export function extractProductKeywords(productName: string): string[] {
    const keywords: string[] = []
    const lower = productName.toLowerCase()

    if (lower.includes('cát tô') || lower.includes('cát xây tô')) keywords.push('cát xây dựng', 'cát')
    else if (lower.includes('cát san lấp') || lower.includes('cát vàng')) keywords.push('cát vàng', 'cát')
    else if (lower.includes('cát')) keywords.push('cát')

    if (lower.includes('insee')) keywords.push('INSEE')
    if (lower.includes('hà tiên')) keywords.push('Hà Tiên')
    if (lower.includes('xi măng') || lower.includes('ximang') || lower.includes('xi-măng')) keywords.push('xi măng')

    if (lower.includes('gạch ống') || lower.includes('gạch ong') || lower.includes('gach ong')) keywords.push('gạch ống', 'gạch')
    else if (lower.includes('gạch đỏ') || lower.includes('gạch đinh') || lower.includes('gach dinh')) keywords.push('gạch đinh', 'gạch đỏ', 'gạch')
    else if (lower.includes('gạch') || lower.includes('gach')) keywords.push('gạch')

    if (lower.includes('đá 1x2') || lower.includes('đá dăm') || lower.includes('da dam')) keywords.push('đá 1x2', 'đá')
    else if (lower.includes('đá mi') || lower.includes('đá mạt') || lower.includes('da mi')) keywords.push('đá mi', 'đá')
    else if (lower.includes('đá') || lower.includes('da ')) keywords.push('đá')

    if (lower.includes('thép') || lower.includes('sắt') || lower.includes('sat ') || lower.includes('thep')) keywords.push('thép')

    if (keywords.length === 0) {
        const words = productName.split(/\s+/).filter(w => w.length > 2)
        keywords.push(...(words.length > 0 ? words.slice(0, 2) : [productName]))
    }

    return keywords
}
