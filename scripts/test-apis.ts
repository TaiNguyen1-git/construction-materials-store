async function testAPIs() {
  const baseURL = 'http://localhost:3000'
  
  console.log('🧪 Testing Inventory APIs...\n')

  try {
    // Test predictions API
    console.log('1️⃣ Testing /api/predictions/inventory')
    const predictionsRes = await fetch(`${baseURL}/api/predictions/inventory?timeframe=MONTH`, {
      headers: {
        'x-user-role': 'MANAGER',
        'x-user-id': 'test'
      }
    })
    
    if (predictionsRes.ok) {
      const data = await predictionsRes.json()
      console.log('✅ Predictions API Response:')
      console.log(`   Status: ${predictionsRes.status}`)
      console.log(`   Predictions count: ${data.data?.predictions?.length || 0}`)
      if (data.data?.predictions?.length > 0) {
        console.log(`   Sample: ${data.data.predictions[0].productName} - ${data.data.predictions[0].predictedDemand}`)
      }
    } else {
      console.log(`❌ Predictions API failed: ${predictionsRes.status}`)
      console.log(await predictionsRes.text())
    }

    // Test movements API
    console.log('\n2️⃣ Testing /api/inventory/movements')
    const movementsRes = await fetch(`${baseURL}/api/inventory/movements`, {
      headers: {
        'x-user-role': 'MANAGER',
        'x-user-id': 'test'
      }
    })
    
    if (movementsRes.ok) {
      const data = await movementsRes.json()
      console.log('✅ Movements API Response:')
      console.log(`   Status: ${movementsRes.status}`)
      console.log(`   Movements count: ${data.data?.length || 0}`)
      if (data.data?.length > 0) {
        console.log(`   Sample: ${data.data[0].product?.name} - ${data.data[0].movementType}`)
      }
    } else {
      console.log(`❌ Movements API failed: ${movementsRes.status}`)
      console.log(await movementsRes.text())
    }

    // Test products API
    console.log('\n3️⃣ Testing /api/products')
    const productsRes = await fetch(`${baseURL}/api/products`)
    
    if (productsRes.ok) {
      const data = await productsRes.json()
      console.log('✅ Products API Response:')
      console.log(`   Status: ${productsRes.status}`)
      const products = data.data?.data || data.data || []
      console.log(`   Products count: ${products.length}`)
      if (products.length > 0) {
        const sample = products[0]
        console.log(`   Sample product:`)
        console.log(`     - Name: ${sample.name}`)
        console.log(`     - Has inventoryItem: ${!!sample.inventoryItem}`)
        console.log(`     - Stock: ${sample.inventoryItem?.quantity || 'N/A'}`)
      }
    } else {
      console.log(`❌ Products API failed: ${productsRes.status}`)
    }

    // Test recommendations API
    console.log('\n4️⃣ Testing /api/recommendations/purchase')
    const recommendationsRes = await fetch(`${baseURL}/api/recommendations/purchase?timeframe=MONTH`)
    
    if (recommendationsRes.ok) {
      const data = await recommendationsRes.json()
      console.log('✅ Recommendations API Response:')
      console.log(`   Status: ${recommendationsRes.status}`)
      const recommendations = data.data?.recommendations || []
      console.log(`   Recommendations count: ${recommendations.length}`)
      if (recommendations.length > 0) {
        console.log(`   Sample: ${recommendations[0].productName} - Priority: ${recommendations[0].priority}`)
        console.log(`   Urgent orders: ${data.data?.summary?.urgentOrders || 0}`)
      }
    } else {
      console.log(`❌ Recommendations API failed: ${recommendationsRes.status}`)
      console.log(await recommendationsRes.text())
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

testAPIs()
