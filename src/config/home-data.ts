export const TOP_SEARCHES = [
    { name: 'Sắt thép Hòa Phát', tag: 'Bán chạy' },
    { name: 'Xi măng Hà Tiên PCB40', tag: 'Dự án' },
    { name: 'Gạch ốp lát Prime', tag: 'Nổi bật' },
    { name: 'Sơn Dulux nội thất', tag: 'Khuyến mãi' }
];

export const PARTNERS = [
    { name: 'Hòa Phát', logo: 'https://www.hoaphat.com.vn/assets/images/logo.png', color: 'bg-blue-50', text: 'text-blue-700' },
    { name: 'Hoa Sen', logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/e/e0/Logo_T%E1%BA%ADp_%C4%91o%C3%A0n_Hoa_Sen.svg/512px-Logo_T%E1%BA%ADp_%C4%91o%C3%A0n_Hoa_Sen.svg.png', color: 'bg-red-50', text: 'text-red-700' },
    { name: 'Viglacera', logo: 'https://viglacera.com.vn/themes/viglacera/images/logo.png', color: 'bg-blue-50', text: 'text-blue-800' },
    { name: 'Dulux', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Dulux_logo.svg/512px-Dulux_logo.svg.png', color: 'bg-blue-50', text: 'text-indigo-600' },
    { name: 'Inax', logo: 'https://www.inax.com.vn/images/logo.png', color: 'bg-blue-50', text: 'text-slate-800' },
    { name: 'Vicem Hà Tiên', logo: '', color: 'bg-orange-50', text: 'text-orange-700' },
    { name: 'Pomina', logo: '', color: 'bg-rose-50', text: 'text-rose-700' },
    { name: 'SCG Build', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/SCG_Logo.svg/512px-SCG_Logo.svg.png', color: 'bg-red-50', text: 'text-red-600' },
    { name: 'Prime Group', logo: 'https://prime.vn/Images/logo.png', color: 'bg-orange-50', text: 'text-orange-600' },
    { name: 'Tôn Đông Á', logo: 'https://www.tondonga.com.vn/vnt_upload/weblink/logo_tda_2.png', color: 'bg-sky-50', text: 'text-sky-600' }
];

export const LOCATIONS = ['Toàn quốc', 'Hồ Chí Minh', 'Hà Nội', 'Đồng Nai', 'Bình Dương', 'Long An'];

export const FALLBACK_PRODUCTS: Record<string, { name: string, price: string, unit: string }[]> = {
    'cát': [
        { name: 'Cát xây tô loại 1', price: '250.000₫/m3', unit: 'm3' },
        { name: 'Cát bê tông vàng', price: '380.000₫/m3', unit: 'm3' },
        { name: 'Cát san lấp', price: '180.000₫/m3', unit: 'm3' }
    ],
    'gạch': [
        { name: 'Gạch ống 4 lỗ (8x8x18)', price: '1.250₫/viên', unit: 'viên' },
        { name: 'Gạch thẻ xây dựng', price: '1.100₫/viên', unit: 'viên' },
        { name: 'Gạch block 190', price: '9.500₫/viên', unit: 'viên' }
    ],
    'xi măng': [
        { name: 'Xi măng Hà Tiên PCB40', price: '89.000₫/bao', unit: 'bao' },
        { name: 'Xi măng Insee Đa Dụng', price: '94.000₫/bao', unit: 'bao' },
        { name: 'Xi măng Holcim', price: '92.000₫/bao', unit: 'bao' }
    ],
    'thép': [
        { name: 'Thép Pomina CB300V', price: '15.800₫/kg', unit: 'kg' },
        { name: 'Thép Hòa Phát CB400V', price: '16.500₫/kg', unit: 'kg' },
        { name: 'Thép Miền Nam', price: '16.200₫/kg', unit: 'kg' }
    ],
    'sơn': [
        { name: 'Sơn nước Dulux nội thất 18L', price: '2.450.000₫', unit: 'thùng' },
        { name: 'Sơn Jotun Essence 17L', price: '1.850.000₫', unit: 'thùng' },
        { name: 'Sơn Nippon Vatex', price: '850.000₫', unit: 'thùng' }
    ],
    'tôn': [
        { name: 'Tôn lạnh mạ kẽm (0.45mm)', price: '115.000₫/m', unit: 'm' },
        { name: 'Tôn màu Đông Á', price: '125.000₫/m', unit: 'm' },
        { name: 'Tôn cách nhiệt Hoa Sen', price: '165.000₫/m', unit: 'm' }
    ],
    'đá': [
        { name: 'Đá 1x2 xanh Biên Hòa', price: '450.000₫/m3', unit: 'm3' },
        { name: 'Đá 4x6 đen', price: '380.000₫/m3', unit: 'm3' },
        { name: 'Đá mi sàng', price: '290.000₫/m3', unit: 'm3' }
    ]
};

export const FALLBACK_SUB_CATEGORIES: Record<string, string[]> = {
    'xi măng': ['Xi măng PCB30', 'Xi măng PCB40', 'Bê tông tươi', 'Bê tông nhựa', 'Phụ gia bê tông', 'Xi măng trắng'],
    'thép': ['Thép cuộn', 'Thép thanh vằn', 'Thép hình V/U/I', 'Thép tấm', 'Lưới thép B40', 'Dây thép buộc'],
    'gạch': ['Gạch ống 4 lỗ', 'Gạch thẻ', 'Cát xây tô', 'Cát bê tông vàng', 'Đá 1x2 xanh', 'Đá chẻ', 'Gạch block'],
    'sơn': ['Sơn nội thất', 'Sơn ngoại thất', 'Sơn lót kháng kiềm', 'Chống thấm sàn KOVA', 'Sika Latex', 'Bột trét tường'],
    'điện': ['Ống nhựa Tiền Phong', 'Dây điện Cadivi', 'Thiết bị vệ sinh Inax', 'Đèn LED âm trần', 'Bồn nước Tân Á', 'Máy bơm nước'],
    'nội thất': ['Gạch ốp lát 60x60', 'Sàn gỗ công nghiệp', 'Trần thạch cao Vĩnh Tường', 'Cửa nhôm Xingfa', 'Đá hoa cương Marble'],
    'công cụ': ['Máy khoan bê tông', 'Máy cắt sắt', 'Máy trộn bê tông 250L', 'Giàn giáo nêm', 'Xe rùa HK', 'Thước laser'],
    'cát': ['Cát xây tô', 'Cát bê tông', 'Cát san lấp'],
    'tôn': ['Tôn lạnh', 'Tôn màu', 'Tôn kẽm'],
    'đá': ['Đá 1x2', 'Đá 4x6', 'Đá mi']
};

export const DEFAULT_BANNERS = [
    {
        image: '/images/banner_1.png',
        tag: 'HOT DEAL',
        title: 'Hệ Thống Phân Phối Toàn Quốc',
        sub: 'Cung cấp vật liệu xây dựng chính hãng từ các nhà máy sản xuất lớn nhất Việt Nam.'
    },
    {
        image: '/images/banner_2.png',
        tag: 'UY TÍN',
        title: 'Ưu Đãi Đặc Biệt Mùa Xây Dựng 2026',
        sub: 'Chiết khấu lên đến 20% cho các đơn hàng thép và xi măng dự án quy mô lớn.'
    },
    {
        image: '/images/banner_3.png',
        tag: 'CÔNG NGHỆ',
        title: 'Giải Pháp Cung Ứng Dự Án Với AI',
        sub: 'Tối ưu hóa ngân sách và thời gian cung ứng với hệ thống dự toán thông minh của chúng tôi.'
    }
];
