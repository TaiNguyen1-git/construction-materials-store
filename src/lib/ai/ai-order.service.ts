// AI Order Service — parse and validate natural-language order requests

import { getWorkingModelConfig, generateContentWithFallback, GeminiResponse, AIOrderRequest, parseGeminiJSON } from './ai-client'

/** Extract material calculation parameters from a user query */
export async function extractMaterialCalculationParams(query: string): Promise<Record<string, unknown> | null> {
    try {
        const prompt = `
    Extract construction material calculation parameters from the user's query.
    
    Return a JSON object with these fields (all optional):
    - projectType: 'HOUSE' | 'VILLA' | 'WAREHOUSE' | 'TILING' | 'WALLING' | 'CUSTOM'
    - area: number (in m2) - ONLY if user explicitly provides this
    - floors: number - ONLY if user explicitly provides this
    - length: number (in meters) - for tiling/walling
    - width: number (in meters) - for tiling/walling
    - height: number (in meters) - for walls
    - materials: string[] - specific materials mentioned: ['cement', 'sand', 'brick', 'steel', 'tile', 'paint']
    - purpose: 'ESTIMATE' | 'CONFIRM' | 'COMPARE' | 'ADVICE'
    - budget: number (in VND) - if mentioned
    - location: string - Vietnamese city/province if mentioned
    
    User query: "${query}"
    
    Rules:
    - If user doesn't mention specific dimensions, don't include area/length/width/height
    - For "nhà cấp 4" (level 4 house), floors = 1
    - For "nhà 2 tầng" (2-story house), floors = 2
    - "mái bằng" means flat roof (no special roofing materials needed)
    
    Return ONLY a JSON object, no markdown.
    `

        const result = await generateContentWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })

        const text = (result as GeminiResponse).text || '{}'
        return parseGeminiJSON<Record<string, unknown>>(text, {})
    } catch (error) {
        console.error('[OrderService] extractMaterialCalculationParams error:', error)
        return null
    }
}

/** Parse a Vietnamese natural-language order request into structured AIOrderRequest */
export async function parseOrderRequest(message: string): Promise<AIOrderRequest | null> {
    try {
        const prompt = `
    Extract order details from this natural Vietnamese text.
    Handle colloquialisms like "1 xe" (truck), "1 thiên" (1000 bricks), "chục" (10), "bao" (bag), "khối" (m3).
    
    Return a JSON object with:
    - items: array of { productName, quantity (number), unit }
    - deliveryAddress: string (if mentioned) OR null if NOT mentioned
    - customerName: string (if mentioned) OR null if NOT mentioned
    - phone: string (if mentioned) OR null if NOT mentioned
    - vatInfo: { companyName: string, taxId: string, companyAddress: string } (ONLY if mentioned)
    
    CRITICAL RULES:
    - DO NOT HALLUCINATE or GUESS customer information!
    - If the user does NOT explicitly provide a name, phone, or address, you MUST return null for those fields.
    - Common Vietnamese names like "Nguyễn Văn A", "Anh A", "Chị B" are PLACEHOLDER NAMES - do NOT use them.
    - productName MUST be only the name of the product (e.g., "Xi măng Insee"). Do NOT include delivery info or customer details in productName.
    - If quantity is not specified but implied (e.g., "mua xi măng"), default to 1.
    - Map "xe" to unit "xe" (or "m3" if context implies volume).
    - Map "thiên" to quantity 1000 and unit "viên" (for bricks/gạch).
    - Map "chục" to quantity 10.
    - For "gạch" (bricks), default unit is "thiên" if vague, otherwise "viên".
    - For "cát" (sand) and "đá" (stone), default unit is "khối" (m3).
    - For "xi măng" (cement), default unit is "bao".
    
    User message: "${message}"
    
    Return only the JSON object.
    `

        const result = await generateContentWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })

        const text = (result as GeminiResponse).text || '{}'
        return parseGeminiJSON<AIOrderRequest>(text, {
            items: [],
            customerName: null,
            phone: null,
            deliveryAddress: null,
            vatInfo: null
        })
    } catch (error) {
        console.error('[OrderService] parseOrderRequest error:', error)
        return null
    }
}

/**
 * Modify an existing list of order items based on user's natural language command.
 * Used for "Edit Order" flow in chatbot.
 */
export async function modifyOrderRequest(
    currentItems: Array<{ productName: string, quantity: number, unit: string }>,
    message: string
): Promise<Array<{ productName: string, quantity: number, unit: string }>> {
    try {
        const prompt = `
    You are an assistant helping a customer edit their construction material order.
    
    CURRENT ORDER ITEMS:
    ${JSON.stringify(currentItems, null, 2)}
    
    USER COMMAND: "${message}"
    
    TASK:
    Update the current order items based on the user command. 
    Handle actions like:
    - "Thêm X": Add a new item or increase quantity of existing one.
    - "Bớt X" / "Xóa X": Decrease quantity or remove an item.
    - "Đổi X thành Y": Replace an item.
    - "Sửa X thành N": Update the quantity of X to N.
    
    RULES:
    - Return the COMPLETE list of updated items.
    - Keep the same structure: { productName, quantity (number), unit }.
    - Map colloquial units (xe, khối, bao, thiên, viên).
    - If quantity becomes 0 or negative, remove the item.
    - Use Vietnamese for productName and unit.
    
    Return ONLY a JSON array of items, no markdown.
    `

        const result = await generateContentWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })

        const text = (result as GeminiResponse).text || '[]'
        return parseGeminiJSON<Array<{ productName: string, quantity: number, unit: string }>>(text, currentItems)
    } catch (error) {
        console.error('[OrderService] modifyOrderRequest error:', error)
        return currentItems
    }
}

/** Optimize logistics (delivery routing, load balancing) */
export async function optimizeLogistics(data: {
    orders: Array<{
        orderId: string
        deliveryAddress: string
        totalWeight?: number
        priority: 'HIGH' | 'MEDIUM' | 'LOW'
    }>
    availableVehicles: Array<{
        vehicleId: string
        capacity: number
        currentLocation: string
    }>
    warehouseLocation: string
}): Promise<{
    routes: Array<{
        vehicleId: string
        orderSequence: string[]
        estimatedDuration: string
        totalLoad: number
    }>
    efficiency: number
    recommendations: string[]
}> {
    try {
        const prompt = `
    Optimize delivery logistics for the following orders and vehicles.
    
    Orders:
    ${JSON.stringify(data.orders, null, 2)}
    
    Available Vehicles:
    ${JSON.stringify(data.availableVehicles, null, 2)}
    
    Warehouse Location: ${data.warehouseLocation}
    
    Please provide:
    1. routes: array of vehicle assignments with order sequence
    2. efficiency: estimated efficiency score (0-1)
    3. recommendations: array of 2-3 optimization tips in Vietnamese
    
    Return ONLY a JSON object.
    `

        const result = await generateContentWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })

        const text = (result as GeminiResponse).text || '{}'
        const parsed = parseGeminiJSON<Record<string, unknown>>(text, {})

        return {
            routes: (parsed.routes as Array<{ vehicleId: string; orderSequence: string[]; estimatedDuration: string; totalLoad: number }>) || [],
            efficiency: (parsed.efficiency as number) || 0.7,
            recommendations: (parsed.recommendations as string[]) || ['Tối ưu hóa lộ trình giao hàng theo khu vực.']
        }
    } catch (error) {
        console.error('[OrderService] optimizeLogistics error:', error)
        return { routes: [], efficiency: 0, recommendations: ['Không thể tối ưu hóa lộ trình lúc này.'] }
    }
}

/** Parse guest info (name, phone, address) from user message using AI */
export async function parseGuestInfoWithAI(message: string): Promise<{ name?: string, phone?: string, address?: string }> {
    try {

        const prompt = `
    Trích xuất thông tin khách hàng từ tin nhắn sau. 
    Tin nhắn: "${message}"

    Trả về định dạng JSON:
    {
      "name": "họ tên khách hàng (nếu có)",
      "phone": "số điện thoại (nếu có, chỉ lấy số)",
      "address": "địa chỉ giao hàng (nếu có)"
    }

    QUY TẮC:
    - Nếu không tìm thấy thông tin nào, hãy để null.
    - Phone chỉ lấy chữ số (ví dụ: 0901234567).
    - Không được tự ý bịa đặt thông tin.

    Trả về DUY NHẤT mã JSON.
    `

        const result = await generateContentWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })

        const text = (result as GeminiResponse).text || '{}'
        const parsed = parseGeminiJSON<{ name: string | null, phone: string | null, address: string | null }>(text, {
            name: null,
            phone: null,
            address: null
        })

        return {
            name: parsed.name || undefined,
            phone: parsed.phone?.replace(/[^\d]/g, '') || undefined,
            address: parsed.address || undefined
        }
    } catch (error) {
        console.error('[OrderService] parseGuestInfoWithAI error:', error)
        return {}
    }
}
