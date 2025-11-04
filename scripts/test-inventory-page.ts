async function testInventoryPageData() {
  const baseURL = 'http://localhost:3000'
  
  console.log('🧪 Testing Inventory Page Data Flow...\n')

  try {
    // Simulate what the inventory page does
    console.log('1️⃣ Fetching Products...')
    const productsRes = await fetch(`${baseURL}/api/products`)
    const productsData = await productsRes.json()
    const productsArray = productsData.data?.data || productsData.data || []
    console.log(`✅ Products: ${productsArray.length}`)
    
    if (productsArray.length > 0) {
      const sample = productsArray[0]
      console.log(`   Sample: ${sample.name}`)
      console.log(`   - Has inventoryItem: ${!!sample.inventoryItem}`)
      console.log(`   - Stock: ${sample.inventoryItem?.quantity || 0}`)
      console.log(`   - Min: ${sample.inventoryItem?.minStockLevel || 0}`)
    }

    console.log('\n2️⃣ Fetching AI Predictions (MONTH)...')
    const predictionsRes = await fetch(`${baseURL}/api/predictions/inventory?timeframe=MONTH`, {
      headers: {
        'x-user-role': 'MANAGER',
        'x-user-id': 'test'
      }
    })
    const predictionsData = await predictionsRes.json()
    console.log('   Raw response:', JSON.stringify(predictionsData).substring(0, 200))
    const predictions = predictionsData.data?.predictions || predictionsData.predictions || []
    console.log(`✅ Predictions: ${predictions.length}`)
    console.log(`   Type: ${Array.isArray(predictions) ? 'array' : typeof predictions}`)
    
    if (predictions.length > 0) {
      const sample = predictions[0]
      console.log(`   Sample: ${sample.productName}`)
      console.log(`   - Predicted Demand: ${sample.predictedDemand}`)
      console.log(`   - Confidence: ${(sample.confidence * 100).toFixed(1)}%`)
      console.log(`   - Recommended Order: ${sample.recommendedOrder}`)
    }

    console.log('\n3️⃣ Fetching Recommendations...')
    const recommendationsRes = await fetch(`${baseURL}/api/recommendations/purchase?timeframe=MONTH`)
    const recommendationsData = await recommendationsRes.json()
    const recommendations = recommendationsData.data?.recommendations || []
    console.log(`✅ Recommendations: ${recommendations.length}`)
    
    if (recommendations.length > 0) {
      const sample = recommendations[0]
      console.log(`   Sample: ${sample.productName}`)
      console.log(`   - Priority: ${sample.priority}`)
      console.log(`   - Current Stock: ${sample.currentStock}`)
      console.log(`   - Recommended Quantity: ${sample.recommendedQuantity}`)
      console.log(`   - Reason: ${sample.reason}`)
    }

    console.log('\n4️⃣ Fetching Movements...')
    const movementsRes = await fetch(`${baseURL}/api/inventory/movements`, {
      headers: {
        'x-user-role': 'MANAGER',
        'x-user-id': 'test'
      }
    })
    const movementsData = await movementsRes.json()
    const movements = movementsData.data || []
    console.log(`✅ Movements: ${movements.length}`)
    
    if (movements.length > 0) {
      const sample = movements[0]
      console.log(`   Sample: ${sample.product?.name}`)
      console.log(`   - Type: ${sample.movementType}`)
      console.log(`   - Quantity: ${sample.quantity}`)
      console.log(`   - Previous: ${sample.previousStock} → New: ${sample.newStock}`)
    }

    console.log('\n✅ All data ready for Inventory Page!')
    console.log('\n📊 Summary:')
    console.log(`   Products: ${productsArray.length}`)
    console.log(`   AI Predictions: ${predictions.length}`)
    console.log(`   Recommendations: ${recommendations.length}`)
    console.log(`   Movements: ${movements.length}`)

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

testInventoryPageData()
