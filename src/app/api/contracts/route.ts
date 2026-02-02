/**
 * Contracts API - SME Feature 3
 * 
 * Endpoints:
 * - GET /api/contracts - Danh sách hợp đồng
 * - POST /api/contracts - Tạo hợp đồng mới
 * - PUT /api/contracts - Cập nhật/Kích hoạt hợp đồng
 */

import { NextRequest, NextResponse } from 'next/server'
import { pricingEngine } from '@/lib/pricing-engine'
import { prisma } from '@/lib/prisma'

// GET /api/contracts
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const customerId = searchParams.get('customerId')
        const contractId = searchParams.get('contractId')
        const status = searchParams.get('status')
        const includeExpired = searchParams.get('includeExpired') === 'true'

        if (contractId) {
            // Lấy chi tiết một hợp đồng
            const contract = await prisma.contract.findUnique({
                where: { id: contractId },
                include: {
                    customer: {
                        include: { user: true }
                    },
                    contractPrices: true
                }
            })

            if (!contract) {
                return NextResponse.json(
                    { error: 'Không tìm thấy hợp đồng' },
                    { status: 404 }
                )
            }

            // Lấy thêm thông tin sản phẩm
            const enrichedPrices = await Promise.all(
                contract.contractPrices.map(async (cp) => {
                    const product = await prisma.product.findUnique({
                        where: { id: cp.productId },
                        select: { name: true, sku: true, price: true }
                    })
                    return {
                        ...cp,
                        productName: product?.name,
                        productSku: product?.sku,
                        basePrice: product?.price
                    }
                })
            )

            return NextResponse.json({
                ...contract,
                contractPrices: enrichedPrices
            })
        }

        if (customerId) {
            // Lấy hợp đồng của khách hàng
            const contracts = await pricingEngine.getCustomerContracts(
                customerId,
                includeExpired
            )
            return NextResponse.json(contracts)
        }

        // Lấy tất cả hợp đồng
        const where = status ? { status: status as any } : undefined
        const contracts = await prisma.contract.findMany({
            where,
            include: {
                customer: {
                    include: { user: true }
                },
                _count: {
                    select: { contractPrices: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(contracts)
    } catch (error) {
        console.error('Contracts GET API error:', error)
        return NextResponse.json(
            { error: 'Lỗi xử lý yêu cầu' },
            { status: 500 }
        )
    }
}

// POST /api/contracts - Tạo hợp đồng mới
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            customerId,
            name,
            description,
            contractType,
            validFrom,
            validTo,
            totalValue,
            creditTermDays,
            specialCreditLimit,
            terms,
            products
        } = body

        if (!customerId || !name || !validFrom || !validTo || !products?.length) {
            return NextResponse.json(
                { error: 'Thiếu thông tin bắt buộc: customerId, name, validFrom, validTo, products' },
                { status: 400 }
            )
        }

        const contract = await pricingEngine.createContract({
            customerId,
            name,
            description,
            contractType,
            validFrom: new Date(validFrom),
            validTo: new Date(validTo),
            totalValue,
            creditTermDays,
            specialCreditLimit,
            terms,
            products
        })

        return NextResponse.json(contract)
    } catch (error) {
        console.error('Contracts POST API error:', error)
        return NextResponse.json(
            { error: 'Lỗi tạo hợp đồng' },
            { status: 500 }
        )
    }
}

// PUT /api/contracts - Cập nhật hoặc kích hoạt hợp đồng
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { action, contractId, approvedBy, status, data } = body

        if (action === 'activate') {
            if (!contractId || !approvedBy) {
                return NextResponse.json(
                    { error: 'Thiếu contractId hoặc approvedBy' },
                    { status: 400 }
                )
            }

            const contract = await pricingEngine.activateContract(contractId, approvedBy)
            return NextResponse.json(contract)
        }

        if (action === 'update-status') {
            if (!contractId || !status) {
                return NextResponse.json(
                    { error: 'Thiếu contractId hoặc status' },
                    { status: 400 }
                )
            }

            const contract = await prisma.contract.update({
                where: { id: contractId },
                data: { status }
            })

            return NextResponse.json(contract)
        }

        if (action === 'update') {
            if (!contractId || !data) {
                return NextResponse.json(
                    { error: 'Thiếu contractId hoặc data' },
                    { status: 400 }
                )
            }

            const contract = await prisma.contract.update({
                where: { id: contractId },
                data: {
                    name: data.name,
                    description: data.description,
                    validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
                    validTo: data.validTo ? new Date(data.validTo) : undefined,
                    creditTermDays: data.creditTermDays,
                    specialCreditLimit: data.specialCreditLimit,
                    terms: data.terms
                }
            })

            return NextResponse.json(contract)
        }

        if (action === 'check-expired') {
            // Kiểm tra hợp đồng hết hạn
            const result = await pricingEngine.checkExpiredContracts()
            return NextResponse.json(result)
        }

        if (action === 'add-product') {
            // Thêm sản phẩm vào hợp đồng
            const { productId, fixedPrice, discountPercent, minQuantity, maxQuantity } = body

            if (!contractId || !productId) {
                return NextResponse.json(
                    { error: 'Thiếu contractId hoặc productId' },
                    { status: 400 }
                )
            }

            const contractPrice = await prisma.contractPrice.upsert({
                where: {
                    contractId_productId: { contractId, productId }
                },
                create: {
                    contractId,
                    productId,
                    fixedPrice,
                    discountPercent,
                    minQuantity: minQuantity || 0,
                    maxQuantity
                },
                update: {
                    fixedPrice,
                    discountPercent,
                    minQuantity,
                    maxQuantity
                }
            })

            return NextResponse.json(contractPrice)
        }

        return NextResponse.json(
            { error: 'Action không hợp lệ' },
            { status: 400 }
        )
    } catch (error) {
        console.error('Contracts PUT API error:', error)
        return NextResponse.json(
            { error: 'Lỗi xử lý yêu cầu' },
            { status: 500 }
        )
    }
}

// DELETE /api/contracts - Xóa hợp đồng hoặc sản phẩm khỏi hợp đồng
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const contractPriceId = searchParams.get('contractPriceId')
        const contractId = searchParams.get('contractId')

        if (contractId) {
            // Xóa toàn bộ hợp đồng và các bảng giá liên quan
            await prisma.$transaction([
                prisma.contractPrice.deleteMany({
                    where: { contractId }
                }),
                prisma.contract.delete({
                    where: { id: contractId }
                })
            ])
            return NextResponse.json({ success: true, message: 'Đã xóa hợp đồng' })
        }

        if (!contractPriceId) {
            return NextResponse.json(
                { error: 'Thiếu contractPriceId hoặc contractId' },
                { status: 400 }
            )
        }

        await prisma.contractPrice.delete({
            where: { id: contractPriceId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Contracts DELETE API error:', error)
        return NextResponse.json(
            { error: 'Lỗi xử lý yêu cầu' },
            { status: 500 }
        )
    }
}
