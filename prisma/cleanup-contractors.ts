/**
 * Cleanup script to remove malformed contractor data
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🧹 Cleaning up malformed contractor profiles...')

    // Delete profiles where customerId is not a valid ObjectId (doesn't look like a hex string of length 24)
    // Actually, we can just delete all profiles starting with 'contractor_'
    const result = await prisma.contractorProfile.deleteMany({
        where: {
            customerId: {
                startsWith: 'contractor_'
            }
        }
    })

    console.log(`✅ Deleted ${result.count} malformed contractor profiles.`)

    // Also check if any exist with names that look like our demo data from the bad seed
    const result2 = await prisma.contractorProfile.deleteMany({
        where: {
            displayName: {
                in: [
                    'Công ty XD Hoàng Phát',
                    'CTCP Xây dựng Minh Đức',
                    'Nhà thầu Trường Thành',
                    'Công ty TNHH Phúc An',
                    'XD Tân Phát Lộc',
                    'Công ty XD Thịnh Vượng',
                    'DNTN Xây dựng Hưng Long',
                    'Nhà thầu Đại Việt',
                    'Thợ điện Văn Minh',
                    'Nội thất Gia Hưng'
                ]
            }
        }
    })
    console.log(`✅ Deleted ${result2.count} profiles by name.`)
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
