// AI Order Service — parse and validate natural-language order requests

import { getWorkingModelConfig, GeminiResponse, AIOrderRequest, parseGeminiJSON } from './ai-client'

/** Extract material calculation parameters from a user query */
export async function extractMaterialCalculationParams(query: string): Promise<Record<string, unknown> | null> {
    try {
        const { client, modelName } = await getWorkingModelConfig()
        if (!client) throw new Error('Client init failed')

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

        const result = await client.models.generateContent({
            model: modelName!,
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
        const { client, modelName } = await getWorkingModelConfig()
        if (!client) throw new Error('Client init failed')

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

        const result = await client.models.generateContent({
            model: modelName!,
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
        const { client, modelName } = await getWorkingModelConfig()
        if (!client) throw new Error('Client init failed')

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

        const result = await client.models.generateContent({
            model: modelName!,
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
