/**
 * Seed Marketplace Data - Tạo dữ liệu mẫu cho nhà thầu và dự án
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    const results: string[] = []

    try {
        // Step 1: Clear existing data
        results.push('Clearing existing data...')

        try {
            await prisma.contractorReview.deleteMany({})
            results.push('✓ Cleared reviews')
        } catch (e: any) {
            results.push(`Review clear skipped: ${e.message}`)
        }

        try {
            await prisma.projectApplication.deleteMany({})
            results.push('✓ Cleared applications')
        } catch (e: any) {
            results.push(`Application clear skipped: ${e.message}`)
        }

        try {
            await prisma.contractorProfile.deleteMany({})
            results.push('✓ Cleared contractor profiles')
        } catch (e: any) {
            results.push(`ContractorProfile clear error: ${e.message}`)
        }

        try {
            await prisma.constructionProject.deleteMany({})
            results.push('✓ Cleared projects')
        } catch (e: any) {
            results.push(`ConstructionProject clear error: ${e.message}`)
        }

        // Step 2: Create contractors one by one
        results.push('Creating contractors...')

        const contractor1 = await prisma.contractorProfile.create({
            data: {
                customerId: 'contractor_001',
                displayName: 'Nguyễn Văn Hùng - Xây Dựng Hùng Phát',
                bio: 'Chuyên xây dựng nhà ở, biệt thự tại Biên Hòa',
                phone: '0987654321',
                city: 'Biên Hòa',
                district: 'Tân Phong',
                skills: ['CONSTRUCTION', 'RENOVATION', 'MASONRY'],
                experienceYears: 15,
                teamSize: 12,
                isVerified: true,
                avgRating: 4.8,
                totalReviews: 45,
                completedJobs: 120,
                isAvailable: true,
                portfolioImages: [],
                portfolioDesc: [],
                documents: []
            }
        })
        results.push(`✓ Created contractor: ${contractor1.displayName}`)

        const contractor2 = await prisma.contractorProfile.create({
            data: {
                customerId: 'contractor_002',
                displayName: 'Trần Minh Tuấn - Điện Nước Tuấn',
                bio: 'Thợ điện nước chuyên nghiệp 24/7',
                phone: '0912345678',
                city: 'Biên Hòa',
                district: 'Long Bình',
                skills: ['PLUMBING', 'ELECTRICAL'],
                experienceYears: 10,
                teamSize: 5,
                isVerified: true,
                avgRating: 4.6,
                totalReviews: 32,
                completedJobs: 85,
                isAvailable: true,
                portfolioImages: [],
                portfolioDesc: [],
                documents: []
            }
        })
        results.push(`✓ Created contractor: ${contractor2.displayName}`)

        const contractor3 = await prisma.contractorProfile.create({
            data: {
                customerId: 'contractor_003',
                displayName: 'Lê Thị Hoa - Nội Thất Hoa Đẹp',
                bio: 'Thiết kế và thi công nội thất cao cấp',
                phone: '0909123456',
                city: 'Biên Hòa',
                district: 'Trảng Dài',
                skills: ['INTERIOR', 'CARPENTRY', 'PAINTING'],
                experienceYears: 8,
                teamSize: 8,
                isVerified: false,
                avgRating: 4.5,
                totalReviews: 28,
                completedJobs: 65,
                isAvailable: true,
                portfolioImages: [],
                portfolioDesc: [],
                documents: []
            }
        })
        results.push(`✓ Created contractor: ${contractor3.displayName}`)

        // Step 3: Create projects
        results.push('Creating projects...')

        const project1 = await prisma.constructionProject.create({
            data: {
                title: 'Sửa chữa nhà 2 tầng khu Tân Phong',
                description: 'Cần sửa chữa hệ thống điện, nước và sơn lại tường. Nhà 80m2.',
                projectType: 'RENOVATION',
                location: '45 Nguyễn Văn Trỗi',
                district: 'Tân Phong',
                city: 'Biên Hòa',
                estimatedBudget: 50000000,
                budgetType: 'NEGOTIABLE',
                requirements: ['Có kinh nghiệm 5 năm', 'Đội ngũ từ 3 người'],
                materialsNeeded: ['Sơn', 'Dây điện', 'Ống nước PVC'],
                images: [],
                contactName: 'Anh Minh',
                contactPhone: '0901234567',
                contactEmail: 'minh.bh@gmail.com',
                customerId: 'customer_001',
                status: 'OPEN',
                isUrgent: true,
                viewCount: 45
            }
        })
        results.push(`✓ Created project: ${project1.title}`)

        const project2 = await prisma.constructionProject.create({
            data: {
                title: 'Lát gạch sân vườn 100m2',
                description: 'Lát gạch terrazzo cho sân vườn biệt thự. Vật liệu do chủ nhà cung cấp.',
                projectType: 'FLOORING',
                location: '789 KDC Long Bình',
                district: 'Long Bình',
                city: 'Biên Hòa',
                estimatedBudget: 25000000,
                budgetType: 'FIXED',
                requirements: ['Thi công gọn gàng'],
                materialsNeeded: ['Gạch terrazzo', 'Xi măng'],
                images: [],
                contactName: 'Chị Lan',
                contactPhone: '0912345678',
                customerId: 'customer_002',
                status: 'OPEN',
                isUrgent: false,
                viewCount: 23
            }
        })
        results.push(`✓ Created project: ${project2.title}`)

        const project3 = await prisma.constructionProject.create({
            data: {
                title: 'Xây tường rào và cổng nhà',
                description: 'Xây mới tường rào cao 2m, dài 15m và cổng sắt.',
                projectType: 'NEW_CONSTRUCTION',
                location: '456 Phường Trảng Dài',
                district: 'Trảng Dài',
                city: 'Biên Hòa',
                estimatedBudget: 80000000,
                budgetType: 'NEGOTIABLE',
                requirements: ['Có bản vẽ thiết kế', 'Báo giá rõ ràng'],
                materialsNeeded: ['Gạch', 'Xi măng', 'Sắt', 'Cát'],
                images: [],
                contactName: 'Ông Tư',
                contactPhone: '0908765432',
                customerId: 'customer_003',
                status: 'OPEN',
                isUrgent: false,
                viewCount: 67
            }
        })
        results.push(`✓ Created project: ${project3.title}`)

        return NextResponse.json({
            success: true,
            message: 'Seed completed!',
            details: results,
            data: {
                contractors: 3,
                projects: 3
            }
        })
    } catch (error: any) {
        console.error('Seed error:', error)
        results.push(`ERROR: ${error.message}`)
        return NextResponse.json({
            success: false,
            error: error.message,
            details: results
        }, { status: 500 })
    }
}
