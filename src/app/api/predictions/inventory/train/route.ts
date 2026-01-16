// src/app/api/predictions/inventory/train/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(request: NextRequest) {
    try {
        const scriptPath = path.join(process.cwd(), 'scripts', 'ml-service', 'train_prophet.py')

        return new Promise<NextResponse>((resolve) => {
            const pythonProcess = spawn('python', [scriptPath])

            let output = ''
            let errorOutput = ''

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString()
            })

            pythonProcess.stderr.on('data', (data) => {
                errorOutput += data.toString()
                console.error(`Prophet Training Error: ${data}`)
            })

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    resolve(NextResponse.json({
                        success: true,
                        message: 'Đào tạo mô hình AI hoàn tất',
                        data: { output, code }
                    }))
                } else {
                    resolve(NextResponse.json({
                        success: false,
                        error: 'Lỗi khi đào tạo mô hình AI',
                        data: { output, errorOutput, code }
                    }, { status: 500 }))
                }
            })
        })
    } catch (error: any) {
        console.error('Training error:', error)
        return NextResponse.json({
            success: false,
            error: error.message || 'Lỗi không xác định'
        }, { status: 500 })
    }
}
