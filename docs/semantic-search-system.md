# Tài Liệu Kỹ Thuật: Hệ Thống Tìm Kiếm Ngữ Nghĩa (Semantic Search)

## Tổng Quan

### Mục Tiêu
Xây dựng hệ thống tìm kiếm thông minh có khả năng hiểu ngữ nghĩa truy vấn của người dùng, không chỉ dựa vào từ khóa chính xác, giúp tìm được sản phẩm phù hợp ngay cả khi người dùng không biết tên chính xác.

### Vấn Đề Hiện Tại

```
Tìm kiếm truyền thống (Keyword-based):

User search: "gạch chịu lửa"
Database:    "Gạch samot chịu nhiệt", "Gạch ống B4"
Result:      ❌ Không tìm thấy! (vì không có từ "chịu lửa")

Vấn đề:
• "chịu lửa" ≠ "chịu nhiệt" (text matching thất bại)
• User không biết "samot" là loại gạch chịu nhiệt
• Mất khách hàng vì không tìm được sản phẩm
```

### Giải Pháp: Semantic Search

```
User search: "gạch chịu lửa"
           ↓ Embedding
Vector A:  [0.23, 0.85, 0.12, 0.67, ...]

Database products:
  "Gạch samot" → Vector B: [0.21, 0.82, 0.15, 0.65, ...]
  "Gạch ống B4" → Vector C: [0.19, 0.78, 0.18, 0.62, ...]

Similarity:
  cos(A, B) = 0.92 ✓ (rất giống!)
  cos(A, C) = 0.85 ✓ (khá giống)

Result: ✅ Tìm thấy cả hai!
```

### Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────────┐
│                  SEMANTIC SEARCH SYSTEM                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [User Query] "gạch chịu lửa giá rẻ"                        │
│       │                                                     │
│       ↓                                                     │
│  [Query Processing]                                         │
│       ├── Query expansion (synonyms)                        │
│       ├── Intent detection                                  │
│       └── Filter extraction (giá rẻ → sort by price)        │
│                     │                                       │
│                     ↓                                       │
│  [Embedding Model]                                          │
│       └── Gemini text-embedding-004                         │
│           Output: 768-dimensional vector                    │
│                     │                                       │
│                     ↓                                       │
│  [Vector Search]                                            │
│       └── Cosine similarity với product vectors             │
│                     │                                       │
│                     ↓                                       │
│  [Re-ranking]                                               │
│       ├── Combine semantic score + keyword score            │
│       ├── Apply filters (price, category, stock)            │
│       └── Boost by relevance factors                        │
│                     │                                       │
│                     ↓                                       │
│  [Results]                                                  │
│       └── Ranked list of products                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Embedding Model

### Lựa Chọn Model

| Model | Dimension | Tiếng Việt | Cost | Recommendation |
|-------|-----------|------------|------|----------------|
| **Gemini text-embedding-004** | 768 | ✅ Tốt | Free tier có | ⭐ Recommended |
| OpenAI text-embedding-3-small | 1536 | ✅ Tốt | Paid | Alternative |
| Sentence-BERT (multilingual) | 768 | ⚠️ Khá | Free | Self-hosted |
| PhoBERT | 768 | ✅ Rất tốt | Free | Vietnamese-specific |

### Gemini Embedding Integration

```python
from google.generativeai import GenerativeModel
import google.generativeai as genai

genai.configure(api_key=GEMINI_API_KEY)

def get_embedding(text: str) -> list[float]:
    """
    Get embedding vector for text using Gemini
    """
    model = genai.GenerativeModel('models/text-embedding-004')
    result = genai.embed_content(
        model='models/text-embedding-004',
        content=text,
        task_type="retrieval_document"
    )
    return result['embedding']  # 768-dimensional vector

# Example
query_embedding = get_embedding("gạch chịu lửa")
# Output: [0.023, -0.156, 0.089, ..., 0.045]  # 768 floats
```

### TypeScript Implementation (Next.js)

```typescript
// lib/embedding-service.ts

import { GoogleGenerativeAI } from '@google/generative-ai';

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export class EmbeddingService {
  private model = genai.getGenerativeModel({ model: 'text-embedding-004' });

  async getEmbedding(text: string): Promise<number[]> {
    const result = await this.model.embedContent(text);
    return result.embedding.values;
  }

  async batchEmbed(texts: string[]): Promise<number[][]> {
    const embeddings = await Promise.all(
      texts.map(text => this.getEmbedding(text))
    );
    return embeddings;
  }
}
```

---

## Vector Storage & Search

### Option 1: In-Memory (Simple, for small catalog)

```typescript
// lib/vector-store.ts

interface VectorEntry {
  id: string;
  productId: string;
  text: string;
  embedding: number[];
  metadata: {
    name: string;
    category: string;
    price: number;
  };
}

class InMemoryVectorStore {
  private vectors: VectorEntry[] = [];

  add(entry: VectorEntry) {
    this.vectors.push(entry);
  }

  search(queryVector: number[], topK: number = 10): VectorEntry[] {
    const scored = this.vectors.map(entry => ({
      entry,
      score: this.cosineSimilarity(queryVector, entry.embedding)
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => s.entry);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
```

### Option 2: MongoDB Atlas Vector Search

```javascript
// MongoDB Atlas Search Index Configuration
{
  "mappings": {
    "dynamic": true,
    "fields": {
      "embedding": {
        "type": "knnVector",
        "dimensions": 768,
        "similarity": "cosine"
      }
    }
  }
}

// Aggregation Pipeline for Vector Search
db.products.aggregate([
  {
    "$vectorSearch": {
      "index": "product_embeddings",
      "path": "embedding",
      "queryVector": [0.023, -0.156, ...],  // Query embedding
      "numCandidates": 100,
      "limit": 10
    }
  },
  {
    "$project": {
      "name": 1,
      "price": 1,
      "score": { "$meta": "vectorSearchScore" }
    }
  }
])
```

### Option 3: Pinecone (Scalable, managed)

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
});

const index = pinecone.index('products');

// Upsert vectors
await index.upsert([
  {
    id: 'prod_001',
    values: embedding,  // 768-dim vector
    metadata: {
      name: 'Gạch samot chịu nhiệt',
      category: 'gach',
      price: 85000
    }
  }
]);

// Query
const results = await index.query({
  vector: queryEmbedding,
  topK: 10,
  includeMetadata: true
});
```

---

## Công Thức Tính Toán

### 1. Cosine Similarity

```
                    A · B           Σ(Ai × Bi)
cos(θ) = ───────────────────── = ─────────────────────
          ‖A‖ × ‖B‖             √Σ(Ai²) × √Σ(Bi²)

Kết quả: -1 đến 1
  1.0  = Identical
  0.7+ = Very similar
  0.5+ = Similar
  0.3+ = Somewhat related
  <0.3 = Not related
```

### 2. Hybrid Score (Semantic + Keyword)

```
Hybrid_Score = α × Semantic_Score + β × Keyword_Score + γ × Boost_Factors

Weights:
  α = 0.60 (Semantic similarity)
  β = 0.25 (Keyword matching)
  γ = 0.15 (Boost factors)

Keyword_Score = matched_terms / query_terms

Boost_Factors:
  + 0.1 if exact_name_match
  + 0.05 if in_stock
  + 0.05 if has_image
  - 0.1 if out_of_stock
```

### 3. Query Expansion

```python
SYNONYMS = {
    'chịu lửa': ['chịu nhiệt', 'refractory', 'samot'],
    'thép': ['sắt', 'steel', 'inox'],
    'xi măng': ['cement', 'ximang', 'xm'],
    'rẻ': ['giá rẻ', 'tiết kiệm', 'phải chăng'],
    'tốt': ['chất lượng', 'bền', 'đảm bảo']
}

def expand_query(query: str) -> list[str]:
    """Expand query with synonyms"""
    expanded = [query]
    
    for term, synonyms in SYNONYMS.items():
        if term in query.lower():
            for syn in synonyms:
                expanded.append(query.lower().replace(term, syn))
    
    return list(set(expanded))

# Example
expand_query("gạch chịu lửa")
# Output: ["gạch chịu lửa", "gạch chịu nhiệt", "gạch samot", "gạch refractory"]
```

---

## Ví Dụ Tính Toán

### Scenario

```
User Query: "xi măng chống thấm giá rẻ"

Step 1: Query Expansion
  Expanded: ["xi măng chống thấm giá rẻ", "cement chống thấm", "xi măng waterproof"]

Step 2: Get Query Embedding
  query_vector = [0.15, -0.23, 0.45, ..., 0.08]  # 768 dims

Step 3: Search Products
  Product A: "Xi măng chống thấm Sika"
    embedding = [0.14, -0.21, 0.43, ..., 0.09]
    semantic_score = cosine(query, A) = 0.92

  Product B: "Xi măng Holcim PCB40"
    embedding = [0.12, -0.18, 0.38, ..., 0.11]
    semantic_score = cosine(query, B) = 0.71

  Product C: "Sơn chống thấm Jotun"
    embedding = [0.08, -0.25, 0.52, ..., 0.05]
    semantic_score = cosine(query, C) = 0.58

Step 4: Calculate Hybrid Score
  Product A:
    semantic = 0.92
    keyword = 4/4 = 1.0 (all terms match)
    boost = 0.05 (in_stock)
    hybrid = 0.60×0.92 + 0.25×1.0 + 0.15×0.05 = 0.8095

  Product B:
    semantic = 0.71
    keyword = 2/4 = 0.5 (xi măng matches)
    boost = 0.05
    hybrid = 0.60×0.71 + 0.25×0.5 + 0.15×0.05 = 0.5585

  Product C:
    semantic = 0.58
    keyword = 2/4 = 0.5 (chống thấm matches)
    boost = 0.05
    hybrid = 0.60×0.58 + 0.25×0.5 + 0.15×0.05 = 0.4805

Step 5: Final Ranking
  1. Xi măng chống thấm Sika (0.81) ✅
  2. Xi măng Holcim PCB40 (0.56)
  3. Sơn chống thấm Jotun (0.48)
```

---

## API Specification

### Endpoint: Semantic Search

```
GET /api/search?q=xi+măng+chống+thấm&limit=20
```

### Request Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| q | string | required | Search query |
| limit | number | 20 | Max results |
| category | string | null | Filter by category |
| minPrice | number | null | Minimum price |
| maxPrice | number | null | Maximum price |
| inStock | boolean | false | Only in-stock items |

### Response

```json
{
  "success": true,
  "data": {
    "query": "xi măng chống thấm",
    "totalResults": 15,
    "searchType": "semantic",
    "results": [
      {
        "productId": "prod_001",
        "name": "Xi măng chống thấm Sika",
        "category": "xi_mang",
        "price": 125000,
        "image": "/images/sika-waterproof.jpg",
        "inStock": true,
        "score": 0.81,
        "scoreBreakdown": {
          "semantic": 0.92,
          "keyword": 1.0,
          "boost": 0.05
        },
        "matchedTerms": ["xi măng", "chống thấm"],
        "highlight": "<em>Xi măng</em> <em>chống thấm</em> Sika"
      },
      ...
    ],
    "suggestions": [
      "xi măng chống thấm sika",
      "keo chống thấm",
      "sơn chống thấm"
    ],
    "facets": {
      "categories": [
        { "name": "Xi măng", "count": 8 },
        { "name": "Phụ gia", "count": 5 },
        { "name": "Sơn", "count": 2 }
      ],
      "priceRanges": [
        { "range": "0-100k", "count": 3 },
        { "range": "100k-200k", "count": 8 },
        { "range": "200k+", "count": 4 }
      ]
    }
  }
}
```

---

## Indexing Pipeline

### Product Indexing Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  INDEXING PIPELINE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Product Created/Updated]                                  │
│       │                                                     │
│       ↓                                                     │
│  [Generate Searchable Text]                                 │
│       │                                                     │
│       │  searchable_text = f"{name} {category} {brand}      │
│       │                      {description} {specs}"         │
│       │                                                     │
│       ↓                                                     │
│  [Get Embedding]                                            │
│       │                                                     │
│       │  embedding = gemini.embed(searchable_text)          │
│       │                                                     │
│       ↓                                                     │
│  [Store in Vector DB]                                       │
│       │                                                     │
│       │  vectorStore.upsert({                               │
│       │    id: productId,                                   │
│       │    embedding: embedding,                            │
│       │    metadata: { name, price, category, ... }         │
│       │  })                                                 │
│       │                                                     │
│       ↓                                                     │
│  [Update Search Index]                                      │
│       └── Ready for search!                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Batch Indexing (Initial Setup)

```typescript
async function indexAllProducts() {
  const products = await prisma.product.findMany({
    include: { category: true, brand: true }
  });

  const embeddingService = new EmbeddingService();
  const vectorStore = new VectorStore();

  for (const product of products) {
    const searchableText = [
      product.name,
      product.category?.name,
      product.brand?.name,
      product.description,
      product.specifications
    ].filter(Boolean).join(' ');

    const embedding = await embeddingService.getEmbedding(searchableText);

    await vectorStore.upsert({
      id: product.id,
      embedding,
      metadata: {
        name: product.name,
        price: product.price,
        category: product.category?.name,
        inStock: product.stock > 0
      }
    });

    // Rate limit for Gemini API
    await sleep(100);
  }

  console.log(`Indexed ${products.length} products`);
}
```

---

## Search UI Enhancement

### Autocomplete with Semantic Understanding

```typescript
// components/SearchAutocomplete.tsx

export function SearchAutocomplete() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const debouncedSearch = useDebouncedCallback(async (q: string) => {
    if (q.length < 2) return;

    const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`);
    const data = await res.json();

    setSuggestions(data.suggestions);
  }, 300);

  return (
    <div className="search-container">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          debouncedSearch(e.target.value);
        }}
        placeholder="Tìm kiếm sản phẩm..."
      />
      
      {suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map((s, i) => (
            <li key={i} onClick={() => handleSelect(s)}>
              {s.type === 'product' && <ProductIcon />}
              {s.type === 'category' && <CategoryIcon />}
              <span dangerouslySetInnerHTML={{ __html: s.highlight }} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### "Did You Mean?" Feature

```typescript
function generateDidYouMean(query: string, results: any[]): string | null {
  if (results.length > 5) return null;  // Enough results

  // Find most similar product name
  const topResult = results[0];
  if (topResult && topResult.score < 0.5) {
    // Query might be misspelled
    return topResult.name;
  }

  return null;
}

// Usage in UI
{didYouMean && (
  <p className="did-you-mean">
    Có phải bạn muốn tìm: 
    <a href={`/search?q=${didYouMean}`}>{didYouMean}</a>?
  </p>
)}
```

---

## Technology Stack

### Libraries & Services

| Component | Technology | Notes |
|-----------|------------|-------|
| Embedding Model | Gemini text-embedding-004 | Free tier available |
| Vector Store | MongoDB Atlas Vector Search | Or Pinecone |
| Text Processing | Underthesea | Vietnamese NLP |
| API | Next.js API Routes | Existing stack |
| Caching | Redis / In-memory | Optional |

### Infrastructure

| Component | Platform | Cost |
|-----------|----------|------|
| Search API | Vercel | Free |
| Vector DB | MongoDB Atlas | Free tier |
| Embedding API | Google AI | Free tier (60 req/min) |

---

## Metrics & Evaluation

### Search Quality Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| MRR (Mean Reciprocal Rank) | > 0.7 | Correct result position |
| Recall@10 | > 85% | % relevant items in top 10 |
| Zero-result Rate | < 5% | Searches with no results |
| Click-through Rate | > 30% | Users clicking results |

### Latency Metrics

| Metric | Target |
|--------|--------|
| P50 Latency | < 200ms |
| P95 Latency | < 500ms |
| P99 Latency | < 1000ms |

### A/B Testing

```
Experiment: Semantic Search vs Keyword Search

Group A (Control): Keyword search only
Group B (Test): Semantic + Keyword hybrid

Metrics to compare:
• Conversion rate
• Search-to-purchase rate
• Zero-result rate
• User satisfaction (survey)
```

---

## Ưu Điểm & Hạn Chế

### Ưu Điểm

1. **Hiểu ngữ nghĩa**: "chịu lửa" tìm được "chịu nhiệt"
2. **Typo tolerant**: Sai chính tả vẫn tìm được
3. **Multilingual**: Tìm bằng tiếng Việt hoặc tiếng Anh
4. **Zero-result reduction**: Giảm trường hợp không tìm thấy
5. **Better UX**: Khách hàng tìm được sản phẩm nhanh hơn

### Hạn Chế

1. **Latency**: Chậm hơn keyword search (thêm embedding step)
2. **Cost**: Embedding API có giới hạn request
3. **Index maintenance**: Cần re-index khi thêm sản phẩm
4. **Cold start**: Cần index toàn bộ catalog trước

### So Sánh

| Aspect | Keyword Search | Semantic Search |
|--------|----------------|-----------------|
| Speed | ⚡ Fast (< 50ms) | 🐢 Medium (200-500ms) |
| Accuracy | ⚠️ Exact match only | ✅ Understands meaning |
| Synonyms | ❌ No | ✅ Yes |
| Typos | ❌ Fails | ✅ Tolerant |
| Cost | 💰 Free | 💰 API costs |
| Setup | 🟢 Easy | 🟡 Medium |

---

## Implementation Roadmap

### Phase 1: MVP (1-2 days)
- [ ] Integrate Gemini Embedding API
- [ ] Build in-memory vector store
- [ ] Create search API endpoint
- [ ] Basic UI integration

### Phase 2: Production (3-5 days)
- [ ] Migrate to MongoDB Atlas Vector Search
- [ ] Add query expansion
- [ ] Implement hybrid scoring
- [ ] Add caching layer

### Phase 3: Enhancement (ongoing)
- [ ] A/B testing framework
- [ ] Analytics & monitoring
- [ ] Personalized ranking
- [ ] Feedback loop for relevance

---

*Tài liệu được tạo: 08/01/2026*
*Phiên bản: 1.0*
