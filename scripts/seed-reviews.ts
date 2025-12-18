import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const products = await prisma.product.findMany()
    const customers = await prisma.customer.findMany()

    if (products.length === 0 || customers.length === 0) {
        console.error('Products or customers not found. Run seed.ts first.')
        return
    }

    const reviewTitles = [
        'Sản phẩm tuyệt vời',
        'Chất lượng rất tốt',
        'Giao hàng nhanh',
        'Giá cả hợp lý',
        'Rất hài lòng',
        'Đóng gói cẩn thận',
        'Nhân viên nhiệt tình',
        'Sẽ mua lại',
        'Đúng như mô tả',
        'Khuyên dùng'
    ]

    const reviewContents = [
        'Sản phẩm rất chất lượng, độ bền cao, phù hợp với công trình của tôi.',
        'Giá thành cạnh tranh nhất khu vực Biên Hòa, tôi rất tin tưởng cửa hàng.',
        'Dịch vụ vận chuyển chuyên nghiệp, vật liệu được bảo quản kỹ khi giao.',
        'Xi măng và sắt thép đều là hàng chính hãng, có chứng chỉ đầy đủ.',
        'Tôi đã mua ở đây nhiều lần và luôn hài lòng với thái độ phục vụ.',
        'Sản phẩm tốt nhưng thời gian giao hàng hơi lâu một chút do kẹt xe.',
        'Màu sắc gạch rất đẹp, đúng như mẫu trưng bày tại showroom.',
        'Tính toán vật liệu rất chính xác, giúp tôi tiết kiệm được nhiều chi phí.',
        'Một địa chỉ đáng tin cậy cho mọi nhà thầu xây dựng.',
        'Vật liệu xây dựng ở đây đạt chuẩn, thi công rất an tâm.'
    ]

    console.log(`Seeding reviews for ${products.length} products...`)

    for (const product of products) {
        // Add ~10 reviews for each product
        for (let i = 0; i < 10; i++) {
            const customer = customers[Math.floor(Math.random() * customers.length)]
            const rating = Math.floor(Math.random() * 2) + 4 // 4 or 5 stars

            try {
                await prisma.productReview.create({
                    data: {
                        productId: product.id,
                        customerId: customer.id,
                        rating,
                        title: reviewTitles[i % reviewTitles.length],
                        review: reviewContents[Math.floor(Math.random() * reviewContents.length)],
                        isVerified: Math.random() > 0.3,
                        isPublished: true,
                        helpfulCount: Math.floor(Math.random() * 20),
                        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
                    }
                })
            } catch (e) {
                // Skip duplicate reviews (unique constraint on productId, customerId, orderId)
            }
        }
    }

    console.log('✅ Seeded reviews successfully!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
