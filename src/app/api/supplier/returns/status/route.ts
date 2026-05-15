import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request) {
    try {
        const { id, status, note } = await request.json()

        if (!id || !status) {
            return NextResponse.json({ success: false, message: 'Thiếu thông tin ID hoặc trạng thái' }, { status: 400 })
        }

        const updatedReturn = await prisma.purchaseReturn.update({
            where: { id },
            data: { 
                status,
                // @ts-expect-error - supplierNote exists in schema but client needs regeneration
                supplierNote: note || null
            }
        })

        return NextResponse.json({ success: true, data: updatedReturn })
    } catch (error) {
        console.error('Update return status error:', error)
        return NextResponse.json({ success: false, message: 'Lỗi máy chủ khi cập nhật trạng thái' }, { status: 500 })
    }
}
