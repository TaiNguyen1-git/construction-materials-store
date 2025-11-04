import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Copy seasonal insights from original script
const SEASONAL_INSIGHTS = {
  byMonth: [
    { factor: 0.85, season: 'Mùa Xuân', note: 'Sau Tết, bắt đầu khởi công dự án mới' },
    { factor: 0.90, season: 'Mùa Xuân', note: 'Tăng trưởng sau nghỉ Tết' },
    { factor: 1.15, season: 'Mùa Xuân', note: 'Cao điểm xây dựng mùa khô' },
    { factor: 1.25, season: 'Mùa Khô', note: 'Thời tiết thuận lợi, nhiều dự án triển khai' },
    { factor: 1.35, season: 'Mùa Khô', note: 'Đỉnh cao xây dựng trước mùa mưa' },
    { factor: 1.30, season: 'Đầu Mùa Mưa', note: 'Hoàn thiện công trình trước mưa nhiều' },
    { factor: 1.10, season: 'Mùa Mưa', note: 'Giảm nhẹ do thời tiết không thuận lợi' },
    { factor: 0.95, season: 'Mùa Mưa', note: 'Tạm dừng nhiều công trình ngoài trời' },
    { factor: 1.00, season: 'Cuối Mùa Mưa', note: 'Bắt đầu tăng trở lại' },
    { factor: 1.20, season: 'Mùa Khô', note: 'Thời tiết tốt, tăng trưởng mạnh' },
    { factor: 1.15, season: 'Mùa Khô', note: 'Dự án cuối năm đẩy nhanh tiến độ' },
    { factor: 0.80, season: 'Cuối Năm', note: 'Giảm do nghỉ Tết, thanh toán công nợ' }
  ],
  byCategory: {
    'Xi măng & Bê tông': {
      peakMonths: [3, 4, 5, 10, 11],
      reason: 'Sử dụng nhiều trong móng, cột, dầm - thi công mùa khô'
    },
    'Thép xây dựng': {
      peakMonths: [3, 4, 5, 6],
      reason: 'Thi công kết cấu chính trong mùa khô'
    },
    'Gạch & Ốp lát': {
      peakMonths: [6, 7, 10, 11],
      reason: 'Hoàn thiện nội thất - ít ảnh hưởng thời tiết'
    },
    'Sơn & Hóa chất': {
      peakMonths: [1, 2, 3, 10, 11, 12],
      reason: 'Hoàn thiện cuối cùng, tránh mùa mưa'
    },
    'Điện & Nước': {
      peakMonths: [5, 6, 7, 8, 9],
      reason: 'Lắp đặt hệ thống trong giai đoạn hoàn thiện'
    }
  }
}

function getSeasonalInsight(month: number, category: string) {
  const monthData = SEASONAL_INSIGHTS.byMonth[month - 1]
  const categoryData = SEASONAL_INSIGHTS.byCategory[category as keyof typeof SEASONAL_INSIGHTS.byCategory]
  
  const isPeakMonth = categoryData?.peakMonths.includes(month)
  const seasonalFactor = monthData.factor
  
  let insight = `${monthData.season} (Tháng ${month}): ${monthData.note}.`
  
  if (isPeakMonth) {
    insight += ` Đây là tháng cao điểm cho ${category} - ${categoryData?.reason}.`
  } else {
    insight += ` ${categoryData?.reason || ''}`
  }
  
  return {
    factor: seasonalFactor,
    insight,
    isPeakMonth,
    season: monthData.season
  }
}

async function addDiversePredictions() {
  try {
    console.log('🎨 Adding diverse predictions for multiple months...\n')

    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        inventoryItem: true,
        category: true
      }
    })

    const currentMonth = new Date().getMonth() + 1
    
    // Add predictions for 6 different months ahead (not just 3)
    const targetMonths = [2, 3, 4, 5, 6, 7, 8, 9] // Multiple months for variety
    
    let created = 0
    for (const product of products) {
      if (!product.inventoryItem) continue

      const currentStock = product.inventoryItem.availableQuantity || 0
      const minStock = product.inventoryItem.minStockLevel || 30
      const categoryName = product.category.name

      // Create additional predictions for diverse months
      for (let i = 0; i < 3; i++) {
        const targetMonth = targetMonths[Math.floor(Math.random() * targetMonths.length)]
        const daysAhead = (targetMonth - currentMonth + (targetMonth < currentMonth ? 12 : 0)) * 30

        const seasonal = getSeasonalInsight(targetMonth, categoryName)
        
        // Base demand with seasonal adjustment
        const baseDemand = Math.floor(minStock * 1.5 * seasonal.factor * (1 + Math.random() * 0.2 - 0.1))
        const historicalAverage = baseDemand * 0.92
        const trend = seasonal.isPeakMonth ? 8 : seasonal.factor > 1 ? 3 : -2
        const safetyStock = baseDemand * 0.25
        const recommendedOrder = Math.max(0, baseDemand + safetyStock - currentStock)
        
        const baseConfidence = 0.92
        const confidenceBoost = seasonal.isPeakMonth ? 0.06 : 0.04
        const confidence = baseConfidence + (Math.random() * confidenceBoost)

        const factors = {
          historicalAverage: Math.round(historicalAverage * 100) / 100,
          trend: Math.round(trend * 100) / 100,
          seasonalMultiplier: Math.round(seasonal.factor * 100) / 100,
          seasonalInsight: seasonal.insight,
          season: seasonal.season,
          isPeakMonth: seasonal.isPeakMonth,
          currentStock,
          safetyStock: Math.round(safetyStock * 100) / 100,
          dataPoints: Math.floor(Math.random() * 25) + 35,
          categoryPattern: SEASONAL_INSIGHTS.byCategory[categoryName as keyof typeof SEASONAL_INSIGHTS.byCategory]?.reason || 'N/A'
        }

        const targetDate = new Date()
        targetDate.setDate(targetDate.getDate() + daysAhead)

        // Check if similar prediction already exists
        const existing = await prisma.inventoryPrediction.findFirst({
          where: {
            productId: product.id,
            timeframe: 'MONTH',
            factors: {
              path: ['season'],
              equals: seasonal.season
            }
          }
        })

        if (!existing) {
          await prisma.inventoryPrediction.create({
            data: {
              productId: product.id,
              predictionDate: new Date(),
              targetDate,
              predictedDemand: baseDemand,
              confidence: Math.round(confidence * 100) / 100,
              timeframe: 'MONTH',
              method: 'PROPHET_ML',
              factors,
              recommendedOrder: Math.round(recommendedOrder * 100) / 100
            }
          })
          created++
        }
      }
    }

    console.log(`✅ Added ${created} diverse predictions\n`)

    // Show statistics by month
    console.log('📊 Predictions by Season:')
    const allPredictions = await prisma.inventoryPrediction.findMany({
      where: { timeframe: 'MONTH' }
    })

    const byMonth: Record<string, number> = {}
    allPredictions.forEach(pred => {
      const season = (pred.factors as any)?.season || 'Unknown'
      byMonth[season] = (byMonth[season] || 0) + 1
    })

    Object.entries(byMonth).forEach(([season, count]) => {
      console.log(`   ${season}: ${count} predictions`)
    })

    console.log(`\n📈 Total MONTH predictions: ${allPredictions.length}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addDiversePredictions()
