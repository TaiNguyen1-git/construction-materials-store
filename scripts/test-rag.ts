// Test script for RAG System
// Run: npx tsx scripts/test-rag.ts

import { RAGService } from '../src/lib/rag-service'
import KNOWLEDGE_BASE from '../src/lib/knowledge-base'

console.log('🚀 Testing RAG System for SmartBuild AI\n')
console.log('=' .repeat(60))

// Test queries
const testQueries = [
  'Xi măng INSEE giá bao nhiêu?',
  'Tôi cần gạch để xây tường',
  'Đá 1x2 dùng để làm gì?',
  'Cát xây dựng và cát vàng khác nhau như thế nào?',
  'Xi măng Hà Tiên có tốt không?',
  'Tôi muốn xây móng cần xi măng gì?',
  'Gạch đinh giá bao nhiêu?',
  'Mua xi măng 100 bao có giảm giá không?',
]

async function testRAG() {
  console.log(`\n📚 Knowledge Base: ${KNOWLEDGE_BASE.length} products loaded\n`)
  
  for (const query of testQueries) {
    console.log('\n' + '─'.repeat(60))
    console.log(`❓ Query: "${query}"`)
    console.log('─'.repeat(60))
    
    try {
      // Test context retrieval
      const results = await RAGService.retrieveContext(query, 2)
      
      if (results.length === 0) {
        console.log('❌ No results found')
        continue
      }
      
      console.log(`\n✅ Found ${results.length} relevant products:\n`)
      
      results.forEach((product, idx) => {
        console.log(`${idx + 1}. ${product.name} (${product.brand || product.supplier})`)
        console.log(`   💰 Giá: ${product.pricing.basePrice.toLocaleString('vi-VN')}đ/${product.pricing.unit}`)
        console.log(`   📝 ${product.description.substring(0, 100)}...`)
        
        if (product.pricing.bulkDiscount && product.pricing.bulkDiscount.length > 0) {
          console.log(`   🎁 Giảm giá: ${product.pricing.bulkDiscount[0].minQuantity}+ = -${product.pricing.bulkDiscount[0].discountPercent}%`)
        }
        
        // Test cross-sell
        RAGService.getCrossSellProducts(product.id).then(crossSell => {
          if (crossSell.length > 0) {
            console.log(`   🔗 Thường mua kèm: ${crossSell.slice(0, 2).map(p => p.name).join(', ')}`)
          }
        })
        
        console.log()
      })
      
      // Test formatted response
      console.log('📱 Formatted Chat Response:')
      console.log('─'.repeat(60))
      const formatted = RAGService.formatProductForChat(results[0])
      console.log(formatted)
      
    } catch (error) {
      console.error('❌ Error:', error)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ RAG Testing Complete!')
  console.log('='.repeat(60))
}

// Run tests
testRAG().catch(console.error)

export {}
