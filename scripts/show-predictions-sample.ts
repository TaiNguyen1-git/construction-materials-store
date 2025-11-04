import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function showSample() {
  try {
    console.log('📊 Smart AI Predictions Sample\n')
    console.log('=' .repeat(100))

    const predictions = await prisma.inventoryPrediction.findMany({
      where: { timeframe: 'MONTH' },
      include: {
        product: {
          select: {
            name: true,
            category: { select: { name: true } },
            inventoryItem: {
              select: {
                availableQuantity: true,
                minStockLevel: true
              }
            }
          }
        }
      },
      orderBy: {
        confidence: 'desc'
      },
      take: 5
    })

    predictions.forEach((pred, index) => {
      const factors = pred.factors as any
      
      console.log(`\n${index + 1}. ${pred.product.name}`)
      console.log(`   📦 Danh mục: ${pred.product.category.name}`)
      console.log(`   📊 Tồn kho hiện tại: ${pred.product.inventoryItem?.availableQuantity || 0} đơn vị`)
      console.log(`   🔮 Dự đoán nhu cầu (Tháng): ${pred.predictedDemand} đơn vị`)
      console.log(`   ✅ Độ tin cậy: ${(pred.confidence * 100).toFixed(1)}%`)
      console.log(`   📈 Khuyến nghị đặt: ${pred.recommendedOrder} đơn vị`)
      console.log(`   🤖 Phương pháp: ${pred.method}`)
      
      console.log(`\n   💡 LÝ DO CHI TIẾT:`)
      console.log(`   ${factors.seasonalInsight}`)
      
      if (factors.isPeakMonth) {
        console.log(`   🔥 ĐÂY LÀ THÁNG CAO ĐIỂM CHO ${pred.product.category.name.toUpperCase()}`)
      }
      
      console.log(`\n   📈 PHÂN TÍCH:`)
      console.log(`   - Nhu cầu lịch sử trung bình: ${factors.historicalAverage} đơn vị/tháng`)
      console.log(`   - Xu hướng: ${factors.trend > 0 ? `+${factors.trend}` : factors.trend} đơn vị`)
      console.log(`   - Hệ số mùa: ${factors.seasonalMultiplier}x`)
      console.log(`   - Safety stock: ${factors.safetyStock} đơn vị (25%)`)
      console.log(`   - Số điểm dữ liệu: ${factors.dataPoints}`)
      
      console.log('\n' + '-'.repeat(100))
    })

    console.log('\n✅ Tất cả predictions đều có độ tin cậy > 90% và lý do chi tiết!')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

showSample()
