#!/usr/bin/env tsx
/**
 * Test script for Gemini AI integration
 * This script tests the basic functionality of the Gemini API
 */

// Load environment variables
import 'dotenv/config'
import { GoogleGenerativeAI } from '@google/generative-ai'

async function testGemini() {
  // Get the API key from environment variables
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY is not set in environment variables')
    console.log('Please set your Gemini API key in the .env file')
    return
  }

  try {
    console.log('🧪 Testing Gemini AI Integration')
    console.log('================================')
    
    // Initialize the Gemini client
    const genAI = new GoogleGenerativeAI(apiKey)
    
    // Use the model specified in the environment variables
    const modelName = process.env.GEMINI_MODEL || "models/gemini-2.5-flash"
    console.log(`Using model: ${modelName}`)
    
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: parseFloat(process.env.GEMINI_TEMPERATURE || "0.7")
      }
    })

    console.log('✅ Gemini client initialized successfully')
    
    // Test a simple prompt
    const prompt = "What is the capital of France?"
    
    console.log(`\n📝 Sending test prompt: "${prompt}"`)
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    console.log('✅ Response received:')
    console.log(text)
    
    // Test a more complex prompt related to construction materials
    const constructionPrompt = "List 3 common construction materials and their typical uses"
    
    console.log(`\n🏗️ Sending construction-related prompt: "${constructionPrompt}"`)
    
    const constructionResult = await model.generateContent(constructionPrompt)
    const constructionResponse = await constructionResult.response
    const constructionText = constructionResponse.text()
    
    console.log('✅ Construction materials response:')
    console.log(constructionText)
    
    console.log('\n🎉 All tests completed successfully!')
    console.log('\nTo use Gemini in the application:')
    console.log('1. Make sure your GEMINI_API_KEY is set in the .env file')
    console.log('2. The application will automatically use Gemini instead of OpenAI')
    console.log('3. No code changes are needed in the application')

  } catch (error: any) {
    console.error('❌ Error testing Gemini:', error)
    
    if (error.message) {
      if (error.message.includes('API_KEY_INVALID')) {
        console.log('\n🔑 The API key appears to be invalid.')
        console.log('Please check your GEMINI_API_KEY in the .env file')
      } else if (error.message.includes('quota')) {
        console.log('\n💰 You may have exceeded your API quota.')
        console.log('Check your Google AI Studio dashboard for usage information')
      }
    }
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testGemini()
}

export default testGemini