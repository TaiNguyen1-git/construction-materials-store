/**
 * API: KYC Document Management
 * POST /api/admin/integrity/kyc - Submit KYC documents (contractor)
 * PATCH /api/admin/integrity/kyc - Approve/Reject KYC (admin)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { AuditService } from '@/lib/audit-service'

// Submit KYC documents (for contractors)
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const body = await request.json()
        const { documentType, documentNumber, frontImageUrl, backImageUrl, selfieUrl, businessLicenseUrl, taxCertificateUrl } = body

        // Get customer
        const customer = await prisma.customer.findFirst({
            where: { userId }
        })

        if (!customer) {
            return NextResponse.json(createErrorResponse('Customer not found', 'NOT_FOUND'), { status: 404 })
        }

        // Check if already has pending KYC
        const existingPending = await prisma.kYCDocument.findFirst({
            where: {
                customerId: customer.id,
                status: { in: ['PENDING', 'REVIEWING'] }
            }
        })

        if (existingPending) {
            return NextResponse.json(
                createErrorResponse('Bạn đã có hồ sơ KYC đang chờ xử lý', 'DUPLICATE'),
                { status: 400 }
            )
        }

        // Create KYC document
        const kycDoc = await prisma.kYCDocument.create({
            data: {
                customerId: customer.id,
                documentType,
                documentNumber,
                frontImageUrl,
                backImageUrl,
                selfieUrl,
                businessLicenseUrl,
                taxCertificateUrl,
                status: 'PENDING'
            }
        })

        // Log to audit
        await AuditService.logKYC(
            AuditService.extractContext(request, { id: userId }),
            'KYC_SUBMIT',
            customer.id,
            { documentType }
        )

        return NextResponse.json(
            createSuccessResponse({ id: kycDoc.id }, 'Hồ sơ KYC đã được gửi thành công'),
            { status: 201 }
        )

    } catch (error: any) {
        console.error('KYC submit error:', error)
        return NextResponse.json(
            createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

// Approve/Reject KYC (admin only)
export async function PATCH(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const body = await request.json()
        const { documentId, action, rejectionReason } = body

        if (!documentId || !action || !['APPROVE', 'REJECT'].includes(action)) {
            return NextResponse.json(
                createErrorResponse('Missing documentId or invalid action', 'BAD_REQUEST'),
                { status: 400 }
            )
        }

        const kycDoc = await prisma.kYCDocument.findUnique({
            where: { id: documentId }
        })

        if (!kycDoc) {
            return NextResponse.json(createErrorResponse('Document not found', 'NOT_FOUND'), { status: 404 })
        }

        const previousStatus = kycDoc.status

        if (action === 'APPROVE') {
            // Update KYC document
            await prisma.kYCDocument.update({
                where: { id: documentId },
                data: {
                    status: 'APPROVED',
                    verifiedBy: userId,
                    verifiedAt: new Date()
                }
            })

            // Update customer verification status
            await prisma.customer.update({
                where: { id: kycDoc.customerId },
                data: { contractorVerified: true }
            })

            // Update contractor profile if exists
            await prisma.contractorProfile.updateMany({
                where: { customerId: kycDoc.customerId },
                data: { isVerified: true }
            })

            // Log to audit
            await AuditService.logKYC(
                AuditService.extractContext(request, { id: userId }),
                'KYC_APPROVE',
                kycDoc.customerId,
                {
                    documentType: kycDoc.documentType,
                    previousStatus,
                    newStatus: 'APPROVED'
                }
            )

            return NextResponse.json(
                createSuccessResponse({ status: 'APPROVED' }, 'KYC đã được phê duyệt')
            )
        } else {
            // Reject
            if (!rejectionReason) {
                return NextResponse.json(
                    createErrorResponse('Vui lòng cung cấp lý do từ chối', 'BAD_REQUEST'),
                    { status: 400 }
                )
            }

            await prisma.kYCDocument.update({
                where: { id: documentId },
                data: {
                    status: 'REJECTED',
                    rejectionReason,
                    verifiedBy: userId,
                    verifiedAt: new Date()
                }
            })

            // Log to audit
            await AuditService.logKYC(
                AuditService.extractContext(request, { id: userId }),
                'KYC_REJECT',
                kycDoc.customerId,
                {
                    documentType: kycDoc.documentType,
                    reason: rejectionReason,
                    previousStatus,
                    newStatus: 'REJECTED'
                }
            )

            return NextResponse.json(
                createSuccessResponse({ status: 'REJECTED' }, 'KYC đã bị từ chối')
            )
        }

    } catch (error: any) {
        console.error('KYC review error:', error)
        return NextResponse.json(
            createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
