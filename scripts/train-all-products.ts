/**
 * Train Prophet models for all active products
 * Run: npx tsx scripts/train-all-products.ts
 */

import { PrismaClient } from '@prisma/client'
import { spawn } from 'child_process'
import path from 'path'

const prisma = new PrismaClient()

interface TrainingResult {
  productId: string
  productName: string
  success: boolean
  accuracy?: number
  error?: string
  duration?: number
}

async function trainModel(productId: string): Promise<TrainingResult> {
  const startTime = Date.now()
  
  return new Promise((resolve) => {
    console.log(`\n[TRAIN] Starting training for: ${productId}`)
    
    const python = spawn('python', [
      path.join(process.cwd(), 'scripts', 'ml-service', 'train_prophet.py'),
      productId
    ])

    let output = ''
    let errorOutput = ''

    python.stdout.on('data', (data) => {
      const text = data.toString()
      output += text
      process.stdout.write(text)
    })

    python.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })

    python.on('close', (code) => {
      const duration = Date.now() - startTime
      
      if (code === 0) {
        // Extract accuracy from output
        const accuracyMatch = output.match(/Accuracy: ([\d.]+)%/)
        const accuracy = accuracyMatch ? parseFloat(accuracyMatch[1]) : null
        
        resolve({
          productId,
          productName: '',
          success: true,
          accuracy: accuracy || undefined,
          duration
        })
      } else {
        resolve({
          productId,
          productName: '',
          success: false,
          error: errorOutput || 'Training failed',
          duration
        })
      }
    })

    python.on('error', (error) => {
      resolve({
        productId,
        productName: '',
        success: false,
        error: `Failed to start Python: ${error.message}`,
        duration: Date.now() - startTime
      })
    })
  })
}

async function main() {
  console.log('=' .repeat(70))
  console.log('Train Prophet Models for All Products')
  console.log('=' .repeat(70))
  console.log()

  try {
    // Get all active products
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { 
        id: true, 
        name: true,
        sku: true
      },
      orderBy: { name: 'asc' },
      take: 20 // Limit to 20 products for now
    })

    console.log(`Found ${products.length} active products\n`)

    if (products.length === 0) {
      console.log('No products to train!')
      return
    }

    // Train models sequentially
    const results: TrainingResult[] = []
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      console.log(`\n[${i + 1}/${products.length}] Training: ${product.name}`)
      console.log(`Product ID: ${product.id}`)
      console.log(`SKU: ${product.sku}`)
      
      const result = await trainModel(product.id)
      result.productName = product.name
      results.push(result)

      // Small delay between trainings
      if (i < products.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // Summary
    console.log('\n' + '='.repeat(70))
    console.log('TRAINING SUMMARY')
    console.log('='.repeat(70))
    
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    
    console.log(`\nTotal: ${results.length}`)
    console.log(`Successful: ${successful.length}`)
    console.log(`Failed: ${failed.length}`)
    
    if (successful.length > 0) {
      const avgAccuracy = successful.reduce((sum, r) => sum + (r.accuracy || 0), 0) / successful.length
      const totalDuration = successful.reduce((sum, r) => sum + (r.duration || 0), 0)
      
      console.log(`\nAverage Accuracy: ${avgAccuracy.toFixed(2)}%`)
      console.log(`Total Training Time: ${(totalDuration / 1000).toFixed(1)}s`)
      console.log(`Average per Model: ${(totalDuration / successful.length / 1000).toFixed(1)}s`)
    }
    
    if (failed.length > 0) {
      console.log('\n[FAILED MODELS]')
      failed.forEach(r => {
        console.log(`- ${r.productName} (${r.productId}): ${r.error}`)
      })
    }
    
    if (successful.length > 0) {
      console.log('\n[SUCCESSFUL MODELS]')
      successful.forEach(r => {
        console.log(`- ${r.productName}: ${r.accuracy?.toFixed(2)}% accuracy`)
      })
    }
    
    console.log('\n' + '='.repeat(70))
    console.log('[DONE] Training completed!')
    console.log('='.repeat(70))

  } catch (error) {
    console.error('\n[ERROR] Training script failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
