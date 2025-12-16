/**
 * AI Vision Estimator Service
 * Analyzes floor plan images and calculates material requirements
 * Uses Gemini Vision (multimodal) for image understanding
 */

import { GoogleGenAI } from '@google/genai'
import { prisma } from '@/lib/prisma'

// Initialize Gemini client
const gemini = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    : null

// Construction material standards (Vietnamese market)
const MATERIAL_STANDARDS = {
    flooring: {
        tile: {
            grout_per_sqm: 0.5, // kg per m2
            adhesive_per_sqm: 4, // kg per m2
            wastage_factor: 1.08, // 8% wastage
        },
        cement: {
            per_sqm: 15, // kg per m2 for leveling
        }
    },
    painting: {
        primer_coverage: 10, // m2 per liter
        paint_coverage: 8, // m2 per liter (2 coats)
        coats: 2,
    },
    tiling_wall: {
        adhesive_per_sqm: 5, // kg per m2
        grout_per_sqm: 0.3, // kg per m2
    }
}

export interface RoomDimension {
    name: string
    length: number
    width: number
    height?: number
    area: number
}

export interface MaterialEstimate {
    productName: string
    productId?: string
    quantity: number
    unit: string
    reason: string
    price?: number
}

export interface EstimatorResult {
    success: boolean
    projectType: string
    rooms: RoomDimension[]
    totalArea: number
    materials: MaterialEstimate[]
    totalEstimatedCost: number
    confidence: number
    rawAnalysis?: string
    error?: string
}

/**
 * Analyze floor plan image using Gemini Vision
 */
export async function analyzeFloorPlanImage(
    base64Image: string,
    projectType: 'flooring' | 'painting' | 'tiling' | 'general' = 'flooring'
): Promise<EstimatorResult> {
    if (!gemini) {
        return {
            success: false,
            projectType,
            rooms: [],
            totalArea: 0,
            materials: [],
            totalEstimatedCost: 0,
            confidence: 0,
            error: 'AI service not configured. Please set GEMINI_API_KEY.'
        }
    }

    try {
        // Remove data URL prefix if present
        const imageData = base64Image.replace(/^data:image\/\w+;base64,/, '')

        const model = gemini.models

        const prompt = `
You are an expert construction estimator AI. Analyze this floor plan or room image and extract:

1. **Room dimensions**: Identify each room/area with its approximate length and width in meters.
   - Look for dimension labels, scale indicators, or estimate from relative proportions.
   - If this is a photo of a room (not a floor plan), estimate dimensions based on standard furniture sizes.

2. **Project type context**: This is for "${projectType}" work.

Return a JSON object with this structure:
{
  "rooms": [
    { "name": "Phòng khách", "length": 5.0, "width": 4.0 },
    { "name": "Phòng ngủ", "length": 4.0, "width": 3.5 }
  ],
  "totalArea": 35.5,
  "projectType": "${projectType}",
  "confidence": 0.85,
  "notes": "Brief notes about the analysis"
}

Important guidelines:
- All dimensions in METERS
- If you cannot determine exact dimensions, make reasonable estimates based on typical Vietnamese home layouts
- Confidence should reflect how certain you are (0.0-1.0)
- For photos, estimate room size from visible elements (doors ~0.9m, standard furniture, etc.)

Return ONLY the JSON object, no additional text or markdown.
`

        const result = await model.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{
                role: 'user',
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: imageData
                        }
                    }
                ]
            }]
        })

        const responseText = (result as any).text || ''

        // Parse the JSON response
        let analysisData: any = {}
        try {
            const cleanedText = responseText.replace(/```json\s*|\s*```/g, '').trim()
            analysisData = JSON.parse(cleanedText)
        } catch (parseError) {
            // Try to extract JSON from the response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                analysisData = JSON.parse(jsonMatch[0])
            }
        }

        // Calculate materials based on analysis
        const rooms: RoomDimension[] = (analysisData.rooms || []).map((room: any) => ({
            name: room.name || 'Không tên',
            length: room.length || 0,
            width: room.width || 0,
            height: room.height || 3.0, // Default ceiling height
            area: (room.length || 0) * (room.width || 0)
        }))

        const totalArea = rooms.reduce((sum, room) => sum + room.area, 0) || analysisData.totalArea || 0

        // Calculate material requirements
        const materials = await calculateMaterials(totalArea, projectType, rooms)

        // Get product prices from database
        const enrichedMaterials = await enrichMaterialsWithProducts(materials)

        const totalCost = enrichedMaterials.reduce((sum, m) => sum + (m.price || 0) * m.quantity, 0)

        return {
            success: true,
            projectType: analysisData.projectType || projectType,
            rooms,
            totalArea,
            materials: enrichedMaterials,
            totalEstimatedCost: totalCost,
            confidence: analysisData.confidence || 0.7,
            rawAnalysis: analysisData.notes
        }

    } catch (error: any) {
        console.error('AI Vision Estimator error:', error)
        return {
            success: false,
            projectType,
            rooms: [],
            totalArea: 0,
            materials: [],
            totalEstimatedCost: 0,
            confidence: 0,
            error: `Lỗi phân tích ảnh: ${error.message}`
        }
    }
}

/**
 * Calculate material requirements based on area and project type
 */
async function calculateMaterials(
    totalArea: number,
    projectType: string,
    rooms: RoomDimension[]
): Promise<MaterialEstimate[]> {
    const materials: MaterialEstimate[] = []

    if (totalArea <= 0) return materials

    switch (projectType) {
        case 'flooring':
            // Tiles (assuming 60x60cm tiles = 0.36m2 each)
            const tileSize = 0.36
            const tilesNeeded = Math.ceil((totalArea / tileSize) * MATERIAL_STANDARDS.flooring.tile.wastage_factor)
            materials.push({
                productName: 'Gạch lát nền 60x60cm',
                quantity: tilesNeeded,
                unit: 'viên',
                reason: `${totalArea.toFixed(1)}m² + 8% hao hụt`
            })

            // Tile adhesive
            const adhesiveKg = Math.ceil(totalArea * MATERIAL_STANDARDS.flooring.tile.adhesive_per_sqm)
            const adhesiveBags = Math.ceil(adhesiveKg / 25) // 25kg bags
            materials.push({
                productName: 'Keo dán gạch (bao 25kg)',
                quantity: adhesiveBags,
                unit: 'bao',
                reason: `${adhesiveKg}kg cần thiết`
            })

            // Grout
            const groutKg = Math.ceil(totalArea * MATERIAL_STANDARDS.flooring.tile.grout_per_sqm)
            materials.push({
                productName: 'Keo chà ron',
                quantity: groutKg,
                unit: 'kg',
                reason: `0.5kg/m² × ${totalArea.toFixed(0)}m²`
            })
            break

        case 'painting':
            // Total wall area (perimeter × height)
            let wallArea = 0
            rooms.forEach(room => {
                const perimeter = 2 * (room.length + room.width)
                const height = room.height || 3.0
                wallArea += perimeter * height
            })
            // Subtract ~15% for windows/doors
            wallArea *= 0.85

            // Primer
            const primerLiters = Math.ceil(wallArea / MATERIAL_STANDARDS.painting.primer_coverage)
            materials.push({
                productName: 'Sơn lót (lon 5L)',
                quantity: Math.ceil(primerLiters / 5),
                unit: 'lon',
                reason: `${wallArea.toFixed(0)}m² tường`
            })

            // Paint (2 coats)
            const paintLiters = Math.ceil((wallArea * MATERIAL_STANDARDS.painting.coats) / MATERIAL_STANDARDS.painting.paint_coverage)
            materials.push({
                productName: 'Sơn nước cao cấp (lon 5L)',
                quantity: Math.ceil(paintLiters / 5),
                unit: 'lon',
                reason: `2 lớp sơn, ${wallArea.toFixed(0)}m²`
            })
            break

        case 'tiling':
            // Wall tiles (15x60cm)
            const wallTileArea = totalArea * 2.5 // Assuming wall height ~2.5m
            const wallTilesNeeded = Math.ceil((wallTileArea / 0.09) * 1.1) // 10% wastage
            materials.push({
                productName: 'Gạch ốp tường 30x60cm',
                quantity: wallTilesNeeded,
                unit: 'viên',
                reason: `Ốp tường ${wallTileArea.toFixed(0)}m²`
            })

            // Wall tile adhesive
            const wallAdhesiveKg = Math.ceil(wallTileArea * MATERIAL_STANDARDS.tiling_wall.adhesive_per_sqm)
            materials.push({
                productName: 'Keo dán gạch ốp tường (bao 25kg)',
                quantity: Math.ceil(wallAdhesiveKg / 25),
                unit: 'bao',
                reason: `${wallAdhesiveKg}kg cho ${wallTileArea.toFixed(0)}m²`
            })
            break

        default:
            // General estimation
            materials.push({
                productName: 'Xi măng (bao 50kg)',
                quantity: Math.ceil(totalArea * 0.4),
                unit: 'bao',
                reason: `Ước tính chung cho ${totalArea.toFixed(0)}m²`
            })
            materials.push({
                productName: 'Cát xây dựng',
                quantity: Math.ceil(totalArea * 0.05),
                unit: 'm³',
                reason: `Ước tính chung`
            })
    }

    return materials
}

/**
 * Match materials with actual products in database
 */
async function enrichMaterialsWithProducts(materials: MaterialEstimate[]): Promise<MaterialEstimate[]> {
    const enrichedMaterials: MaterialEstimate[] = []

    for (const material of materials) {
        // Search for matching product
        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: material.productName.split(' ')[0], mode: 'insensitive' } },
                    { name: { contains: material.productName.split('(')[0].trim(), mode: 'insensitive' } }
                ],
                isActive: true
            },
            take: 1,
            orderBy: { price: 'asc' }
        })

        if (products.length > 0) {
            const product = products[0]
            enrichedMaterials.push({
                ...material,
                productId: product.id,
                productName: product.name,
                price: product.price,
                unit: product.unit
            })
        } else {
            // Keep original if no match found
            enrichedMaterials.push(material)
        }
    }

    return enrichedMaterials
}

/**
 * Estimate materials from text description (no image)
 */
export async function estimateFromText(
    description: string,
    projectType: 'flooring' | 'painting' | 'tiling' | 'general' = 'flooring'
): Promise<EstimatorResult> {
    if (!gemini) {
        return {
            success: false,
            projectType,
            rooms: [],
            totalArea: 0,
            materials: [],
            totalEstimatedCost: 0,
            confidence: 0,
            error: 'AI service not configured'
        }
    }

    try {
        const model = gemini.models

        const prompt = `
Extract room dimensions from this Vietnamese text description:
"${description}"

Return a JSON object:
{
  "rooms": [{ "name": "room name", "length": meters, "width": meters }],
  "totalArea": total m2,
  "projectType": "${projectType}",
  "confidence": 0.0-1.0
}

Return ONLY JSON.
`

        const result = await model.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })

        const responseText = (result as any).text || ''
        const analysisData = JSON.parse(responseText.replace(/```json\s*|\s*```/g, '').trim())

        const rooms: RoomDimension[] = (analysisData.rooms || []).map((room: any) => ({
            name: room.name,
            length: room.length,
            width: room.width,
            area: room.length * room.width
        }))

        const totalArea = analysisData.totalArea || rooms.reduce((s, r) => s + r.area, 0)
        const materials = await calculateMaterials(totalArea, projectType, rooms)
        const enrichedMaterials = await enrichMaterialsWithProducts(materials)
        const totalCost = enrichedMaterials.reduce((s, m) => s + (m.price || 0) * m.quantity, 0)

        return {
            success: true,
            projectType,
            rooms,
            totalArea,
            materials: enrichedMaterials,
            totalEstimatedCost: totalCost,
            confidence: analysisData.confidence || 0.8
        }

    } catch (error: any) {
        console.error('Text estimator error:', error)
        return {
            success: false,
            projectType,
            rooms: [],
            totalArea: 0,
            materials: [],
            totalEstimatedCost: 0,
            confidence: 0,
            error: error.message
        }
    }
}
