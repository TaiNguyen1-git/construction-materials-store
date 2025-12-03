// Knowledge Base for Construction Materials
// Dữ liệu chuyên sâu về vật liệu xây dựng mà cửa hàng bán

export interface ProductKnowledge {
  id: string
  category: string
  name: string
  brand?: string
  supplier?: string
  description: string
  specifications: {
    [key: string]: string | number
  }
  pricing: {
    basePrice: number
    unit: string
    bulkDiscount?: {
      minQuantity: number
      discountPercent: number
    }[]
  }
  usage: string[]
  quality: string
  commonCombinations: string[]
  tips: string[]
  warnings?: string[]
  alternatives?: string[]
}

export const KNOWLEDGE_BASE: ProductKnowledge[] = [
  // ========================================
  // XI MĂNG
  // ========================================
  {
    id: 'cement_insee_pc40',
    category: 'Xi măng',
    name: 'Xi măng INSEE PC40',
    brand: 'INSEE',
    supplier: 'INSEE Việt Nam',
    description: 'Xi măng Portland hỗn hợp PCB40 của INSEE, chất lượng cao, độ bền tốt, phù hợp cho các công trình dân dụng và công nghiệp.',
    specifications: {
      strength: 'PC40 (Mác 400)',
      weight: '50kg',
      standard: 'TCVN 2682:2009',
      settingTime: '45-60 phút',
      color: 'Xám'
    },
    pricing: {
      basePrice: 135000,
      unit: 'bao 50kg',
      bulkDiscount: [
        { minQuantity: 50, discountPercent: 3 },
        { minQuantity: 100, discountPercent: 5 },
        { minQuantity: 300, discountPercent: 8 }
      ]
    },
    usage: [
      'Xây móng (bê tông mác 200-250)',
      'Đổ cột, dầm, sàn chịu lực',
      'Xây tường chịu lực',
      'Công trình cần độ bền cao'
    ],
    quality: 'Cao cấp - Thương hiệu uy tín số 1 Thái Lan tại Việt Nam',
    commonCombinations: [
      'Cát xây dựng loại I',
      'Đá 1x2',
      'Thép D10-D16',
      'Phụ gia giảm nước'
    ],
    tips: [
      'Tỷ lệ trộn bê tông M200: 1 Xi măng : 2.19 Cát : 3.76 Đá : 0.62 Nước',
      '1 bao xi măng 50kg trộn được khoảng 0.18m³ bê tông M200',
      'Bảo quản nơi khô ráo, tránh ẩm',
      'Sử dụng trong vòng 30 ngày sau khi mua'
    ],
    warnings: [
      'Không pha loãng quá nhiều nước',
      'Đảm bảo tỷ lệ cát/đá chính xác',
      'Rung đầm kỹ khi đổ bê tông'
    ],
    alternatives: ['Xi măng INSEE PC30', 'Xi măng Hà Tiên PCB40']
  },
  {
    id: 'cement_insee_pc30',
    category: 'Xi măng',
    name: 'Xi măng INSEE PC30',
    brand: 'INSEE',
    supplier: 'INSEE Việt Nam',
    description: 'Xi măng Portland PC30 của INSEE, phù hợp cho xây tô, vữa trát, các công trình dân dụng thông thường.',
    specifications: {
      strength: 'PC30 (Mác 300)',
      weight: '50kg',
      standard: 'TCVN 2682:2009',
      settingTime: '45-60 phút',
      color: 'Xám'
    },
    pricing: {
      basePrice: 120000,
      unit: 'bao 50kg',
      bulkDiscount: [
        { minQuantity: 50, discountPercent: 3 },
        { minQuantity: 100, discountPercent: 5 },
        { minQuantity: 300, discountPercent: 8 }
      ]
    },
    usage: [
      'Xây tường gạch',
      'Trát tường, trát trần',
      'Đổ mái lợp',
      'Vữa lót nền'
    ],
    quality: 'Tiêu chuẩn - Phù hợp công trình dân dụng',
    commonCombinations: [
      'Cát vàng',
      'Gạch 4 lỗ',
      'Gạch ống',
      'Gạch đinh'
    ],
    tips: [
      'Tỷ lệ vữa xây: 1 Xi măng : 4-5 Cát',
      'Tỷ lệ vữa trát: 1 Xi măng : 3 Cát',
      '1 bao xi măng xây được khoảng 60-70 viên gạch',
      'Ngâm nước gạch trước khi xây'
    ],
    alternatives: ['Xi măng Hà Tiên PC30']
  },
  {
    id: 'cement_hatien_pcb40',
    category: 'Xi măng',
    name: 'Xi măng Hà Tiên PCB40',
    brand: 'Hà Tiên',
    supplier: 'Xi măng Hà Tiên',
    description: 'Xi măng Portland hỗn hợp PCB40 của Hà Tiên, thương hiệu Việt Nam uy tín, giá cạnh tranh.',
    specifications: {
      strength: 'PCB40 (Mác 400)',
      weight: '50kg',
      standard: 'TCVN 2682:2009',
      settingTime: '45-60 phút',
      color: 'Xám nhạt'
    },
    pricing: {
      basePrice: 125000,
      unit: 'bao 50kg',
      bulkDiscount: [
        { minQuantity: 50, discountPercent: 3 },
        { minQuantity: 100, discountPercent: 5 },
        { minQuantity: 300, discountPercent: 7 }
      ]
    },
    usage: [
      'Xây móng (bê tông mác 200-250)',
      'Đổ cột, dầm, sàn',
      'Công trình dân dụng và công nghiệp',
      'Xây tường chịu lực'
    ],
    quality: 'Cao - Thương hiệu Việt Nam uy tín, giá tốt hơn INSEE',
    commonCombinations: [
      'Cát xây dựng',
      'Đá 1x2',
      'Thép xây dựng',
      'Phụ gia'
    ],
    tips: [
      'Chất lượng tương đương INSEE, giá rẻ hơn 5-10%',
      'Phù hợp cho khách hàng cần tối ưu chi phí',
      'Tỷ lệ trộn tương tự INSEE PC40'
    ],
    alternatives: ['Xi măng INSEE PC40']
  },
  {
    id: 'cement_hatien_pc30',
    category: 'Xi măng',
    name: 'Xi măng Hà Tiên PC30',
    brand: 'Hà Tiên',
    supplier: 'Xi măng Hà Tiên',
    description: 'Xi măng Portland PC30 của Hà Tiên, dùng cho xây tô, giá thành hợp lý.',
    specifications: {
      strength: 'PC30 (Mác 300)',
      weight: '50kg',
      standard: 'TCVN 2682:2009',
      settingTime: '45-60 phút',
      color: 'Xám nhạt'
    },
    pricing: {
      basePrice: 110000,
      unit: 'bao 50kg',
      bulkDiscount: [
        { minQuantity: 50, discountPercent: 3 },
        { minQuantity: 100, discountPercent: 5 },
        { minQuantity: 300, discountPercent: 7 }
      ]
    },
    usage: [
      'Xây tường gạch',
      'Trát tường',
      'Vữa lót',
      'Công trình dân dụng thông thường'
    ],
    quality: 'Tiêu chuẩn - Giá rẻ nhất trong các loại xi măng',
    commonCombinations: [
      'Cát vàng',
      'Gạch các loại'
    ],
    tips: [
      'Lựa chọn tốt nhất cho tối ưu chi phí',
      'Chất lượng ổn định, đủ tiêu chuẩn'
    ],
    alternatives: ['Xi măng INSEE PC30']
  },

  // ========================================
  // GẠCH
  // ========================================
  {
    id: 'brick_dinh_standard',
    category: 'Gạch',
    name: 'Gạch Đinh 8x8x18cm',
    supplier: 'Tùy nhà cung cấp',
    description: 'Gạch đinh (gạch 4 lỗ) kích thước 8x8x18cm, dùng phổ biến cho xây tường ngăn, tường bao, không chịu lực.',
    specifications: {
      size: '8cm x 8cm x 18cm',
      holes: 4,
      weight: '1.3kg/viên',
      strength: 'Mác 50',
      waterAbsorption: '<15%'
    },
    pricing: {
      basePrice: 2200,
      unit: 'viên',
      bulkDiscount: [
        { minQuantity: 1000, discountPercent: 3 },
        { minQuantity: 5000, discountPercent: 5 },
        { minQuantity: 10000, discountPercent: 8 }
      ]
    },
    usage: [
      'Xây tường ngăn phòng',
      'Xây tường bao',
      'Xây tường không chịu lực',
      'Công trình dân dụng'
    ],
    quality: 'Phụ thuộc nhà cung cấp - Có 3 cấp: Loại 1 (tốt nhất), Loại 2 (trung bình), Loại 3 (giá rẻ)',
    commonCombinations: [
      'Xi măng PC30',
      'Cát vàng',
      'Vữa trát'
    ],
    tips: [
      'Tính toán: 65 viên/m² tường dày 100mm',
      'Cộng thêm 3-5% hao hụt',
      'Ngâm nước 30 phút trước khi xây',
      'Kiểm tra độ cong vênh, rạn nứt trước khi mua',
      'Xếp không quá 10 viên để tránh vỡ'
    ],
    warnings: [
      'Gạch loại 3 dễ vỡ, không nên dùng cho công trình quan trọng',
      'Kiểm tra kích thước trước khi xây (sai số ±2mm)'
    ],
    alternatives: ['Gạch ống', 'Gạch block nhẹ']
  },
  {
    id: 'brick_ong_standard',
    category: 'Gạch',
    name: 'Gạch Ống đỏ 6x10x20cm',
    supplier: 'Tùy nhà cung cấp',
    description: 'Gạch ống đỏ truyền thống, có lỗ rỗng bên trong, thông thoáng, cách nhiệt tốt.',
    specifications: {
      size: '6cm x 10cm x 20cm',
      type: 'Ống rỗng',
      weight: '1.5kg/viên',
      strength: 'Mác 50-75',
      color: 'Đỏ gạch'
    },
    pricing: {
      basePrice: 2800,
      unit: 'viên',
      bulkDiscount: [
        { minQuantity: 1000, discountPercent: 3 },
        { minQuantity: 5000, discountPercent: 5 }
      ]
    },
    usage: [
      'Xây tường bao kiên cố',
      'Xây tường nhà',
      'Xây cột',
      'Công trình cần cách nhiệt'
    ],
    quality: 'Phụ thuộc nhà cung cấp - Gạch càng đỏ, nung kỹ càng bền',
    commonCombinations: [
      'Xi măng PC30-PC40',
      'Cát xây dựng',
      'Vữa trát'
    ],
    tips: [
      'Tính toán: 55-60 viên/m² tường dày 100mm',
      'Ngâm nước 1-2 giờ trước khi xây',
      'Gạch nung kỹ có tiếng kêu leng keng khi gõ',
      'Màu đỏ đều, không có vết đen là gạch tốt'
    ],
    warnings: [
      'Gạch nung non (màu vàng) dễ hút nước, không bền',
      'Gạch sứt mẻ cạnh nhiều không nên dùng'
    ],
    alternatives: ['Gạch đinh', 'Gạch block']
  },

  // ========================================
  // ĐÁ
  // ========================================
  {
    id: 'stone_1x2',
    category: 'Đá',
    name: 'Đá 1x2 (Đá xây dựng)',
    supplier: 'Tùy nhà cung cấp',
    description: 'Đá dăm cỡ 1x2 (10-20mm), dùng để trộn bê tông cho móng, cột, dầm, sàn.',
    specifications: {
      size: '10-20mm',
      type: 'Đá dăm',
      density: '1.4-1.5 tấn/m³',
      strength: 'Cao'
    },
    pricing: {
      basePrice: 420000,
      unit: 'm³',
      bulkDiscount: [
        { minQuantity: 10, discountPercent: 3 },
        { minQuantity: 30, discountPercent: 5 }
      ]
    },
    usage: [
      'Trộn bê tông móng (M150-M250)',
      'Trộn bê tông cột, dầm, sàn',
      'Đổ nền nhà xưởng',
      'Làm đường'
    ],
    quality: 'Phụ thuộc nguồn gốc - Đá núi tốt hơn đá sông',
    commonCombinations: [
      'Xi măng PC40/PCB40',
      'Cát xây dựng loại I',
      'Nước sạch'
    ],
    tips: [
      'Tỷ lệ bê tông M200: 1 Xi măng : 2.19 Cát : 3.76 Đá 1x2',
      '1m³ bê tông cần khoảng 0.8m³ đá 1x2 (sau đầm)',
      'Đá phải sạch, không lẫn đất, bụi',
      'Phun nước trước khi trộn để giảm hút nước'
    ],
    warnings: [
      'Đá quá nhiều đất sẽ giảm độ bền bê tông',
      'Đá không đều, quá to/nhỏ ảnh hưởng chất lượng'
    ],
    alternatives: ['Đá 4x6 (công trình lớn hơn)']
  },
  {
    id: 'stone_mi',
    category: 'Đá',
    name: 'Đá mi (Đá 5-7mm)',
    supplier: 'Tùy nhà cung cấp',
    description: 'Đá dăm cỡ nhỏ 5-7mm, dùng trộn bê tông mác thấp, vữa lót nền, lót đường.',
    specifications: {
      size: '5-7mm',
      type: 'Đá dăm nhỏ',
      density: '1.4-1.5 tấn/m³',
      strength: 'Trung bình'
    },
    pricing: {
      basePrice: 380000,
      unit: 'm³',
      bulkDiscount: [
        { minQuantity: 10, discountPercent: 3 },
        { minQuantity: 30, discountPercent: 5 }
      ]
    },
    usage: [
      'Trộn bê tông mác thấp (M100-M150)',
      'Vữa lót nền',
      'Lót đường giao thông',
      'San lấp mặt bằng'
    ],
    quality: 'Phụ thuộc nhà cung cấp - Cần sạch, không lẫn cát',
    commonCombinations: [
      'Xi măng PC30',
      'Cát',
      'Nước'
    ],
    tips: [
      'Rẻ hơn đá 1x2 khoảng 10%',
      'Phù hợp cho lót nền, vỉa hè',
      'Không nên dùng cho kết cấu chịu lực cao'
    ],
    alternatives: ['Đá 1x2 (cho công trình chịu lực cao hơn)']
  },

  // ========================================
  // CÁT
  // ========================================
  {
    id: 'sand_construction',
    category: 'Cát',
    name: 'Cát xây dựng loại I',
    supplier: 'Tùy nhà cung cấp',
    description: 'Cát xây dựng sạch, hạt to đều, dùng để trộn bê tông móng, cột, dầm, sàn.',
    specifications: {
      type: 'Cát hạt to',
      size: '0.5-5mm',
      cleanness: 'Cao (ít bùn đất)',
      moisture: '3-5%'
    },
    pricing: {
      basePrice: 380000,
      unit: 'm³',
      bulkDiscount: [
        { minQuantity: 10, discountPercent: 3 },
        { minQuantity: 30, discountPercent: 5 }
      ]
    },
    usage: [
      'Trộn bê tông móng, cột, dầm, sàn',
      'Vữa xây gạch',
      'Vữa trát'
    ],
    quality: 'Phụ thuộc nguồn gốc - Cát sông sạch hơn cát biển (không mặn)',
    commonCombinations: [
      'Xi măng các loại',
      'Đá 1x2',
      'Nước sạch'
    ],
    tips: [
      'Kiểm tra độ sạch: Bỏ 1 nắm cát vào chai nước, lắc mạnh, nếu nước vẫn trong là cát tốt',
      'Cát hạt to, sạch, không mùi là cát tốt',
      'Tránh cát biển (mặn) làm gỉ thép'
    ],
    warnings: [
      'Cát nhiều bùn làm giảm độ bền bê tông',
      'Cát biển cần rửa mặn mới dùng được'
    ],
    alternatives: ['Cát vàng (cho vữa xây, trát)']
  },
  {
    id: 'sand_yellow',
    category: 'Cát',
    name: 'Cát vàng',
    supplier: 'Tùy nhà cung cấp',
    description: 'Cát vàng hạt mịn, dùng để xây gạch, trát tường, hoàn thiện.',
    specifications: {
      type: 'Cát hạt mịn',
      size: '0.2-2mm',
      color: 'Vàng nhạt',
      cleanness: 'Trung bình'
    },
    pricing: {
      basePrice: 320000,
      unit: 'm³',
      bulkDiscount: [
        { minQuantity: 10, discountPercent: 3 },
        { minQuantity: 30, discountPercent: 5 }
      ]
    },
    usage: [
      'Vữa xây gạch',
      'Vữa trát tường',
      'Vữa lót nền',
      'Hoàn thiện'
    ],
    quality: 'Phụ thuộc nhà cung cấp - Cát càng mịn, màu vàng đều càng tốt',
    commonCombinations: [
      'Xi măng PC30',
      'Gạch các loại',
      'Bột trét'
    ],
    tips: [
      'Rẻ hơn cát xây dựng 15-20%',
      'Không dùng để trộn bê tông kết cấu',
      'Phù hợp cho xây tô hoàn thiện'
    ],
    alternatives: ['Cát xây dựng (cho bê tông)']
  },

  // ========================================
  // TƯ VẤN XÂY DỰNG (KIẾN THỨC CHUNG)
  // ========================================
  {
    id: 'guide_home_building',
    category: 'Tư vấn',
    name: 'Quy trình xây nhà cơ bản',
    supplier: 'Kiến thức xây dựng',
    description: 'Hướng dẫn quy trình xây nhà từ móng đến hoàn thiện và lựa chọn vật liệu phù hợp.',
    specifications: {
      type: 'Hướng dẫn',
      scope: 'Nhà phố, Biệt thự',
      steps: 'Móng -> Khung -> Xây tô -> Hoàn thiện'
    },
    pricing: {
      basePrice: 0,
      unit: 'lượt tư vấn'
    },
    usage: [
      'Tư vấn xây nhà mới',
      'Lập kế hoạch mua vật liệu',
      'Dự toán chi phí'
    ],
    quality: 'Chuẩn xây dựng Việt Nam',
    commonCombinations: [
      'Xi măng',
      'Thép',
      'Gạch',
      'Cát',
      'Đá'
    ],
    tips: [
      'Móng: Dùng Xi măng PC40/PCB40, Thép D10-D20, Đá 1x2, Cát vàng',
      'Xây tường: Dùng Gạch ống/Gạch đinh, Xi măng PC30, Cát mịn',
      'Hoàn thiện: Dùng Bột trét, Sơn nước, Gạch ốp lát',
      'Nên mua vật liệu theo từng giai đoạn để tránh hao hụt và bảo quản tốt hơn'
    ],
    warnings: [
      'Không dùng cát nhiễm mặn cho bê tông',
      'Bảo dưỡng bê tông (tưới nước) ít nhất 7 ngày sau khi đổ',
      'Chọn xi măng đúng mục đích (PC40 cho móng, PC30 cho xây tô)'
    ]
  },
  // ========================================
  // CHÍNH SÁCH & DỊCH VỤ
  // ========================================
  {
    id: 'policy_payment',
    category: 'Chính sách',
    name: 'Chính sách thanh toán',
    brand: 'Store Policy',
    description: 'Các phương thức thanh toán được chấp nhận tại cửa hàng.',
    specifications: {
      methods: 'Tiền mặt, Chuyển khoản, COD',
      banking: 'Vietcombank - 1234567890 - NGUYEN VAN A',
      deposit: 'Cọc 30% cho đơn hàng lớn'
    },
    pricing: {
      basePrice: 0,
      unit: 'lần'
    },
    usage: [
      'Thanh toán khi nhận hàng (COD)',
      'Chuyển khoản ngân hàng',
      'Thanh toán trực tiếp tại cửa hàng'
    ],
    quality: 'An toàn - Nhanh chóng',
    commonCombinations: [],
    tips: [
      'Nội dung chuyển khoản: [Mã đơn hàng] - [Số điện thoại]',
      'Giữ lại biên lai chuyển khoản để đối chiếu'
    ]
  },
  {
    id: 'service_consulting',
    category: 'Dịch vụ',
    name: 'Dịch vụ tư vấn xây dựng',
    brand: 'Store Service',
    description: 'Dịch vụ tư vấn kỹ thuật và lựa chọn vật liệu xây dựng miễn phí.',
    specifications: {
      scope: 'Tư vấn vật liệu, Dự toán chi phí, Hướng dẫn thi công',
      cost: 'Miễn phí',
      support: '24/7 qua Chatbot'
    },
    pricing: {
      basePrice: 0,
      unit: 'lần'
    },
    usage: [
      'Tư vấn chọn xi măng, sắt thép phù hợp',
      'Tính toán khối lượng vật tư',
      'Giải đáp thắc mắc kỹ thuật'
    ],
    quality: 'Chuyên nghiệp - Tận tâm',
    commonCombinations: ['Quy trình xây nhà cơ bản'],
    tips: [
      'Cung cấp diện tích và quy mô công trình để được tư vấn chính xác nhất',
      'Liên hệ hotline nếu cần tư vấn trực tiếp tại công trình'
    ]
  },
  {
    id: 'policy_shipping',
    category: 'Chính sách',
    name: 'Chính sách giao hàng',
    brand: 'Store Policy',
    description: 'Thông tin về phí vận chuyển và thời gian giao hàng.',
    specifications: {
      freeShip: 'Đơn hàng > 5 triệu hoặc < 5km',
      fee: '30k-50k nội thành, tính theo km ngoại thành',
      time: 'Trong ngày (nội thành), 1-2 ngày (ngoại thành)'
    },
    pricing: { basePrice: 0, unit: 'lần' },
    usage: ['Giao hàng tận nơi', 'Giao hàng hỏa tốc'],
    quality: 'Nhanh chóng - Đảm bảo',
    commonCombinations: [],
    tips: ['Đặt hàng trước 10h sáng để được giao trong ngày', 'Kiểm tra hàng kỹ trước khi nhận']
  },
  {
    id: 'policy_return',
    category: 'Chính sách',
    name: 'Chính sách đổi trả',
    brand: 'Store Policy',
    description: 'Quy định về việc đổi trả hàng hóa.',
    specifications: {
      window: '3 ngày kể từ khi nhận hàng',
      condition: 'Hàng còn nguyên vẹn, chưa sử dụng, bao bì không rách',
      refund: 'Hoàn tiền 100% hoặc đổi sản phẩm tương đương'
    },
    pricing: { basePrice: 0, unit: 'lần' },
    usage: ['Đổi hàng lỗi', 'Trả hàng dư'],
    quality: 'Linh hoạt',
    commonCombinations: [],
    tips: ['Giữ lại hóa đơn để được hỗ trợ đổi trả nhanh nhất', 'Hàng đặt riêng không được đổi trả']
  },
  {
    id: 'policy_warranty',
    category: 'Chính sách',
    name: 'Chính sách bảo hành',
    brand: 'Store Policy',
    description: 'Thông tin bảo hành cho các sản phẩm.',
    specifications: {
      steel: 'Bảo hành rỉ sét theo tiêu chuẩn nhà sản xuất',
      equipment: 'Bảo hành 6-12 tháng tùy loại',
      cement: 'Bảo hành chất lượng (đông kết) trong hạn sử dụng'
    },
    pricing: { basePrice: 0, unit: 'lần' },
    usage: ['Bảo hành sản phẩm lỗi', 'Hỗ trợ kỹ thuật'],
    quality: 'Uy tín',
    commonCombinations: [],
    tips: ['Liên hệ hotline ngay khi phát hiện sản phẩm lỗi', 'Không bảo hành lỗi do bảo quản sai cách']
  }
]

// Helper functions to search knowledge base
export function searchByCategory(category: string): ProductKnowledge[] {
  return KNOWLEDGE_BASE.filter(item =>
    item.category.toLowerCase() === category.toLowerCase()
  )
}

export function searchByBrand(brand: string): ProductKnowledge[] {
  return KNOWLEDGE_BASE.filter(item =>
    item.brand?.toLowerCase().includes(brand.toLowerCase())
  )
}

export function searchByName(name: string): ProductKnowledge[] {
  return KNOWLEDGE_BASE.filter(item =>
    item.name.toLowerCase().includes(name.toLowerCase())
  )
}

export function searchByUsage(usage: string): ProductKnowledge[] {
  return KNOWLEDGE_BASE.filter(item =>
    item.usage.some(u => u.toLowerCase().includes(usage.toLowerCase()))
  )
}

export function getAllCategories(): string[] {
  return [...new Set(KNOWLEDGE_BASE.map(item => item.category))]
}

export function getAllBrands(): string[] {
  return [...new Set(KNOWLEDGE_BASE.map(item => item.brand).filter(Boolean))] as string[]
}

export default KNOWLEDGE_BASE
