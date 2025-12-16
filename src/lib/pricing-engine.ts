/**
 * Pricing Engine - SME Feature 3: Giá B2B & Hợp đồng
 * 
 * Engine tính giá linh hoạt theo nhiều cấp độ:
 * 1. Giá hợp đồng (Contract Price) - Ưu tiên cao nhất
 * 2. Giá khuyến mãi (Promotion)
 * 3. Giá theo bảng giá khách hàng (Price List)
 * 4. Giá niêm yết (Base Price)
 */

import { prisma } from './prisma'

export interface PriceResult {
    productId: string
    basePrice: number
    effectivePrice: number
    discountAmount: number
    discountPercent: number
    priceSource: 'CONTRACT' | 'PROMOTION' | 'PRICE_LIST' | 'BASE'
    priceSourceId?: string
    priceSourceName?: string
    contractNumber?: string
    isLocked: boolean // Nhân viên không được sửa giá
    validUntil?: Date
    notes?: string
}

export interface ContractInfo {
    contractId: string
    contractNumber: string
    contractName: string
    status: string
    validFrom: Date
    validTo: Date
    creditTermDays: number
    specialCreditLimit?: number | null
    products: Array<{
        productId: string
        productName: string
        fixedPrice?: number | null
        discountPercent?: number | null
    }>
}

export class PricingEngine {
    /**
     * Lấy giá hiệu lực cho sản phẩm theo context khách hàng
     */
    static async getEffectivePrice(
        productId: string,
        customerId?: string,
        quantity: number = 1
    ): Promise<PriceResult> {
        // Lấy thông tin sản phẩm
        const product = await prisma.product.findUnique({
            where: { id: productId }
        })

        if (!product) {
            throw new Error('Không tìm thấy sản phẩm')
        }

        const basePrice = product.price

        // Nếu không có khách hàng, trả về giá gốc
        if (!customerId) {
            return {
                productId,
                basePrice,
                effectivePrice: basePrice,
                discountAmount: 0,
                discountPercent: 0,
                priceSource: 'BASE',
                isLocked: false
            }
        }

        // Lấy thông tin khách hàng
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: { user: true }
        })

        if (!customer) {
            return {
                productId,
                basePrice,
                effectivePrice: basePrice,
                discountAmount: 0,
                discountPercent: 0,
                priceSource: 'BASE',
                isLocked: false
            }
        }

        const today = new Date()

        // 1. Kiểm tra giá hợp đồng (Ưu tiên cao nhất)
        const contractPrice = await this.getContractPrice(
            productId,
            customerId,
            quantity,
            today
        )

        if (contractPrice) {
            return contractPrice
        }

        // 2. Kiểm tra bảng giá theo loại khách hàng
        const priceListResult = await this.getPriceListPrice(
            productId,
            customer.customerType,
            basePrice,
            today
        )

        if (priceListResult) {
            return priceListResult
        }

        // 3. Trả về giá gốc
        return {
            productId,
            basePrice,
            effectivePrice: basePrice,
            discountAmount: 0,
            discountPercent: 0,
            priceSource: 'BASE',
            isLocked: false
        }
    }

    /**
     * Lấy giá từ hợp đồng
     */
    private static async getContractPrice(
        productId: string,
        customerId: string,
        quantity: number,
        today: Date
    ): Promise<PriceResult | null> {
        // Tìm hợp đồng đang hiệu lực
        const contract = await prisma.contract.findFirst({
            where: {
                customerId,
                status: 'ACTIVE',
                validFrom: { lte: today },
                validTo: { gte: today }
            },
            include: {
                contractPrices: {
                    where: { productId }
                }
            }
        })

        if (!contract || contract.contractPrices.length === 0) {
            return null
        }

        const contractPrice = contract.contractPrices[0]

        // Kiểm tra điều kiện số lượng
        if (quantity < contractPrice.minQuantity) {
            return null
        }
        if (contractPrice.maxQuantity && quantity > contractPrice.maxQuantity) {
            return null
        }

        // Lấy giá gốc sản phẩm
        const product = await prisma.product.findUnique({
            where: { id: productId }
        })
        const basePrice = product?.price || 0

        // Tính giá hiệu lực
        let effectivePrice: number
        let discountPercent: number

        if (contractPrice.fixedPrice !== null && contractPrice.fixedPrice !== undefined) {
            // Giá cố định
            effectivePrice = contractPrice.fixedPrice
            discountPercent = ((basePrice - effectivePrice) / basePrice) * 100
        } else if (contractPrice.discountPercent !== null && contractPrice.discountPercent !== undefined) {
            // Chiết khấu %
            discountPercent = contractPrice.discountPercent
            effectivePrice = basePrice * (1 - discountPercent / 100)
        } else {
            return null
        }

        const discountAmount = basePrice - effectivePrice

        return {
            productId,
            basePrice,
            effectivePrice,
            discountAmount,
            discountPercent,
            priceSource: 'CONTRACT',
            priceSourceId: contract.id,
            priceSourceName: contract.name,
            contractNumber: contract.contractNumber,
            isLocked: true, // Giá hợp đồng luôn khóa
            validUntil: contract.validTo,
            notes: contractPrice.notes || undefined
        }
    }

    /**
     * Lấy giá từ bảng giá theo loại khách hàng
     */
    private static async getPriceListPrice(
        productId: string,
        customerType: string,
        basePrice: number,
        today: Date
    ): Promise<PriceResult | null> {
        // Tìm bảng giá áp dụng cho loại khách hàng
        const priceLists = await prisma.priceList.findMany({
            where: {
                isActive: true,
                customerTypes: { has: customerType as any },
                OR: [
                    { validFrom: null, validTo: null },
                    {
                        validFrom: { lte: today },
                        validTo: { gte: today }
                    }
                ]
            },
            orderBy: { priority: 'desc' } // Ưu tiên cao trước
        })

        if (priceLists.length === 0) {
            return null
        }

        // Lấy bảng giá có priority cao nhất
        const priceList = priceLists[0]

        if (priceList.discountPercent <= 0) {
            return null
        }

        const effectivePrice = basePrice * (1 - priceList.discountPercent / 100)
        const discountAmount = basePrice - effectivePrice

        return {
            productId,
            basePrice,
            effectivePrice,
            discountAmount,
            discountPercent: priceList.discountPercent,
            priceSource: 'PRICE_LIST',
            priceSourceId: priceList.id,
            priceSourceName: priceList.name,
            isLocked: false, // Giá từ bảng giá có thể điều chỉnh
            validUntil: priceList.validTo || undefined
        }
    }

    /**
     * Lấy tất cả giá cho một đơn hàng
     */
    static async getPricesForOrder(
        customerId: string,
        items: Array<{ productId: string; quantity: number }>
    ): Promise<PriceResult[]> {
        const results: PriceResult[] = []

        for (const item of items) {
            const price = await this.getEffectivePrice(
                item.productId,
                customerId,
                item.quantity
            )
            results.push(price)
        }

        return results
    }

    /**
     * Lấy thông tin hợp đồng của khách hàng
     */
    static async getCustomerContracts(
        customerId: string,
        includeExpired: boolean = false
    ): Promise<ContractInfo[]> {
        const today = new Date()

        const contracts = await prisma.contract.findMany({
            where: {
                customerId,
                status: includeExpired ? undefined : 'ACTIVE',
                ...(includeExpired ? {} : {
                    validTo: { gte: today }
                })
            },
            include: {
                contractPrices: {
                    include: {
                        // We'd need a relation to product here
                    }
                }
            },
            orderBy: { validTo: 'desc' }
        })

        const results: ContractInfo[] = []

        for (const contract of contracts) {
            // Lấy thông tin sản phẩm cho mỗi contract price
            const products = []
            for (const cp of contract.contractPrices) {
                const product = await prisma.product.findUnique({
                    where: { id: cp.productId }
                })
                products.push({
                    productId: cp.productId,
                    productName: product?.name || 'Unknown',
                    fixedPrice: cp.fixedPrice,
                    discountPercent: cp.discountPercent
                })
            }

            results.push({
                contractId: contract.id,
                contractNumber: contract.contractNumber,
                contractName: contract.name,
                status: contract.status,
                validFrom: contract.validFrom,
                validTo: contract.validTo,
                creditTermDays: contract.creditTermDays,
                specialCreditLimit: contract.specialCreditLimit,
                products
            })
        }

        return results
    }

    /**
     * Tạo hợp đồng mới
     */
    static async createContract(data: {
        customerId: string
        name: string
        description?: string
        contractType?: 'FIXED_PRICE' | 'DISCOUNT' | 'VOLUME' | 'MIXED'
        validFrom: Date
        validTo: Date
        totalValue?: number
        creditTermDays?: number
        specialCreditLimit?: number
        terms?: string
        products: Array<{
            productId: string
            fixedPrice?: number
            discountPercent?: number
            minQuantity?: number
            maxQuantity?: number
        }>
    }) {
        // Tạo mã hợp đồng
        const contractNumber = `HD-${Date.now().toString(36).toUpperCase()}`

        const contract = await prisma.contract.create({
            data: {
                contractNumber,
                customerId: data.customerId,
                name: data.name,
                description: data.description,
                contractType: data.contractType || 'FIXED_PRICE',
                status: 'DRAFT',
                validFrom: data.validFrom,
                validTo: data.validTo,
                totalValue: data.totalValue,
                creditTermDays: data.creditTermDays || 30,
                specialCreditLimit: data.specialCreditLimit,
                terms: data.terms,
                contractPrices: {
                    create: data.products.map(p => ({
                        productId: p.productId,
                        fixedPrice: p.fixedPrice,
                        discountPercent: p.discountPercent,
                        minQuantity: p.minQuantity || 0,
                        maxQuantity: p.maxQuantity
                    }))
                }
            },
            include: {
                contractPrices: true
            }
        })

        return contract
    }

    /**
     * Kích hoạt hợp đồng
     */
    static async activateContract(
        contractId: string,
        approvedBy: string
    ) {
        const contract = await prisma.contract.update({
            where: { id: contractId },
            data: {
                status: 'ACTIVE',
                approvedBy,
                approvedAt: new Date()
            }
        })

        return contract
    }

    /**
     * Tạo/Cập nhật bảng giá
     */
    static async upsertPriceList(data: {
        code: string
        name: string
        description?: string
        discountPercent: number
        customerTypes: string[]
        priority?: number
        validFrom?: Date
        validTo?: Date
    }) {
        const priceList = await prisma.priceList.upsert({
            where: { code: data.code },
            create: {
                code: data.code,
                name: data.name,
                description: data.description,
                discountPercent: data.discountPercent,
                customerTypes: data.customerTypes as any,
                priority: data.priority || 0,
                validFrom: data.validFrom,
                validTo: data.validTo
            },
            update: {
                name: data.name,
                description: data.description,
                discountPercent: data.discountPercent,
                customerTypes: data.customerTypes as any,
                priority: data.priority,
                validFrom: data.validFrom,
                validTo: data.validTo
            }
        })

        return priceList
    }

    /**
     * Kiểm tra và cập nhật hợp đồng hết hạn
     * (Chạy theo schedule)
     */
    static async checkExpiredContracts(): Promise<{
        expired: number
        expiringSoon: number
    }> {
        const today = new Date()
        const warningDate = new Date()
        warningDate.setDate(warningDate.getDate() + 7) // Cảnh báo 7 ngày trước

        // Đánh dấu hợp đồng hết hạn
        const expiredResult = await prisma.contract.updateMany({
            where: {
                status: 'ACTIVE',
                validTo: { lt: today }
            },
            data: {
                status: 'EXPIRED'
            }
        })

        // Đếm hợp đồng sắp hết hạn
        const expiringSoon = await prisma.contract.count({
            where: {
                status: 'ACTIVE',
                validTo: { gte: today, lte: warningDate }
            }
        })

        return {
            expired: expiredResult.count,
            expiringSoon
        }
    }

    /**
     * Seed default price lists
     */
    static async seedDefaultPriceLists() {
        const defaultLists = [
            {
                code: 'RETAIL',
                name: 'Giá lẻ',
                description: 'Giá bán lẻ cho khách hàng thường',
                discountPercent: 0,
                customerTypes: ['REGULAR'],
                priority: 0
            },
            {
                code: 'VIP',
                name: 'Giá VIP',
                description: 'Giá ưu đãi cho khách hàng VIP',
                discountPercent: 5,
                customerTypes: ['VIP'],
                priority: 10
            },
            {
                code: 'WHOLESALE',
                name: 'Giá sỉ',
                description: 'Giá bán sỉ cho đại lý',
                discountPercent: 10,
                customerTypes: ['WHOLESALE'],
                priority: 20
            },
            {
                code: 'CONTRACTOR',
                name: 'Giá nhà thầu',
                description: 'Giá đặc biệt cho nhà thầu',
                discountPercent: 15,
                customerTypes: ['CONTRACTOR'],
                priority: 30
            }
        ]

        for (const list of defaultLists) {
            await this.upsertPriceList(list)
        }

        return defaultLists.length
    }
}

export const pricingEngine = PricingEngine
