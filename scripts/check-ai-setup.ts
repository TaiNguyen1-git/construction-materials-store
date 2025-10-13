// Check AI Setup Status
// Run: npm run check:ai

import * as dotenv from 'dotenv'
import { AI_CONFIG, isAIEnabled } from '../src/lib/ai-config'
import KNOWLEDGE_BASE from '../src/lib/knowledge-base'

dotenv.config()

console.log('🤖 SmartBuild AI - AI Setup Check\n')
console.log('=' .repeat(70))

// 1. Check Environment Variables
console.log('\n📋 1. Environment Variables Check:')
console.log('─'.repeat(70))

const checks = {
  gemini: {
    name: 'Google Gemini API',
    key: process.env.GEMINI_API_KEY,
    required: false,
    url: 'https://makersuite.google.com/app/apikey'
  },
  openai: {
    name: 'OpenAI API',
    key: process.env.OPENAI_API_KEY,
    required: false,
    url: 'https://platform.openai.com/api-keys'
  },
  database: {
    name: 'Database URL',
    key: process.env.DATABASE_URL,
    required: true,
    url: 'PostgreSQL connection string'
  },
  jwt: {
    name: 'JWT Secret',
    key: process.env.JWT_SECRET,
    required: true,
    url: 'Generate with: openssl rand -base64 64'
  }
}

let hasError = false

for (const [id, check] of Object.entries(checks)) {
  const status = check.key ? '✅ CONFIGURED' : (check.required ? '❌ MISSING (REQUIRED)' : '⚠️  NOT SET (OPTIONAL)')
  const color = check.key ? '\x1b[32m' : (check.required ? '\x1b[31m' : '\x1b[33m')
  const reset = '\x1b[0m'
  
  console.log(`${color}${status}${reset} ${check.name}`)
  
  if (check.key) {
    const masked = check.key.substring(0, 8) + '...' + check.key.substring(check.key.length - 4)
    console.log(`   Key: ${masked}`)
  } else if (!check.key && check.required) {
    hasError = true
    console.log(`   ⚠️  Get from: ${check.url}`)
  } else if (!check.key) {
    console.log(`   💡 Get from: ${check.url}`)
  }
  console.log()
}

// 2. Check AI Status
console.log('─'.repeat(70))
console.log('\n🤖 2. AI Services Status:')
console.log('─'.repeat(70))

const aiEnabled = isAIEnabled()
if (aiEnabled) {
  console.log('✅ AI Services: ENABLED')
  if (AI_CONFIG.GEMINI.API_KEY) {
    console.log(`   Using: Google Gemini (${AI_CONFIG.GEMINI.MODEL})`)
  } else if (AI_CONFIG.OPENAI.API_KEY) {
    console.log(`   Using: OpenAI (${AI_CONFIG.OPENAI.MODEL})`)
  }
} else {
  console.log('❌ AI Services: DISABLED')
  console.log('   ⚠️  Set GEMINI_API_KEY or OPENAI_API_KEY to enable AI features')
  hasError = true
}
console.log()

// 3. Check Knowledge Base
console.log('─'.repeat(70))
console.log('\n📚 3. RAG Knowledge Base:')
console.log('─'.repeat(70))
console.log(`✅ Knowledge Base: ${KNOWLEDGE_BASE.length} products loaded`)
console.log()

const categories = new Set(KNOWLEDGE_BASE.map(p => p.category))
categories.forEach(cat => {
  const count = KNOWLEDGE_BASE.filter(p => p.category === cat).length
  console.log(`   📦 ${cat}: ${count} products`)
})
console.log()

// 4. Check AI Features
console.log('─'.repeat(70))
console.log('\n🎯 4. AI Features Status:')
console.log('─'.repeat(70))

const features = [
  {
    name: 'Chatbot + RAG',
    status: aiEnabled ? 'READY' : 'DISABLED',
    needs: 'Gemini or OpenAI API key',
    endpoint: '/api/chatbot'
  },
  {
    name: 'Material Calculator',
    status: 'READY',
    needs: 'No setup needed (rule-based)',
    endpoint: '/material-calculator'
  },
  {
    name: 'Inventory Prediction',
    status: 'READY',
    needs: 'No setup needed (statistical)',
    endpoint: '/api/predictions/inventory'
  },
  {
    name: 'OCR Invoice',
    status: aiEnabled ? 'READY' : 'LIMITED',
    needs: 'Gemini/OpenAI for text parsing',
    endpoint: '/api/ocr/invoice'
  },
  {
    name: 'Product Recommendations',
    status: 'READY',
    needs: 'No setup needed (rule-based)',
    endpoint: '/api/recommendations'
  },
  {
    name: 'Sentiment Analysis',
    status: aiEnabled ? 'READY' : 'DISABLED',
    needs: 'Gemini or OpenAI API key',
    endpoint: 'AIService.analyzeSentiment()'
  }
]

features.forEach(feature => {
  const statusColor = feature.status === 'READY' ? '\x1b[32m' : 
                     feature.status === 'LIMITED' ? '\x1b[33m' : '\x1b[31m'
  const reset = '\x1b[0m'
  
  console.log(`${statusColor}${feature.status}${reset} ${feature.name}`)
  console.log(`   Needs: ${feature.needs}`)
  console.log(`   Endpoint: ${feature.endpoint}`)
  console.log()
})

// 5. Quick Test (if AI enabled)
async function runTests() {
  if (aiEnabled) {
    console.log('─'.repeat(70))
    console.log('\n🧪 5. Quick AI Test:')
    console.log('─'.repeat(70))
    console.log('Testing RAG search...')
    
    try {
      const { RAGService } = await import('../src/lib/rag-service')
      const results = await RAGService.retrieveContext('Xi măng INSEE', 2)
      
      if (results.length > 0) {
        console.log('✅ RAG Test: PASSED')
        console.log(`   Found ${results.length} products:`)
        results.forEach(p => {
          console.log(`   - ${p.name}: ${p.pricing.basePrice.toLocaleString('vi-VN')}đ/${p.pricing.unit}`)
        })
      } else {
        console.log('⚠️  RAG Test: No results (but system working)')
      }
    } catch (error) {
      console.log('❌ RAG Test: FAILED')
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    console.log()
  }

  // Summary
  console.log('=' .repeat(70))
  console.log('\n📊 SUMMARY:')
  console.log('─'.repeat(70))

  if (hasError) {
    console.log('❌ SETUP INCOMPLETE')
    console.log('\n⚠️  Required actions:')
    if (!aiEnabled) {
      console.log('   1. Get Gemini API key from: https://makersuite.google.com/app/apikey')
      console.log('   2. Add to .env: GEMINI_API_KEY=your_key_here')
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('change-this')) {
      console.log('   3. Generate JWT secret: openssl rand -base64 64')
    }
    if (!process.env.DATABASE_URL) {
      console.log('   4. Configure PostgreSQL database')
    }
    console.log('\n   Then run: npm run dev')
  } else {
    console.log('✅ SETUP COMPLETE!')
    console.log('\n🚀 Ready to start:')
    console.log('   npm run dev')
    console.log('\n📝 Test features:')
    console.log('   - Material Calculator: http://localhost:3000/material-calculator')
    console.log('   - Chatbot: Click chat button on any page')
    console.log('   - RAG Test: npm run test:rag')
    
    if (!aiEnabled) {
      console.log('\n💡 Optional: Add Gemini API key for AI features')
      console.log('   Get key: https://makersuite.google.com/app/apikey')
    }
  }

  console.log('\n' + '=' .repeat(70))
}

// Run tests
runTests().catch(console.error)

export {}
