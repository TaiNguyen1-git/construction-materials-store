#!/usr/bin/env tsx
/**
 * Script to check if environment variables are loaded correctly
 */

// Load environment variables
import 'dotenv/config'

console.log('Checking environment variables...')
console.log('================================')

console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET')
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET')

if (process.env.GEMINI_API_KEY) {
  console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY.length)
  console.log('GEMINI_API_KEY starts with:', process.env.GEMINI_API_KEY.substring(0, 10) + '...')
}

if (process.env.OPENAI_API_KEY) {
  console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY.length)
  console.log('OPENAI_API_KEY starts with:', process.env.OPENAI_API_KEY.substring(0, 10) + '...')
}

console.log('\nAll environment variables:')
for (const key in process.env) {
  if (key.includes('KEY') || key.includes('SECRET') || key.includes('API')) {
    console.log(`${key}: ${process.env[key] ? 'SET' : 'NOT SET'}`)
  }
}