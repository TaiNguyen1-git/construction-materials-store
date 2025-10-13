#!/usr/bin/env tsx
/**
 * Script to list available Gemini models
 */

// Load environment variables
import 'dotenv/config'
import { GoogleGenerativeAI } from '@google/generative-ai'

async function listGeminiModels() {
  // Get the API key from environment variables
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY is not set in environment variables')
    console.log('Please set your Gemini API key in the .env file')
    return
  }

  try {
    console.log('📋 Listing available Gemini models...')
    console.log('====================================')
    
    // Initialize the Gemini client
    const genAI = new GoogleGenerativeAI(apiKey)
    
    // Common model names to test
    const modelNames = [
      'models/gemini-2.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.0-pro-latest',
      'gemini-1.0-pro',
      'gemini-pro',
      'models/gemini-1.5-flash',
      'models/gemini-1.0-pro',
      'models/gemini-pro'
    ]
    
    console.log('Testing available models:')
    
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        // Test with a simple prompt
        const result = await model.generateContent("Say 'hello'")
        const response = await result.response
        const text = response.text()
        console.log(`✅ ${modelName}: Available (test response: "${text.substring(0, 20)}...")`)
      } catch (error: any) {
        console.log(`❌ ${modelName}: Not available (${error.message})`)
      }
    }
    
    console.log('\n🎉 Model testing completed!')

  } catch (error: any) {
    console.error('❌ Error listing Gemini models:', error)
    
    if (error.message) {
      if (error.message.includes('API_KEY_INVALID')) {
        console.log('\n🔑 The API key appears to be invalid.')
        console.log('Please check your GEMINI_API_KEY in the .env file')
      }
    }
  }
}

// Add script to package.json
// Run the test if this script is executed directly
if (require.main === module) {
  listGeminiModels()
}

export default listGeminiModels