import { GoogleGenerativeAI } from '@google/generative-ai'
import { AI_CONFIG } from './ai-config'
import KNOWLEDGE_BASE, { ProductKnowledge, searchByCategory, searchByBrand, searchByName, searchByUsage } from './knowledge-base'

const gemini = AI_CONFIG.GEMINI.API_KEY ? new GoogleGenerativeAI(AI_CONFIG.GEMINI.API_KEY) : null

// Simple vector store using cosine similarity
interface VectorEntry {
  id: string
  text: string
  embedding: number[]
  metadata: ProductKnowledge
}

class SimpleVectorStore {
  private vectors: VectorEntry[] = []

  async addDocument(doc: ProductKnowledge) {
    // Create searchable text from document
    const searchableText = this.createSearchableText(doc)
    
    // Generate embedding (simple keyword-based for now, can upgrade to real embeddings)
    const embedding = this.generateSimpleEmbedding(searchableText)
    
    this.vectors.push({
      id: doc.id,
      text: searchableText,
      embedding,
      metadata: doc
    })
  }

  private createSearchableText(doc: ProductKnowledge): string {
    return `
      ${doc.name} ${doc.brand || ''} ${doc.category}
      ${doc.description}
      ${doc.usage.join(' ')}
      ${doc.tips.join(' ')}
      ${Object.values(doc.specifications).join(' ')}
      ${doc.quality}
    `.toLowerCase()
  }

  private generateSimpleEmbedding(text: string): number[] {
    // Simple keyword-based embedding
    const keywords = [
      'xi măng', 'insee', 'hà tiên', 'pc30', 'pc40', 'pcb40',
      'gạch', 'đinh', 'ống', '4 lỗ',
      'đá', '1x2', 'mi', 'dăm',
      'cát', 'xây dựng', 'vàng',
      'móng', 'tường', 'sàn', 'dầm', 'cột', 'mái',
      'xây', 'trát', 'đổ', 'bê tông',
      'chịu lực', 'cách nhiệt', 'chống thấm'
    ]
    
    return keywords.map(keyword => {
      const count = (text.match(new RegExp(keyword, 'gi')) || []).length
      return count
    })
  }

  search(query: string, topK: number = 5): ProductKnowledge[] {
    const queryEmbedding = this.generateSimpleEmbedding(query.toLowerCase())
    
    // Calculate similarity scores
    const scores = this.vectors.map(vec => ({
      metadata: vec.metadata,
      score: this.cosineSimilarity(queryEmbedding, vec.embedding)
    }))
    
    // Sort by score and return top K
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter(item => item.score > 0) // Only return if there's some relevance
      .map(item => item.metadata)
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0
    return dotProduct / (magnitudeA * magnitudeB)
  }
}

// Initialize vector store
const vectorStore = new SimpleVectorStore()

// Load knowledge base into vector store
let isInitialized = false
async function initializeVectorStore() {
  if (isInitialized) return
  
  for (const doc of KNOWLEDGE_BASE) {
    await vectorStore.addDocument(doc)
  }
  
  isInitialized = true
  console.log('✅ RAG Vector Store initialized with', KNOWLEDGE_BASE.length, 'documents')
}

// RAG Service
export class RAGService {
  // Retrieve relevant context from knowledge base
  static async retrieveContext(query: string, topK: number = 3): Promise<ProductKnowledge[]> {
    await initializeVectorStore()
    
    // Hybrid search: Vector search + keyword search
    const vectorResults = vectorStore.search(query, topK)
    
    // Also try keyword-based search for specific categories/brands
    const keywordResults: ProductKnowledge[] = []
    
    if (query.includes('insee')) {
      keywordResults.push(...searchByBrand('INSEE'))
    }
    if (query.includes('hà tiên') || query.includes('ha tien')) {
      keywordResults.push(...searchByBrand('Hà Tiên'))
    }
    if (query.includes('gạch')) {
      keywordResults.push(...searchByCategory('Gạch'))
    }
    if (query.includes('đá')) {
      keywordResults.push(...searchByCategory('Đá'))
    }
    if (query.includes('cát')) {
      keywordResults.push(...searchByCategory('Cát'))
    }
    if (query.includes('xi măng') || query.includes('xi mang')) {
      keywordResults.push(...searchByCategory('Xi măng'))
    }
    
    // Combine and deduplicate
    const combined = [...vectorResults, ...keywordResults]
    const unique = combined.filter((item, index, self) =>
      index === self.findIndex(t => t.id === item.id)
    )
    
    return unique.slice(0, topK)
  }

  // Generate augmented prompt with retrieved context
  static async generateAugmentedPrompt(userQuery: string, conversationHistory?: any[]): Promise<string> {
    const relevantDocs = await this.retrieveContext(userQuery, 3)
    
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

Thông số:
${Object.entries(doc.specifications).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Công dụng:
${doc.usage.map(u => `- ${u}`).join('\n')}

Mẹo hay:
${doc.tips.map(t => `- ${t}`).join('\n')}

${doc.warnings && doc.warnings.length > 0 ? `⚠️ Lưu ý: ${doc.warnings.join(', ')}` : ''}
${doc.commonCombinations.length > 0 ? `Thường mua kèm: ${doc.commonCombinations.join(', ')}` : ''}
    `).join('\n---\n')

    return `
Dựa trên thông tin sản phẩm CỤ THỂ của cửa hàng dưới đây để trả lời khách hàng:

${contextText}

---

Câu hỏi của khách hàng: ${userQuery}

Hãy trả lời dựa trên thông tin trên với giá cả CHÍNH XÁC, đừng bịa giá. Nếu khách hỏi về sản phẩm không có trong danh sách, hãy gợi ý sản phẩm tương tự hoặc bảo khách liên hệ nhân viên.
    `
  }

  // Get product recommendations based on query
  static async getProductRecommendations(query: string, limit: number = 3): Promise<ProductKnowledge[]> {
    return await this.retrieveContext(query, limit)
  }

  // Get product by exact match
  static async getProductByName(name: string): Promise<ProductKnowledge | null> {
    await initializeVectorStore()
    const results = searchByName(name)
    return results.length > 0 ? results[0] : null
  }

  // Get products by category
  static async getProductsByCategory(category: string): Promise<ProductKnowledge[]> {
    await initializeVectorStore()
    return searchByCategory(category)
  }

  // Smart product matching for cross-sell
  static async getCrossSellProducts(productId: string): Promise<ProductKnowledge[]> {
    await initializeVectorStore()
    
    const product = KNOWLEDGE_BASE.find(p => p.id === productId)
    if (!product) return []

    // Get products from commonCombinations
    const crossSellProducts: ProductKnowledge[] = []
    
    for (const combination of product.commonCombinations) {
      const matches = KNOWLEDGE_BASE.filter(p => 
        p.name.toLowerCase().includes(combination.toLowerCase()) ||
        p.description.toLowerCase().includes(combination.toLowerCase())
      )
      crossSellProducts.push(...matches)
    }

    // Deduplicate and remove the original product
    const unique = crossSellProducts.filter((item, index, self) =>
      index === self.findIndex(t => t.id === item.id) && item.id !== productId
    )

    return unique.slice(0, 5)
  }

  // Calculate material quantities (enhanced with knowledge base)
  static async calculateMaterialsWithContext(query: string): Promise<string> {
    const relevantProducts = await this.retrieveContext(query, 5)
    
    let response = 'Dựa trên yêu cầu của bạn, đây là các vật liệu cần thiết:\n\n'
    
    for (const product of relevantProducts) {
      response += `**${product.name}**\n`
      response += `Giá: ${product.pricing.basePrice.toLocaleString('vi-VN')}đ/${product.pricing.unit}\n`
      
      if (product.tips.length > 0) {
        response += `Mẹo: ${product.tips[0]}\n`
      }
      
      response += '\n'
    }
    
    response += '\nBạn có thể vào mục "Tính toán vật liệu" để tính toán chi tiết hơn nhé!'
    
    return response
  }

  // Format product info for chatbot
  static formatProductForChat(product: ProductKnowledge): string {
    let message = `**${product.name}**\n`
    if (product.brand) message += `Thương hiệu: ${product.brand}\n`
    message += `Giá: ${product.pricing.basePrice.toLocaleString('vi-VN')}đ/${product.pricing.unit}\n\n`
    
    message += `${product.description}\n\n`
    
    if (product.pricing.bulkDiscount && product.pricing.bulkDiscount.length > 0) {
      message += `💰 Giảm giá số lượng lớn:\n`
      product.pricing.bulkDiscount.forEach(d => {
        message += `- Từ ${d.minQuantity} ${product.pricing.unit}: Giảm ${d.discountPercent}%\n`
      })
      message += '\n'
    }
    
    if (product.usage.length > 0) {
      message += `📋 Công dụng:\n`
      product.usage.slice(0, 3).forEach(u => {
        message += `- ${u}\n`
      })
      message += '\n'
    }
    
    if (product.tips.length > 0) {
      message += `💡 Mẹo hay:\n`
      product.tips.slice(0, 2).forEach(t => {
        message += `- ${t}\n`
      })
    }
    
    return message
  }
}

export default RAGService
