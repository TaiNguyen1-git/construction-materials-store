import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'
import { MaterialCalculatorService } from '@/lib/material-calculator-service'

const calculatorSchema = z.object({
  projectType: z.enum(['HOUSE', 'VILLA', 'APARTMENT', 'WAREHOUSE', 'OFFICE', 'CUSTOM']),
  area: z.number().optional(),
  floors: z.number().optional(),
  height: z.number().optional(),
  length: z.number().optional(),
  width: z.number().optional(),
  wallType: z.enum(['BRICK', 'CONCRETE', 'LIGHTWEIGHT']).optional(),
  roofType: z.enum(['TILE', 'CORRUGATED', 'CONCRETE']).optional(),
  foundationType: z.enum(['STRIP', 'RAFT', 'PILE']).optional(),
  finishingLevel: z.enum(['BASIC', 'STANDARD', 'PREMIUM']).optional(),
  customRequirements: z.string().optional(),
  customerId: z.string().optional(),
  saveCalculation: z.boolean().optional().default(true)
})

// POST /api/material-calculator - Calculate materials for construction project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = calculatorSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const project: any = validation.data

    // Calculate materials
    const result = await MaterialCalculatorService.quickCalculate(project)

    // Save calculation to database if requested
    if (validation.data.saveCalculation) {
      try {
        await prisma.materialCalculation.create({
          data: {
            customerId: validation.data.customerId,
            projectType: project.projectType,
            projectData: project as any,
            calculationResult: result as any,
            totalEstimate: result.totalEstimatedCost,
            status: 'DRAFT'
          }
        })
      } catch (dbError) {
        console.error('Error saving calculation:', dbError)
        // Continue even if save fails
      }
    }

    return NextResponse.json(
      createSuccessResponse(result, 'Materials calculated successfully'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Material calculator error:', error)
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        'CALCULATION_ERROR'
      ),
      { status: 500 }
    )
  }
}

// GET /api/material-calculator - Get saved calculations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {}
    if (customerId) {
      where.customerId = customerId
    }

    const [calculations, total] = await Promise.all([
      prisma.materialCalculation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          customer: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }),
      prisma.materialCalculation.count({ where })
    ])

    const response = {
      data: calculations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }

    return NextResponse.json(
      createSuccessResponse(response, 'Calculations retrieved successfully'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Get calculations error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
