/**
 * Fallback response generators for chatbot
 * Used when intent detection doesn't match or for generic responses
 */

export interface ChatbotResponse {
  response: string;
  suggestions: string[];
  productRecommendations?: any[];
  confidence: number;
}

/**
 * Generate admin help response
 */
export function generateAdminHelpResponse(): ChatbotResponse {
  return {
    response: `🎯 **Tôi có thể giúp bạn:**\n\n` +
             `📊 **Phân tích & Báo cáo**\n` +
             `- Doanh thu theo ngày/tuần/tháng\n` +
             `- Top sản phẩm bán chạy\n` +
             `- Thống kê khách hàng\n\n` +
             `📦 **Quản lý Đơn hàng**\n` +
             `- Đơn chờ xử lý\n` +
             `- Đơn mới nhất\n` +
             `- Tìm đơn theo mã\n\n` +
             `⚠️ **Tồn kho & Nhập hàng**\n` +
             `- Sản phẩm sắp hết\n` +
             `- Cảnh báo tồn kho\n\n` +
             `👥 **Nhân viên**\n` +
             `- Ai nghỉ hôm nay\n` +
             `- Lương và ứng lương\n\n` +
             `💡 Thử hỏi cụ thể hơn hoặc chọn gợi ý bên dưới!`,
    suggestions: ['Doanh thu hôm nay', 'Đơn chờ xử lý', 'Sản phẩm sắp hết', 'Top bán chạy'],
    confidence: 0.85
  }
}

/**
 * Generate admin generic fallback response
 */
export function generateAdminFallbackResponse(): ChatbotResponse {
  return {
    response: `💡 **Tôi không hiểu câu hỏi của bạn**\n\n` +
             `Tôi có thể giúp bạn về:\n` +
             `- 📊 Thống kê & Báo cáo (doanh thu, bán hàng)\n` +
             `- 📦 Quản lý đơn hàng\n` +
             `- ⚠️ Kiểm tra tồn kho\n` +
             `- 👥 Thông tin nhân viên\n\n` +
             `Hãy thử hỏi cụ thể hơn!\n\n` +
             `**Ví dụ:**\n` +
             `- "Doanh thu hôm nay"\n` +
             `- "Đơn hàng chờ xử lý"\n` +
             `- "Sản phẩm sắp hết"`,
    suggestions: ['Doanh thu hôm nay', 'Đơn chờ xử lý', 'Sản phẩm sắp hết', 'Trợ giúp'],
    confidence: 0.70
  }
}

/**
 * Generate customer help response
 */
export function generateCustomerHelpResponse(): ChatbotResponse {
  return {
    response: `🏗️ **Tôi có thể giúp bạn:**\n\n` +
             `🔍 **Tìm kiếm sản phẩm**\n` +
             `- Tìm vật liệu xây dựng\n` +
             `- So sánh giá và chất lượng\n` +
             `- Gợi ý sản phẩm phù hợp\n\n` +
             `📐 **Tính toán vật liệu**\n` +
             `- Ước tính số lượng cần mua\n` +
             `- Tính toán chi phí\n` +
             `- Tư vấn vật liệu cho công trình\n\n` +
             `🛒 **Đặt hàng & Theo dõi**\n` +
             `- Đặt hàng trực tiếp\n` +
             `- Theo dõi đơn hàng của bạn\n` +
             `- Kiểm tra trạng thái giao hàng\n\n` +
             `📸 **Nhận diện hình ảnh**\n` +
             `- Upload ảnh để AI nhận diện vật liệu\n` +
             `- Tìm sản phẩm tương tự\n\n` +
             `💡 Hãy hỏi tôi bất cứ điều gì về vật liệu xây dựng!`,
    suggestions: ['🔍 Tìm sản phẩm', '📐 Tính vật liệu', '💰 Xem giá', '🛒 Đặt hàng'],
    confidence: 0.90
  }
}

/**
 * Generate customer price inquiry fallback
 */
export function generateCustomerPriceFallback(): ChatbotResponse {
  return {
    response: `💰 **Tra cứu giá cả**\n\n` +
             `Tôi có thể giúp bạn:\n` +
             `- Tìm giá của sản phẩm cụ thể\n` +
             `- So sánh giá giữa các sản phẩm\n` +
             `- Ước tính chi phí cho công trình\n\n` +
             `💡 **Ví dụ:**\n` +
             `- "Giá xi măng bao nhiêu?"\n` +
             `- "So sánh giá gạch"\n` +
             `- "Tính giá xây nhà 100m2"`,
    suggestions: ['Tìm sản phẩm', 'So sánh giá', 'Tính vật liệu'],
    confidence: 0.75
  }
}

/**
 * Generate customer generic fallback response
 */
export function generateCustomerFallbackResponse(): ChatbotResponse {
  return {
    response: `💬 **Xin chào!**\n\n` +
             `Tôi là trợ lý AI của VietHoa Construction Materials.\n\n` +
             `Tôi có thể giúp bạn:\n` +
             `- 🔍 Tìm kiếm vật liệu xây dựng\n` +
             `- 📐 Tính toán vật liệu cần thiết\n` +
             `- 💰 Tra cứu giá cả\n` +
             `- 🛒 Đặt hàng trực tuyến\n` +
             `- 📦 Theo dõi đơn hàng\n\n` +
             `💡 Hãy thử hỏi tôi về sản phẩm hoặc chọn một trong các gợi ý bên dưới!`,
    suggestions: ['🔍 Tìm sản phẩm', '📐 Tính vật liệu', '💰 Giá cả', '📸 Nhận diện ảnh'],
    confidence: 0.65
  }
}

/**
 * Generate chatbot fallback response based on message and user type
 */
export function generateChatbotFallbackResponse(
  message: string,
  isAdmin: boolean = false
): ChatbotResponse {
  const lower = message.toLowerCase()
  
  // Check for help request
  const isHelpRequest = lower.includes('giúp') || 
                       lower.includes('help') || 
                       lower.includes('làm được') || 
                       lower.includes('can do')
  
  // Admin responses
  if (isAdmin) {
    if (isHelpRequest) {
      return generateAdminHelpResponse()
    }
    return generateAdminFallbackResponse()
  }
  
  // Customer responses
  if (isHelpRequest) {
    return generateCustomerHelpResponse()
  }
  
  // Price inquiry
  if (lower.includes('giá') || lower.includes('price')) {
    return generateCustomerPriceFallback()
  }
  
  // Generic customer fallback
  return generateCustomerFallbackResponse()
}


