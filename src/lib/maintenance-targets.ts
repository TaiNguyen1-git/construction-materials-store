
// Danh sách Trang và Tính năng để Chọn trong Admin (User-friendly)
// Key = Code (lưu vào DB), Value = { label, path, roles }

export const MAINTENANCE_TARGETS = {
    // ============== TOÀN HỆ THỐNG ==============
    'GLOBAL': {
        label: '🌐 Toàn bộ hệ thống',
        path: '/',
        roles: ['ALL'],
        group: 'Hệ thống'
    },

    // ============== TRANG CÔNG KHAI (GUEST/CUSTOMER) ==============
    'PAGE_MARKET': {
        label: '🛒 Cửa hàng (Market)',
        path: '/market',
        roles: ['GUEST', 'CUSTOMER', 'CONTRACTOR'],
        group: 'Trang Công khai'
    },
    'PAGE_PRODUCTS': {
        label: '📦 Danh mục sản phẩm',
        path: '/products',
        roles: ['GUEST', 'CUSTOMER', 'CONTRACTOR'],
        group: 'Trang Công khai'
    },
    'PAGE_CART': {
        label: '🛒 Giỏ hàng',
        path: '/cart',
        roles: ['CUSTOMER', 'CONTRACTOR'],
        group: 'Trang Công khai'
    },
    'PAGE_CHECKOUT': {
        label: '💳 Thanh toán',
        path: '/checkout',
        roles: ['CUSTOMER', 'CONTRACTOR'],
        group: 'Trang Công khai'
    },

    // ============== TRANG KHÁCH HÀNG (CUSTOMER) ==============
    'PAGE_ORDERS': {
        label: '📋 Đơn hàng của tôi',
        path: '/orders',
        roles: ['CUSTOMER'],
        group: 'Khách hàng'
    },
    'PAGE_PROFILE': {
        label: '👤 Trang cá nhân',
        path: '/profile',
        roles: ['CUSTOMER', 'CONTRACTOR'],
        group: 'Khách hàng'
    },

    // ============== TRANG NHÀ THẦU (CONTRACTOR) ==============
    'PAGE_CONTRACTOR_DASHBOARD': {
        label: '📊 Dashboard Nhà thầu',
        path: '/contractor',
        roles: ['CONTRACTOR'],
        group: 'Nhà thầu'
    },
    'PAGE_CONTRACTOR_PROJECTS': {
        label: '🏗️ Quản lý Dự án',
        path: '/contractor/projects',
        roles: ['CONTRACTOR'],
        group: 'Nhà thầu'
    },
    'PAGE_CONTRACTOR_QUOTES': {
        label: '📝 Báo giá & Hợp đồng',
        path: '/contractor/quotes',
        roles: ['CONTRACTOR'],
        group: 'Nhà thầu'
    },
    'PAGE_CONTRACTOR_BILLING': {
        label: '💰 Công nợ & Thanh toán',
        path: '/contractor/billing',
        roles: ['CONTRACTOR'],
        group: 'Nhà thầu'
    },
    'PAGE_CONTRACTOR_REPORTS': {
        label: '📈 Báo cáo tiến độ',
        path: '/contractor/reports',
        roles: ['CONTRACTOR'],
        group: 'Nhà thầu'
    },

    // ============== TRANG QUẢN TRỊ (ADMIN/MANAGER) ==============
    'PAGE_ADMIN': {
        label: '⚙️ Trang Quản trị',
        path: '/admin',
        roles: ['MANAGER', 'EMPLOYEE'],
        group: 'Quản trị viên'
    },
    'PAGE_ADMIN_ORDERS': {
        label: '📦 Quản lý Đơn hàng',
        path: '/admin/orders',
        roles: ['MANAGER', 'EMPLOYEE'],
        group: 'Quản trị viên'
    },
    'PAGE_ADMIN_INVENTORY': {
        label: '🏭 Quản lý Kho',
        path: '/admin/inventory',
        roles: ['MANAGER', 'EMPLOYEE'],
        group: 'Quản trị viên'
    },
    'PAGE_ADMIN_CUSTOMERS': {
        label: '👥 Quản lý Khách hàng',
        path: '/admin/customers',
        roles: ['MANAGER'],
        group: 'Quản trị viên'
    },

    // ============== TÍNH NĂNG (FEATURES) ==============
    'FEATURE_CHATBOT': {
        label: '🤖 Trợ lý AI (Chatbot)',
        path: 'feature:chatbot',
        roles: ['ALL'],
        group: 'Tính năng'
    },
    'FEATURE_ESTIMATE': {
        label: '📐 Dự toán vật liệu',
        path: 'feature:estimate',
        roles: ['CUSTOMER', 'CONTRACTOR'],
        group: 'Tính năng'
    },
    'FEATURE_SEARCH': {
        label: '🔍 Tìm kiếm sản phẩm',
        path: 'feature:search',
        roles: ['ALL'],
        group: 'Tính năng'
    },
    'FEATURE_PAYMENT_ONLINE': {
        label: '💳 Thanh toán trực tuyến (VNPay/QR)',
        path: 'feature:payment',
        roles: ['CUSTOMER', 'CONTRACTOR'],
        group: 'Tính năng'
    },
    'FEATURE_NOTIFICATION': {
        label: '🔔 Thông báo realtime',
        path: 'feature:notification',
        roles: ['ALL'],
        group: 'Tính năng'
    },
    'FEATURE_WORKER_REPORT': {
        label: '📸 Báo cáo công nhân',
        path: 'feature:worker-report',
        roles: ['CONTRACTOR'],
        group: 'Tính năng'
    },
}

// Helper: Get grouped options for dropdown
export function getGroupedTargets() {
    const groups: Record<string, { key: string; label: string; path: string }[]> = {}

    Object.entries(MAINTENANCE_TARGETS).forEach(([key, value]) => {
        if (!groups[value.group]) {
            groups[value.group] = []
        }
        groups[value.group].push({ key, label: value.label, path: value.path })
    })

    return groups
}

// Helper: Get label by key
export function getTargetLabel(key: string): string {
    return (MAINTENANCE_TARGETS as any)[key]?.label || key
}

// Helper: Get path by key
export function getTargetPath(key: string): string {
    return (MAINTENANCE_TARGETS as any)[key]?.path || key
}

// Helper: Get roles by key
export function getTargetRoles(key: string): string[] {
    return (MAINTENANCE_TARGETS as any)[key]?.roles || ['ALL']
}
