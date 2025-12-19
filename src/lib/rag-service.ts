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

// Vietnamese synonyms dictionary for better query understanding
const VIETNAMESE_SYNONYMS: Record<string, string[]> = {
  // Cement
  'xi mang': ['xi măng', 'ximang', 'cement', 'xm'],
  'xi': ['xi măng'],
  // Sand
  'cat': ['cát', 'sand'],
  'cat xay': ['cát xây', 'cát xây dựng', 'cát vàng'],
  'cat to': ['cát tô', 'cát trát', 'cát mịn'],
  // Stone/Gravel
  'da': ['đá', 'stone', 'gravel'],
  'da 1x2': ['đá 1x2', 'đá dăm', 'đá xây dựng'],
  'da mi': ['đá mi', 'đá mạt', 'đá 0x4'],
  // Brick
  'gach': ['gạch', 'brick'],
  'gach ong': ['gạch ống', 'gạch 4 lỗ', 'gạch xây'],
  'gach dinh': ['gạch đinh', 'gạch đặc', 'gạch đỏ'],
  // Steel
  'thep': ['thép', 'sắt', 'steel', 'sat'],
  'sat thep': ['sắt thép', 'thép xây dựng'],
  // Paint
  'son': ['sơn', 'paint'],
  // Roofing
  'ton': ['tôn', 'tole', 'mái tôn'],
  'ngoi': ['ngói', 'mái ngói'],
  // Common phrases
  'gia': ['giá', 'báo giá', 'bao nhieu', 'price'],
  'mua': ['mua', 'đặt hàng', 'order', 'dat hang'],
  'giao hang': ['giao hàng', 'ship', 'vận chuyển', 'van chuyen'],
  'thanh toan': ['thanh toán', 'payment', 'chuyển khoản', 'chuyen khoan'],
  'doi tra': ['đổi trả', 'return', 'hoàn tiền', 'hoan tien'],
  'bao hanh': ['bảo hành', 'warranty'],
}

// Expand query with synonyms
function expandQueryWithSynonyms(query: string): string[] {
  const normalized = normalizeVietnamese(query)
  const words = normalized.split(/\s+/)
  const expansions: Set<string> = new Set([query, normalized])

  // Check each word and phrase for synonyms
  for (const [key, synonyms] of Object.entries(VIETNAMESE_SYNONYMS)) {
    if (normalized.includes(key)) {
      for (const syn of synonyms) {
        expansions.add(normalized.replace(key, normalizeVietnamese(syn)))
      }
    }
    // Also check if any synonym matches
    for (const syn of synonyms) {
      if (normalized.includes(normalizeVietnamese(syn))) {
        expansions.add(normalized.replace(normalizeVietnamese(syn), key))
      }
    }
  }

  return Array.from(expansions)
}

// Calculate keyword match score
function calculateKeywordScore(query: string, text: string): number {
  const normalizedQuery = normalizeVietnamese(query)
  const normalizedText = normalizeVietnamese(text)
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 1)

  if (queryWords.length === 0) return 0

  let matchedWords = 0
  let exactPhraseBonus = 0

  // Check word matches
  for (const word of queryWords) {
    if (normalizedText.includes(word)) {
      matchedWords++
    }
  }

  // Bonus for exact phrase match
  if (normalizedText.includes(normalizedQuery)) {
    exactPhraseBonus = 0.3
  }

  return (matchedWords / queryWords.length) * 0.7 + exactPhraseBonus
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
      this.model = gemini.getGenerativeModel({ model: "text-embedding-004" })
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
      // Expand query with synonyms for better matching
      const queryExpansions = expandQueryWithSynonyms(query)

      // Generate embedding for normalized query
      const normalizedQuery = normalizeVietnamese(query)
      const result = await this.model.embedContent(normalizedQuery)
      const queryEmbedding = result.embedding.values

      // Calculate hybrid scores (vector similarity + keyword matching)
      const scores = this.vectors.map(vec => {
        const vectorScore = this.cosineSimilarity(queryEmbedding, vec.embedding)

        // Calculate keyword score using expanded queries
        let keywordScore = 0
        for (const expansion of queryExpansions) {
          const score = calculateKeywordScore(expansion, vec.text)
          keywordScore = Math.max(keywordScore, score)
        }

        // Hybrid score: 70% vector + 30% keyword
        const hybridScore = vectorScore * 0.7 + keywordScore * 0.3

        // Bonus for exact name match
        const nameBonus = normalizeVietnamese(vec.metadata.name).includes(normalizedQuery) ? 0.15 : 0

        return {
          metadata: vec.metadata,
          score: hybridScore + nameBonus,
          vectorScore,
          keywordScore
        }
      })

      // Sort by score and return top K with lower threshold (0.35)
      const results = scores
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .filter(item => item.score > 0.35) // Lowered from 0.5
        .map(item => item.metadata)

      console.log(`[RAG] Query: "${query}" -> Found ${results.length} results (threshold: 0.35)`)
      return results
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
  console.log(`✅ Loaded ${KNOWLEDGE_BASE.length} static docs into Vector Store`)

  // 2. Load dynamic products from database
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true, inventoryItem: true }
    })

    for (const product of products) {
      // Smart common combinations based on category
      let commonCombinations: string[] = []
      const categoryLower = product.category.name.toLowerCase()
      if (categoryLower.includes('xi măng') || categoryLower.includes('cement')) {
        commonCombinations = ['cát', 'đá', 'sắt thép']
      } else if (categoryLower.includes('gạch') || categoryLower.includes('brick')) {
        commonCombinations = ['xi măng', 'cát']
      } else if (categoryLower.includes('cát') || categoryLower.includes('sand')) {
        commonCombinations = ['xi măng', 'đá']
      } else if (categoryLower.includes('đá') || categoryLower.includes('stone')) {
        commonCombinations = ['xi măng', 'cát']
      } else if (categoryLower.includes('thép') || categoryLower.includes('sắt')) {
        commonCombinations = ['xi măng', 'dây buộc']
      }

      // Convert DB product to ProductKnowledge format with enhanced fields
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
          sku: product.sku,
          ...(product.weight && { weight: `${product.weight}kg` }),
          ...(product.dimensions && { dimensions: product.dimensions })
        },
        usage: product.tags || [], // Use tags as usage hints
        tips: [],
        warnings: [],
        commonCombinations,
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

    // Always check for policy keywords to prioritize them
    const policyResults: ProductKnowledge[] = []
    const normalizedQuery = normalizeVietnamese(query)

    if (normalizedQuery.includes('doi tra') || normalizedQuery.includes('tra hang') || normalizedQuery.includes('hoan tien') || normalizedQuery.includes('tra lai')) {
      const policy = KNOWLEDGE_BASE.find(d => d.id === 'policy_return')
      if (policy) policyResults.push(policy)
    }
    if (normalizedQuery.includes('giao hang') || normalizedQuery.includes('ship') || normalizedQuery.includes('van chuyen')) {
      const policy = KNOWLEDGE_BASE.find(d => d.id === 'policy_shipping')
      if (policy) policyResults.push(policy)
    }
    if (normalizedQuery.includes('bao hanh')) {
      const policy = KNOWLEDGE_BASE.find(d => d.id === 'policy_warranty')
      if (policy) policyResults.push(policy)
    }

    // Fallback to keyword search if vector search returns few results
    const keywordResults: ProductKnowledge[] = []
    if (vectorResults.length < 2) {
      // Check both original and normalized query for better matching
      if (query.toLowerCase().includes('insee')) keywordResults.push(...searchByBrand('INSEE'))
      if (query.toLowerCase().includes('hà tiên') || normalizedQuery.includes('ha tien')) keywordResults.push(...searchByBrand('Hà Tiên'))
      if (query.toLowerCase().includes('gạch') || normalizedQuery.includes('gach')) keywordResults.push(...searchByCategory('Gạch'))
      if (query.toLowerCase().includes('đá') || normalizedQuery.includes('da')) keywordResults.push(...searchByCategory('Đá'))
      if (query.toLowerCase().includes('cát') || normalizedQuery.includes('cat')) keywordResults.push(...searchByCategory('Cát'))
      if (query.toLowerCase().includes('xi măng') || normalizedQuery.includes('xi mang')) keywordResults.push(...searchByCategory('Xi măng'))
    }

    // Combine unique results: Policies -> Vector -> Keywords
    const combinedResults = [...policyResults]
    const existingIds = new Set(policyResults.map(r => r.id))

    for (const res of vectorResults) {
      if (!existingIds.has(res.id)) {
        combinedResults.push(res)
        existingIds.add(res.id)
      }
    }

    for (const res of keywordResults) {
      if (!existingIds.has(res.id)) {
        combinedResults.push(res)
        existingIds.add(res.id)
      }
    }

    return combinedResults.slice(0, topK)
  }

  // Generate augmented prompt with retrieved context
  static async generateAugmentedPrompt(userQuery: string, conversationHistory?: any[]): Promise<string> {
    // Expand short use-case queries to include product category
    let expandedQuery = userQuery
    const normalizedQuery = normalizeVietnamese(userQuery.toLowerCase())

    // Check if query is a use-case without product mention
    const useCasePatterns = [
      { pattern: /^(xay nha|xay nha o)$/i, expansion: 'xi măng cho xây nhà ở' },
      { pattern: /^(do mong|do be tong)$/i, expansion: 'xi măng cho đổ móng' },
      { pattern: /^(trat tuong|xay to)$/i, expansion: 'xi măng cho trát tường' },
      { pattern: /^(xay tuong|xay gach)$/i, expansion: 'xi măng cho xây tường' },
    ]

    for (const { pattern, expansion } of useCasePatterns) {
      if (pattern.test(normalizedQuery)) {
        expandedQuery = expansion
        console.log(`Query expanded: "${userQuery}" → "${expandedQuery}"`)
        break
      }
    }

    // Special handling for "Khuyến mãi" / "Giảm giá"
    if (normalizedQuery.includes('khuyen mai') || normalizedQuery.includes('giam gia') || normalizedQuery.includes('uu dai')) {
      const discountedProducts = await this.getDiscountedProducts()
      if (discountedProducts.length > 0) {
        const promoContext = discountedProducts.map((p: ProductKnowledge) =>
          `**${p.name}**: Giá ${p.pricing.basePrice.toLocaleString('vi-VN')}đ - ${p.pricing.bulkDiscount?.map((d: { minQuantity: number, discountPercent: number }) => `Mua >${d.minQuantity} giảm ${d.discountPercent}%`).join(', ')}`
        ).join('\n')

        return `
THÔNG TIN KHUYẾN MÃI (Sử dụng để trả lời):
${promoContext}

---
CÂU HỎI: ${userQuery}
YÊU CẦU: Giới thiệu các chương trình khuyến mãi đang có.
`
      }
    }

    // Special handling for "Tư vấn xây nhà"
    if (normalizedQuery.includes('tu van') && (normalizedQuery.includes('xay nha') || normalizedQuery.includes('xay dung'))) {
      // Retrieve the construction guide
      const guide = await this.retrieveContext('Quy trình xây nhà cơ bản', 1)
      if (guide.length > 0) {
        // Also get some key materials
        const materials = await this.retrieveContext('xi măng sắt thép', 3)
        const contextDocs = [...guide, ...materials]

        const contextText = contextDocs.map(doc => RAGService.formatProductForChat(doc)).join('\n---\n')

        return `
THÔNG TIN TƯ VẤN XÂY DỰNG:
${contextText}

---
CÂU HỎI: ${userQuery}
YÊU CẦU: Tư vấn quy trình xây nhà và gợi ý vật liệu cần thiết (xi măng, sắt thép) dựa trên thông tin trên.
`
      }
    }

    // Special handling for "Thanh toán"
    if (normalizedQuery.includes('thanh toan') || normalizedQuery.includes('chuyen khoan') || normalizedQuery.includes('tien mat')) {
      const policy = await this.retrieveContext('Chính sách thanh toán', 1)
      if (policy.length > 0) {
        const contextText = policy.map(doc => RAGService.formatProductForChat(doc)).join('\n---\n')
        return `
THÔNG TIN THANH TOÁN:
${contextText}

---
CÂU HỎI: ${userQuery}
YÊU CẦU: Hướng dẫn khách hàng về các phương thức thanh toán và thông tin chuyển khoản.
`
      }
    }

    // Special handling for "Giao hàng" / "Shipping"
    if (normalizedQuery.includes('giao hang') || normalizedQuery.includes('ship') || normalizedQuery.includes('van chuyen') || normalizedQuery.includes('phi ship')) {
      const policy = await this.retrieveContext('Chính sách giao hàng', 1)
      if (policy.length > 0) {
        const contextText = policy.map(doc => RAGService.formatProductForChat(doc)).join('\n---\n')
        return `
THÔNG TIN GIAO HÀNG:
${contextText}

---
CÂU HỎI: ${userQuery}
YÊU CẦU: Giải thích về phí vận chuyển, thời gian giao hàng và điều kiện freeship.
`
      }
    }

    // Special handling for "Đổi trả" / "Return"
    if (normalizedQuery.includes('doi tra') || normalizedQuery.includes('hoan tien') || normalizedQuery.includes('tra hang')) {
      const policy = await this.retrieveContext('Chính sách đổi trả', 1)
      if (policy.length > 0) {
        const contextText = policy.map(doc => RAGService.formatProductForChat(doc)).join('\n---\n')
        return `
THÔNG TIN ĐỔI TRẢ:
${contextText}

---
CÂU HỎI: ${userQuery}
YÊU CẦU: Giải thích quy định đổi trả, thời gian và điều kiện.
`
      }
    }

    // Special handling for "Bảo hành" / "Warranty"
    if (normalizedQuery.includes('bao hanh')) {
      const policy = await this.retrieveContext('Chính sách bảo hành', 1)
      if (policy.length > 0) {
        const contextText = policy.map(doc => RAGService.formatProductForChat(doc)).join('\n---\n')
        return `
THÔNG TIN BẢO HÀNH:
${contextText}

---
CÂU HỎI: ${userQuery}
YÊU CẦU: Giải thích chính sách bảo hành cho các loại sản phẩm.
`
      }
    }

    // Special handling for general "Tư vấn" (not specifically home building)
    if (normalizedQuery.includes('tu van') || normalizedQuery.includes('ho tro') || normalizedQuery.includes('ky thuat')) {
      const service = await this.retrieveContext('Dịch vụ tư vấn xây dựng', 1)
      if (service.length > 0) {
        const contextText = service.map(doc => RAGService.formatProductForChat(doc)).join('\n---\n')
        return `
THÔNG TIN DỊCH VỤ TƯ VẤN:
${contextText}

---
CÂU HỎI: ${userQuery}
YÊU CẦU: Giới thiệu về dịch vụ tư vấn của cửa hàng.
`
      }
    }

    // Use getProductRecommendations to get both primary and related products
    const relevantDocs = await this.getProductRecommendations(expandedQuery, 5)

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
3. **QUAN TRỌNG**: Khi khách hỏi về mục đích sử dụng (ví dụ: "xây nhà ở", "đổ móng"), hãy ưu tiên GỢI Ý SẢN PHẨM NGAY, không hỏi thêm thông tin chi tiết (diện tích, số tầng...). Chỉ hỏi thêm nếu khách muốn tính toán số lượng cụ thể.
4. Sau khi giới thiệu sản phẩm chính, nếu thấy có sản phẩm liên quan (ví dụ: khách hỏi xi măng, có cát/đá trong context), hãy gợi ý mua thêm để đủ bộ vật tư.
5. Nếu không có thông tin trong context, hãy dùng kiến thức chung nhưng nói rõ là "theo kiến thức chung".
6. Giọng điệu chuyên nghiệp, hữu ích.

VÍ DỤ TRẢ LỜI TỐT:

Khách: "Xi măng tốt"
Trả lời: "Chào bạn! Hiện tại shop có 4 loại xi măng chất lượng:
1. Xi măng INSEE PC40 - 135.000đ/bao - Cao cấp nhất, độ bền cao
2. Xi măng Hà Tiên PCB40 - 125.000đ/bao - Chất lượng tốt, giá rẻ hơn INSEE
3. Xi măng INSEE PC30 - 120.000đ/bao - Phù hợp xây tô
4. Xi măng Hà Tiên PC30 - 110.000đ/bao - Giá tốt nhất

Bạn cần xi măng cho công trình gì ạ? (đổ móng/xây tường/trát tường)
Ngoài ra, bạn cũng cần cát và đá để trộn bê tông không ạ?"

Khách: "Xây nhà ở"
Trả lời: "Chào bạn! Để xây nhà ở, bạn sẽ cần nhiều loại xi măng cho các công đoạn khác nhau:

**Cho kết cấu chịu lực (móng, cột, dầm, sàn):**
1. Xi măng INSEE PC40 - 135.000đ/bao - Cao cấp, độ bền cao nhất, phù hợp đổ bê tông
2. Xi măng Hà Tiên PCB40 - 125.000đ/bao - Chất lượng tốt, giá hợp lý hơn

**Cho xây tô, trát tường:**
3. Xi măng INSEE PC30 - 120.000đ/bao - Chất lượng ổn định
4. Xi măng Hà Tiên PC30 - 110.000đ/bao - Giá tốt nhất

💡 Bạn muốn tính toán số lượng cần thiết không ạ? Cho mình biết diện tích nhà để tư vấn chi tiết hơn."

Khách: "Đổ móng"
Trả lời: "Chào bạn! Để đổ móng, bạn nên dùng xi măng PC40 hoặc PCB40 vì độ bền cao:

1. **Xi măng INSEE PC40** - 135.000đ/bao
   - Chất lượng cao cấp nhất
   - Độ bền vượt trội, phù hợp móng chịu lực lớn
   
2. **Xi măng Hà Tiên PCB40** - 125.000đ/bao
   - Chất lượng tốt, giá rẻ hơn INSEE 10.000đ
   - Phù hợp cho móng nhà dân dụng

💡 Ngoài xi măng, bạn cũng cần cát và đá để trộn bê tông. Bạn có cần tư vấn thêm không ạ?"

Khách: "Trát tường"
Trả lời: "Chào bạn! Để trát tường, bạn nên dùng xi măng PC30:

1. **Xi măng Hà Tiên PC30** - 110.000đ/bao - Giá tốt nhất, chất lượng ổn
2. **Xi măng INSEE PC30** - 120.000đ/bao - Chất lượng cao hơn một chút

💡 Để trát tường, bạn cũng cần cát mịn. Bạn có muốn tư vấn thêm về cát không ạ?"
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
      console.log(`Found common combinations for ${topProduct.name}: `, topProduct.commonCombinations)

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
    let message = `** ${product.name}**\n`
    if (product.brand) message += `Thương hiệu: ${product.brand} \n`
    message += `Giá: ${product.pricing.basePrice.toLocaleString('vi-VN')} đ / ${product.pricing.unit} \n\n`
    message += `${product.description} \n`
    return message
  }

  static async getDiscountedProducts(): Promise<ProductKnowledge[]> {
    // Filter from static knowledge base
    const staticDeals = KNOWLEDGE_BASE.filter(p => p.pricing.bulkDiscount && p.pricing.bulkDiscount.length > 0)
    return staticDeals
  }
}

export default RAGService
