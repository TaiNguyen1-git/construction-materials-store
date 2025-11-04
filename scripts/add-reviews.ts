import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addReviews() {
  try {
    console.log('⭐ Adding product reviews...')

    const products = await prisma.product.findMany({
      take: 10,
      where: { isActive: true }
    })

    const customers = await prisma.customer.findMany({
      take: 5,
      include: { user: true }
    })

    if (products.length === 0 || customers.length === 0) {
      console.log('❌ Not enough products or customers')
      return
    }

    const reviewComments = [
      'Sản phẩm chất lượng tốt, đóng gói cẩn thận',
      'Giao hàng nhanh, sản phẩm đúng mô tả',
      'Giá cả hợp lý, sẽ mua lại',
      'Chất lượng tuyệt vời, rất hài lòng',
      'Sản phẩm ok, phù hợp với công trình',
      'Đóng gói tốt, không bị vỡ',
      'Giá tốt, chất lượng ổn',
      'Sẽ giới thiệu cho bạn bè',
      'Sản phẩm đúng như mong đợi',
      'Dịch vụ tốt, giao hàng đúng hẹn',
      'Sản phẩm bền, chắc chắn',
      'Rất hài lòng với chất lượng',
      'Giá cả phải chăng',
      'Giao hàng nhanh chóng',
      'Sẽ mua lại lần sau'
    ]

    let count = 0
    for (let i = 0; i < 25; i++) {
      const customer = customers[i % customers.length]
      const product = products[i % products.length]
      const rating = Math.floor(Math.random() * 2) + 4 // 4-5 stars

      try {
        await prisma.productReview.create({
          data: {
            customerId: customer.id,
            productId: product.id,
            rating,
            title: `Đánh giá ${product.name}`,
            review: reviewComments[i % reviewComments.length],
            isVerified: true,
            isPublished: true,
            helpfulCount: Math.floor(Math.random() * 15)
          }
        })
        count++
      } catch (error: any) {
        // Skip if duplicate
        if (!error.message.includes('Unique constraint')) {
          console.log(`⚠️  Could not create review ${i}:`, error.message)
        }
      }
    }

    console.log(`✅ Created ${count} product reviews`)
  } catch (error) {
    console.error('❌ Error adding reviews:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addReviews()
