import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateBanners() {
    console.log('--- UPDATING BANNERS TO LOCAL IMAGES ---')

    const bannerUpdates = [
        { title: 'Vật Liệu Xây Dựng Chất Lượng Cao', imageUrl: '/images/banner_1.png' },
        { title: 'Hợp Tác Nhà Thầu - SME', imageUrl: '/images/banner_2.png' },
        { title: 'Hệ Thống Phân Phối Toàn Quốc', imageUrl: '/images/banner_3.png' }
    ]

    for (const update of bannerUpdates) {
        const result = await prisma.banner.updateMany({
            where: { title: update.title },
            data: { imageUrl: update.imageUrl }
        })
        console.log(`✅ Updated banner "${update.title}": ${result.count} records affected`)
    }

    // Default update for any other banners I might have created with wrong URLs
    await prisma.banner.updateMany({
        where: { imageUrl: { startsWith: 'https://images.unsplash.com' } },
        data: { imageUrl: '/images/banner_1.png' } // Fallback to a valid local one
    })

    console.log('✨ Banner update completed!')
}

updateBanners()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
