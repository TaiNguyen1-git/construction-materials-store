#!/usr/bin/env python3
"""
Semantic Search Service
Vector-based product search using embeddings

API Endpoints:
    POST /search/semantic - Semantic product search
    POST /search/index - Index products for search
    POST /search/suggest - Get search suggestions
"""

import re
import math
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

# Import synonyms from lexicon
from vietnamese_lexicon import VLXD_SYNONYMS, expand_query

# Try to import Google Generative AI for embeddings
try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False
    print("⚠️ google-generativeai not installed. Using fallback embeddings.")

# Try to import numpy for efficient vector operations
try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False


@dataclass
class SearchResult:
    """Result of semantic search"""
    product_id: str
    name: str
    category: str
    price: float
    score: float
    score_breakdown: Dict
    matched_terms: List[str]
    highlight: str


class VectorStore:
    """In-memory vector store for product embeddings"""
    
    def __init__(self):
        self.vectors = {}  # product_id -> {'embedding': [...], 'metadata': {...}}
        self.dimension = 768  # Gemini embedding dimension
    
    def upsert(self, product_id: str, embedding: List[float], metadata: Dict):
        """Add or update a product vector"""
        self.vectors[product_id] = {
            'embedding': embedding,
            'metadata': metadata
        }
    
    def delete(self, product_id: str):
        """Remove a product from the store"""
        if product_id in self.vectors:
            del self.vectors[product_id]
    
    def search(
        self, 
        query_vector: List[float], 
        top_k: int = 10,
        filters: Dict = None
    ) -> List[Tuple[str, float, Dict]]:
        """
        Search for similar vectors
        
        Returns:
            List of (product_id, similarity_score, metadata)
        """
        if not self.vectors:
            return []
        
        results = []
        
        for product_id, data in self.vectors.items():
            # Apply filters
            if filters:
                metadata = data['metadata']
                if filters.get('category') and metadata.get('category') != filters['category']:
                    continue
                if filters.get('minPrice') and metadata.get('price', 0) < filters['minPrice']:
                    continue
                if filters.get('maxPrice') and metadata.get('price', float('inf')) > filters['maxPrice']:
                    continue
                if filters.get('inStock') and not metadata.get('inStock', True):
                    continue
            
            # Calculate similarity
            similarity = self._cosine_similarity(query_vector, data['embedding'])
            results.append((product_id, similarity, data['metadata']))
        
        # Sort by similarity descending
        results.sort(key=lambda x: x[1], reverse=True)
        
        return results[:top_k]
    
    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        if HAS_NUMPY:
            a_arr = np.array(a)
            b_arr = np.array(b)
            return float(np.dot(a_arr, b_arr) / (np.linalg.norm(a_arr) * np.linalg.norm(b_arr) + 1e-10))
        else:
            dot_product = sum(aa * bb for aa, bb in zip(a, b))
            norm_a = math.sqrt(sum(aa * aa for aa in a))
            norm_b = math.sqrt(sum(bb * bb for bb in b))
            
            if norm_a == 0 or norm_b == 0:
                return 0.0
            
            return dot_product / (norm_a * norm_b)
    
    def get_stats(self) -> Dict:
        """Get store statistics"""
        return {
            'total_products': len(self.vectors),
            'dimension': self.dimension
        }


class EmbeddingService:
    """Service for generating text embeddings"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key
        self.model_name = 'models/text-embedding-004'
        self.dimension = 768
        
        if HAS_GENAI and api_key:
            genai.configure(api_key=api_key)
    
    def get_embedding(self, text: str) -> List[float]:
        """Get embedding vector for text"""
        if HAS_GENAI and self.api_key:
            try:
                result = genai.embed_content(
                    model=self.model_name,
                    content=text,
                    task_type="retrieval_document"
                )
                return result['embedding']
            except Exception as e:
                print(f"Embedding API error: {e}")
                return self._fallback_embedding(text)
        else:
            return self._fallback_embedding(text)
    
    def _fallback_embedding(self, text: str) -> List[float]:
        """
        Fallback: Generate simple hash-based pseudo-embedding
        This is NOT a real embedding but allows the system to work without API
        """
        import hashlib
        
        # Normalize text
        text = text.lower().strip()
        
        # Create pseudo-embedding using character n-grams
        embedding = [0.0] * self.dimension
        
        # Use word hashes to populate embedding dimensions
        words = text.split()
        for i, word in enumerate(words):
            word_hash = int(hashlib.md5(word.encode()).hexdigest(), 16)
            for j in range(min(10, self.dimension)):
                dim = (word_hash + j) % self.dimension
                embedding[dim] += 1.0 / (i + 1)
        
        # Normalize
        magnitude = math.sqrt(sum(x * x for x in embedding))
        if magnitude > 0:
            embedding = [x / magnitude for x in embedding]
        
        return embedding
    
    def batch_embed(self, texts: List[str]) -> List[List[float]]:
        """Get embeddings for multiple texts"""
        return [self.get_embedding(text) for text in texts]


class SemanticSearchEngine:
    """
    Semantic Search Engine using embeddings
    
    Hybrid Score = 0.60 × Semantic_Score + 0.25 × Keyword_Score + 0.15 × Boost_Factors
    """
    
    WEIGHTS = {
        'semantic': 0.60,
        'keyword': 0.25,
        'boost': 0.15
    }
    
    def __init__(self, api_key: str = None):
        self.embedding_service = EmbeddingService(api_key)
        self.vector_store = VectorStore()
    
    def index_product(self, product: Dict):
        """
        Index a product for search
        
        Args:
            product: Dictionary with:
                - id: Product ID
                - name: Product name
                - description: Product description
                - category: Category name
                - brand: Brand name
                - specifications: Product specs
                - price: Product price
                - inStock: Availability
        """
        # Build searchable text
        searchable_text = ' '.join(filter(None, [
            product.get('name', ''),
            product.get('category', ''),
            product.get('brand', ''),
            product.get('description', ''),
            str(product.get('specifications', ''))
        ]))
        
        # Get embedding
        embedding = self.embedding_service.get_embedding(searchable_text)
        
        # Store
        self.vector_store.upsert(
            product_id=product.get('id', product.get('product_id', '')),
            embedding=embedding,
            metadata={
                'name': product.get('name', ''),
                'category': product.get('category', ''),
                'brand': product.get('brand', ''),
                'price': product.get('price', 0),
                'inStock': product.get('inStock', True),
                'image': product.get('image', ''),
                'searchable_text': searchable_text
            }
        )
    
    def index_products(self, products: List[Dict]):
        """Index multiple products"""
        for product in products:
            self.index_product(product)
    
    def _calculate_keyword_score(self, query: str, text: str) -> Tuple[float, List[str]]:
        """Calculate keyword matching score"""
        query_terms = set(query.lower().split())
        text_lower = text.lower()
        
        matched = []
        for term in query_terms:
            if term in text_lower:
                matched.append(term)
        
        if not query_terms:
            return 0.0, []
        
        score = len(matched) / len(query_terms)
        return score, matched
    
    def _calculate_boost(self, metadata: Dict, query: str) -> float:
        """Calculate boost factors"""
        boost = 0.0
        
        # Exact name match
        if query.lower() in metadata.get('name', '').lower():
            boost += 0.1
        
        # In stock boost
        if metadata.get('inStock', True):
            boost += 0.05
        
        # Has image boost
        if metadata.get('image'):
            boost += 0.02
        
        # Popular category boost (can be customized)
        popular_categories = ['xi_mang', 'thep', 'gach']
        if metadata.get('category', '').lower() in popular_categories:
            boost += 0.03
        
        return boost
    
    def _highlight(self, text: str, matched_terms: List[str]) -> str:
        """Generate highlighted text"""
        result = text
        for term in matched_terms:
            pattern = re.compile(re.escape(term), re.IGNORECASE)
            result = pattern.sub(f'<em>{term}</em>', result)
        return result
    
    def search(
        self, 
        query: str,
        limit: int = 20,
        filters: Dict = None,
        expand_synonyms: bool = True
    ) -> Dict:
        """
        Perform semantic search
        
        Args:
            query: Search query
            limit: Maximum results
            filters: Filter options (category, minPrice, maxPrice, inStock)
            expand_synonyms: Whether to expand query with synonyms
            
        Returns:
            Search results with metadata
        """
        if not query.strip():
            return {
                'success': False,
                'error': 'Empty query'
            }
        
        # Expand query with synonyms
        queries = [query]
        if expand_synonyms:
            queries = expand_query(query)
        
        # Get query embedding (use first expanded query)
        main_query = queries[0]
        query_embedding = self.embedding_service.get_embedding(main_query)
        
        # Search vector store
        candidates = self.vector_store.search(query_embedding, limit * 2, filters)
        
        if not candidates:
            return {
                'success': True,
                'query': query,
                'totalResults': 0,
                'searchType': 'semantic',
                'results': [],
                'suggestions': []
            }
        
        # Calculate hybrid scores
        results = []
        for product_id, semantic_score, metadata in candidates:
            # Keyword score
            searchable_text = metadata.get('searchable_text', metadata.get('name', ''))
            keyword_score, matched_terms = self._calculate_keyword_score(query, searchable_text)
            
            # Also check expanded queries
            for expanded in queries[1:]:
                exp_score, exp_matched = self._calculate_keyword_score(expanded, searchable_text)
                if exp_score > keyword_score:
                    keyword_score = exp_score
                    matched_terms.extend(exp_matched)
            
            matched_terms = list(set(matched_terms))
            
            # Boost factors
            boost = self._calculate_boost(metadata, query)
            
            # Hybrid score
            hybrid_score = (
                self.WEIGHTS['semantic'] * semantic_score +
                self.WEIGHTS['keyword'] * keyword_score +
                self.WEIGHTS['boost'] * boost
            )
            
            results.append(SearchResult(
                product_id=product_id,
                name=metadata.get('name', ''),
                category=metadata.get('category', ''),
                price=metadata.get('price', 0),
                score=round(hybrid_score, 3),
                score_breakdown={
                    'semantic': round(semantic_score, 3),
                    'keyword': round(keyword_score, 3),
                    'boost': round(boost, 3)
                },
                matched_terms=matched_terms,
                highlight=self._highlight(metadata.get('name', ''), matched_terms)
            ))
        
        # Sort by hybrid score
        results.sort(key=lambda x: x.score, reverse=True)
        results = results[:limit]
        
        # Generate suggestions
        suggestions = self._generate_suggestions(query, results)
        
        # Generate facets
        facets = self._generate_facets(candidates)
        
        return {
            'success': True,
            'query': query,
            'expandedQueries': queries if len(queries) > 1 else None,
            'totalResults': len(results),
            'searchType': 'semantic',
            'results': [
                {
                    'productId': r.product_id,
                    'name': r.name,
                    'category': r.category,
                    'price': r.price,
                    'score': r.score,
                    'scoreBreakdown': r.score_breakdown,
                    'matchedTerms': r.matched_terms,
                    'highlight': r.highlight
                }
                for r in results
            ],
            'suggestions': suggestions,
            'facets': facets
        }
    
    def _generate_suggestions(self, query: str, results: List[SearchResult]) -> List[str]:
        """Generate search suggestions based on results"""
        suggestions = []
        
        # Add top result names as suggestions
        for result in results[:3]:
            if result.name.lower() != query.lower():
                suggestions.append(result.name.lower())
        
        # Add related category suggestions
        categories = list(set(r.category for r in results[:5] if r.category))
        for cat in categories[:2]:
            suggestions.append(f"{query} {cat}")
        
        return suggestions[:5]
    
    def _generate_facets(self, candidates: List[Tuple]) -> Dict:
        """Generate search facets (filters) from results"""
        categories = {}
        price_ranges = {'0-100k': 0, '100k-500k': 0, '500k-1M': 0, '1M+': 0}
        
        for _, _, metadata in candidates:
            # Category facet
            cat = metadata.get('category', 'Khác')
            categories[cat] = categories.get(cat, 0) + 1
            
            # Price facet
            price = metadata.get('price', 0)
            if price < 100000:
                price_ranges['0-100k'] += 1
            elif price < 500000:
                price_ranges['100k-500k'] += 1
            elif price < 1000000:
                price_ranges['500k-1M'] += 1
            else:
                price_ranges['1M+'] += 1
        
        return {
            'categories': [
                {'name': k, 'count': v}
                for k, v in sorted(categories.items(), key=lambda x: x[1], reverse=True)
            ],
            'priceRanges': [
                {'range': k, 'count': v}
                for k, v in price_ranges.items() if v > 0
            ]
        }


# Flask Blueprint for integration
def create_search_blueprint(api_key: str = None):
    """Create Flask Blueprint for semantic search"""
    from flask import Blueprint, request, jsonify
    import os
    
    bp = Blueprint('search', __name__, url_prefix='/search')
    
    # Get API key from environment if not provided
    if not api_key:
        api_key = os.environ.get('GEMINI_API_KEY')
    
    engine = SemanticSearchEngine(api_key)
    
    @bp.route('/semantic', methods=['POST'])
    def semantic_search():
        """Perform semantic search"""
        data = request.get_json() or {}
        
        query = data.get('query', data.get('q', ''))
        limit = data.get('limit', 20)
        filters = data.get('filters', {})
        expand = data.get('expandSynonyms', True)
        
        if not query:
            return jsonify({
                "success": False,
                "error": "Missing query"
            }), 400
        
        result = engine.search(query, limit, filters, expand)
        return jsonify(result)
    
    @bp.route('/index', methods=['POST'])
    def index_products():
        """Index products for search"""
        data = request.get_json() or {}
        
        products = data.get('products', [])
        if not products:
            return jsonify({
                "success": False,
                "error": "Missing products array"
            }), 400
        
        try:
            engine.index_products(products)
            return jsonify({
                "success": True,
                "message": f"Indexed {len(products)} products",
                "stats": engine.vector_store.get_stats()
            })
        except Exception as e:
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500
    
    @bp.route('/suggest', methods=['GET'])
    def suggest():
        """Get search suggestions"""
        query = request.args.get('q', '')
        
        if len(query) < 2:
            return jsonify({
                "success": True,
                "suggestions": []
            })
        
        # Quick search for suggestions
        result = engine.search(query, limit=5)
        
        suggestions = []
        if result.get('success'):
            for r in result.get('results', []):
                suggestions.append({
                    'type': 'product',
                    'text': r['name'],
                    'highlight': r['highlight']
                })
        
        return jsonify({
            "success": True,
            "suggestions": suggestions
        })
    
    @bp.route('/stats', methods=['GET'])
    def get_stats():
        """Get search index statistics"""
        return jsonify({
            "success": True,
            "data": engine.vector_store.get_stats()
        })
    
    return bp


if __name__ == "__main__":
    # Test
    engine = SemanticSearchEngine()
    
    # Index sample products
    sample_products = [
        {
            'id': 'prod_001',
            'name': 'Xi măng chống thấm Sika',
            'category': 'xi_mang',
            'brand': 'Sika',
            'description': 'Xi măng chống thấm cao cấp, dùng cho tường và sàn',
            'price': 125000,
            'inStock': True
        },
        {
            'id': 'prod_002',
            'name': 'Xi măng Holcim PCB40',
            'category': 'xi_mang',
            'brand': 'Holcim',
            'description': 'Xi măng chất lượng cao cho xây dựng',
            'price': 95000,
            'inStock': True
        },
        {
            'id': 'prod_003',
            'name': 'Gạch samot chịu nhiệt',
            'category': 'gach',
            'brand': 'VLXD',
            'description': 'Gạch chịu lửa, chịu nhiệt độ cao, dùng cho lò nung',
            'price': 85000,
            'inStock': True
        },
        {
            'id': 'prod_004',
            'name': 'Sơn chống thấm Jotun',
            'category': 'son',
            'brand': 'Jotun',
            'description': 'Sơn ngoại thất chống thấm hiệu quả',
            'price': 350000,
            'inStock': True
        },
        {
            'id': 'prod_005',
            'name': 'Thép Hòa Phát D10',
            'category': 'thep',
            'brand': 'Hòa Phát',
            'description': 'Thép xây dựng đường kính 10mm',
            'price': 18500,
            'inStock': True
        }
    ]
    
    print("=== Semantic Search Test ===\n")
    
    print("Indexing products...")
    engine.index_products(sample_products)
    print(f"Indexed {len(sample_products)} products\n")
    
    # Test searches
    test_queries = [
        "xi măng chống thấm",
        "gạch chịu lửa",  # Should find "gạch samot chịu nhiệt"
        "thép xây dựng",
        "sơn ngoại thất"
    ]
    
    for query in test_queries:
        print(f"Query: '{query}'")
        result = engine.search(query, limit=3)
        
        if result.get('success'):
            print(f"  Found {result['totalResults']} results:")
            for r in result['results']:
                print(f"    - {r['name']} (score: {r['score']:.2f})")
                print(f"      Semantic: {r['scoreBreakdown']['semantic']:.2f}, Keyword: {r['scoreBreakdown']['keyword']:.2f}")
        print()
