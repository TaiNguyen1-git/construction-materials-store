import { GoogleGenerativeAI } from '@google/generative-ai'
import { AI_CONFIG } from './ai-config'
import { prisma } from './prisma'
import KNOWLEDGE_BASE, { ProductKnowledge, searchByCategory, searchByBrand, searchByName } from './knowledge-base'

const gemini = AI_CONFIG.GEMINI.API_KEY ? new GoogleGenerativeAI(AI_CONFIG.GEMINI.API_KEY) : null

// Helper function to normalize Vietnamese text (remove diacritics)
function normalizeVietnamese(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

// Vector store entry
interface VectorEntry {
  id: string
  text: string
  embedding: number[]
  metadata: ProductKnowledge
}

class GeminiVectorStore {
  private vectors: VectorEntry[] = []
  private model: any

  constructor() {
    if (gemini) {
      this.model = gemini.getGenerativeModel({ model: "embedding-001" })
    }
  }

  async addDocument(doc: ProductKnowledge) {
    if (!this.model) return

    // Create searchable text from document
    const searchableText = this.createSearchableText(doc)

    try {
      // Generate embedding using Gemini
      const result = await this.model.embedContent(searchableText)
      const embedding = result.embedding.values

      this.vectors.push({
        id: doc.id,
        text: searchableText,
        embedding,
        metadata: doc
      })
    } catch (error) {
      console.error(`Error generating embedding for ${doc.name}:`, error)
    }
  }

  private createSearchableText(doc: ProductKnowledge): string {
    const text = `
      ${doc.name} ${doc.brand || ''} ${doc.category}
      ${doc.description}
      ${doc.usage.join(' ')}
      ${doc.tips.join(' ')}
      ${Object.values(doc.specifications).join(' ')}
      ${doc.quality}
    `
    return normalizeVietnamese(text)
  }

  async search(query: string, topK: number = 5): Promise<ProductKnowledge[]> {
    if (!this.model || this.vectors.length === 0) return []

    try {
      // Generate embedding for query (normalized)
      const normalizedQuery = normalizeVietnamese(query)
      const result = await this.model.embedContent(normalizedQuery)
      const queryEmbedding = result.embedding.values

      // Calculate cosine similarity
      const scores = this.vectors.map(vec => ({
        metadata: vec.metadata,
        score: this.cosineSimilarity(queryEmbedding, vec.embedding)
      }))

      // Sort by score and return top K
      return scores
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .filter(item => item.score > 0.6) // Threshold for relevance
        .map(item => item.metadata)
    } catch (error) {
      console.error('Error searching vector store:', error)
      return []
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))

    if (magnitudeA === 0 || magnitudeB === 0) return 0
    return dotProduct / (magnitudeA * magnitudeB)
  }

  clear() {
    this.vectors = []
  }
}

// Initialize vector store
const vectorStore = new GeminiVectorStore()

// Load knowledge base into vector store
let isInitialized = false
let lastInitialization = 0
const REFRESH_INTERVAL = 1000 * 60 * 60 // 1 hour

async function initializeVectorStore() {
  // Check if needs refresh
  if (isInitialized && Date.now() - lastInitialization < REFRESH_INTERVAL) return

  console.log('🔄 Initializing RAG Vector Store...')
  vectorStore.clear()

  // 1. Load static knowledge base
  for (const doc of KNOWLEDGE_BASE) {
    await vectorStore.addDocument(doc)
  }

  // 2. Load dynamic products from database
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true, inventoryItem: true }
    })

    for (const product of products) {
      // Convert DB product to ProductKnowledge format
      const doc: ProductKnowledge = {
        id: product.id,
        name: product.name,
        category: product.category.name,
        brand: '',
        description: product.description || '',
        pricing: {
          basePrice: product.price,
          unit: product.unit,
          bulkDiscount: []
        },
        specifications: {
          sku: product.sku
        },
        usage: [], // Can be populated if we have tags or other fields
        tips: [],
        warnings: [],
        commonCombinations: [],
        quality: 'Standard',
        supplier: 'Store Inventory'
      }

      await vectorStore.addDocument(doc)
    }
    console.log(`✅ Loaded ${products.length} products from DB into Vector Store`)
  } catch (error) {
    console.error('Failed to load products from DB:', error)
  }

  isInitialized = true
  lastInitialization = Date.now()
  console.log('✅ RAG Vector Store initialized complete')
}

// RAG Service
export class RAGService {
  // Initialize the vector store
  static async initialize() {
    await initializeVectorStore()
  }

  // Retrieve relevant context from knowledge base
  static async retrieveContext(query: string, topK: number = 3): Promise<ProductKnowledge[]> {
    await initializeVectorStore()

    // Semantic search using Gemini embeddings
    const vectorResults = await vectorStore.search(query, topK)

    // Fallback to keyword search if vector search returns few results
    if (vectorResults.length < 2) {
      const keywordResults: ProductKnowledge[] = []
      const normalizedQuery = normalizeVietnamese(query)

      // Check both original and normalized query for better matching
      if (query.toLowerCase().includes('insee')) keywordResults.push(...searchByBrand('INSEE'))
      if (query.toLowerCase().includes('hà tiên') || normalizedQuery.includes('ha tien')) keywordResults.push(...searchByBrand('Hà Tiên'))
      if (query.toLowerCase().includes('gạch') || normalizedQuery.includes('gach')) keywordResults.push(...searchByCategory('Gạch'))
      if (query.toLowerCase().includes('đá') || normalizedQuery.includes('da')) keywordResults.push(...searchByCategory('Đá'))
      if (query.toLowerCase().includes('cát') || normalizedQuery.includes('cat')) keywordResults.push(...searchByCategory('Cát'))
      if (query.toLowerCase().includes('xi măng') || normalizedQuery.includes('xi mang')) keywordResults.push(...searchByCategory('Xi măng'))

      // Combine unique results
      const existingIds = new Set(vectorResults.map(r => r.id))
      for (const res of keywordResults) {
        if (!existingIds.has(res.id)) {
          vectorResults.push(res)
          existingIds.add(res.id)
        }
      }
    }

    return vectorResults.slice(0, topK)
  }

  // Generate augmented prompt with retrieved context
  static async generateAugmentedPrompt(userQuery: string, conversationHistory?: any[]): Promise<string> {
    // Use getProductRecommendations to get both primary and related products
    const relevantDocs = await this.getProductRecommendations(userQuery, 5)

    if (relevantDocs.length === 0) {
      return userQuery
    }

    // Format context from knowledge base
    const contextText = relevantDocs.map(doc => `
**${doc.name}** (${doc.brand || doc.supplier})
Giá: ${doc.pricing.basePrice.toLocaleString('vi-VN')}đ/${doc.pricing.unit}
${doc.pricing.bulkDiscount && doc.pricing.bulkDiscount.length > 0 ?
        `Giảm giá số lượng lớn: ${doc.pricing.bulkDiscount.map(d => `${d.minQuantity}+ = -${d.discountPercent}%`).join(', ')}` : ''}

Mô tả: ${doc.description}
Thông số: ${Object.entries(doc.specifications).map(([key, value]) => `${key}: ${value}`).join(', ')}
${doc.usage.length > 0 ? `Công dụng: ${doc.usage.join(', ')}` : ''}
${doc.tips.length > 0 ? `Mẹo: ${doc.tips.join(', ')}` : ''}
    `).join('\n---\n')

    return `
THÔNG TIN SẢN PHẨM CÓ SẴN TRONG KHO (Sử dụng thông tin này để trả lời):
${contextText}

---
CÂU HỎI CỦA KHÁCH: ${userQuery}

YÊU CẦU:
1. Trả lời dựa trên thông tin sản phẩm được cung cấp ở trên.
2. **QUAN TRỌNG**: Nếu có NHIỀU sản phẩm cùng loại (ví dụ: nhiều loại xi măng), hãy giới thiệu TẤT CẢ các lựa chọn kèm so sánh giá và ưu điểm để khách dễ chọn.
3. Sau khi giới thiệu sản phẩm chính, nếu thấy có sản phẩm liên quan (ví dụ: khách hỏi xi măng, có cát/đá trong context), hãy gợi ý mua thêm để đủ bộ vật tư.
4. Nếu không có thông tin trong context, hãy dùng kiến thức chung nhưng nói rõ là "theo kiến thức chung".
5. Giọng điệu chuyên nghiệp, hữu ích.

VÍ DỤ TRẢ LỜI TỐT:
Khách: "Xi măng tốt"
Trả lời: "Chào bạn! Hiện tại shop có 4 loại xi măng chất lượng:
1. Xi măng INSEE PC40 - 135.000đ/bao - Cao cấp nhất, độ bền cao
2. Xi măng Hà Tiên PCB40 - 125.000đ/bao - Chất lượng tốt, giá rẻ hơn INSEE
3. Xi măng INSEE PC30 - 120.000đ/bao - Phù hợp xây tô
4. Xi măng Hà Tiên PC30 - 110.000đ/bao - Giá tốt nhất

Bạn cần xi măng cho công trình gì ạ? (đổ móng/xây tường/trát tường)
Ngoài ra, bạn cũng cần cát và đá để trộn bê tông không ạ?"
    `
  }

  // Get product recommendations based on query with related items
  static async getProductRecommendations(query: string, limit: number = 5): Promise<ProductKnowledge[]> {
    await initializeVectorStore()

    // 1. Find primary products (increased from 2 to 4 to show more options)
    const primaryProducts = await this.retrieveContext(query, 4)
    if (primaryProducts.length === 0) return []

    const recommendations: ProductKnowledge[] = [...primaryProducts]
    const seenIds = new Set(primaryProducts.map(p => p.id))

    // 2. Find related products based on common combinations of the top result
    const topProduct = primaryProducts[0]
    if (topProduct.commonCombinations && topProduct.commonCombinations.length > 0) {
      console.log(`Found common combinations for ${topProduct.name}:`, topProduct.commonCombinations)

      for (const comboKeyword of topProduct.commonCombinations) {
        if (recommendations.length >= limit) break

        // Search for the combination keyword
        // We use a smaller limit (1) because we just want the best match for this related item
        const relatedDocs = await this.retrieveContext(comboKeyword, 1)

        for (const doc of relatedDocs) {
          if (!seenIds.has(doc.id)) {
            recommendations.push(doc)
            seenIds.add(doc.id)
            if (recommendations.length >= limit) break
          }
        }
      }
    }

    return recommendations.slice(0, limit)
  }

  // ... keep other static methods ...
  static async getProductByName(name: string): Promise<ProductKnowledge | null> {
    await initializeVectorStore()
    const results = searchByName(name)
    return results.length > 0 ? results[0] : null
  }

  static async getProductsByCategory(category: string): Promise<ProductKnowledge[]> {
    await initializeVectorStore()
    return searchByCategory(category)
  }

  // Re-export other helper methods as needed or keep them if they don't depend on vector store internals
  static formatProductForChat(product: ProductKnowledge): string {
    let message = `**${product.name}**\n`
    if (product.brand) message += `Thương hiệu: ${product.brand}\n`
    message += `Giá: ${product.pricing.basePrice.toLocaleString('vi-VN')}đ/${product.pricing.unit}\n\n`
    message += `${product.description}\n`
    return message
  }
}

export default RAGService
