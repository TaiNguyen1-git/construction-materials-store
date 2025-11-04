import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanup() {
  try {
    console.log('🧹 Cleaning up old predictions...\n')
    
    // Delete predictions older than 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const deleted = await prisma.inventoryPrediction.deleteMany({
      where: {
        predictionDate: {
          lt: yesterday
        }
      }
    })
    
    console.log(`✅ Deleted ${deleted.count} old predictions`)
    
    const remaining = await prisma.inventoryPrediction.count()
    console.log(`📊 Remaining predictions: ${remaining}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanup()
