import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const supplierId = searchParams.get('supplierId')

        if (!supplierId) {
            return NextResponse.json({ success: false, message: 'Missing supplierId' }, { status: 400 })
        }

        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId },
            select: { name: true, currentBalance: true }
        })

        if (!supplier) {
            return NextResponse.json({ success: false, message: 'Supplier not found' }, { status: 404 })
        }

        const unpaidOrders = await (prisma.purchaseOrder as any).findMany({
            where: {
                supplierId,
                status: 'RECEIVED'
            },
            orderBy: { createdAt: 'desc' }
        })

        const data = [
            ['SAO KÊ CÔNG NỢ NHÀ CUNG CẤP'],
            ['Nhà cung cấp:', supplier.name],
            ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
            ['Tổng dư nợ hiện tại:', supplier.currentBalance.toLocaleString('vi-VN') + ' ₫'],
            [],
            ['Mã Đơn Hàng (PO)', 'Ngày Tạo', 'Giá Trị (VNĐ)', 'Trạng Thái']
        ]

        unpaidOrders.forEach((order: any) => {
            data.push([
                order.orderNumber,
                new Date(order.createdAt).toLocaleDateString('vi-VN'),
                order.totalAmount,
                'Chưa thanh toán'
            ])
        })

        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.aoa_to_sheet(data)
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sao kê công nợ')

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=sao-ke-cong-no-${supplierId}.xlsx`
            }
        })
    } catch (error) {
        console.error('Export error:', error)
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
    }
}
