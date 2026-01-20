/**
 * OpenGraph Image Generator for Project Pages
 * Generates dynamic OG images for social sharing
 */

import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'edge'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Fetch project from database (lite version for edge)
        // Note: In edge runtime, we might need to use fetch instead
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const res = await fetch(`${baseUrl}/api/marketplace/projects/${id}`)

        if (!res.ok) {
            return new Response('Project not found', { status: 404 })
        }

        const data = await res.json()
        const project = data.data

        if (!project) {
            return new Response('Project not found', { status: 404 })
        }

        const formatBudget = (amount: number | null) => {
            if (!amount) return 'Thương lượng'
            if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} tỷ`
            if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)} triệu`
            return `${amount.toLocaleString('vi-VN')}đ`
        }

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: '#1e40af',
                        padding: '40px',
                    }}
                >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                        <div
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '8px 16px',
                                fontSize: '18px',
                                fontWeight: 600,
                                color: '#1e40af',
                            }}
                        >
                            🏗️ SmartBuild
                        </div>
                        {project.isUrgent && (
                            <div
                                style={{
                                    backgroundColor: '#ef4444',
                                    borderRadius: '12px',
                                    padding: '8px 16px',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    color: 'white',
                                    marginLeft: '12px',
                                }}
                            >
                                🔥 CẦN GẤP
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <div
                        style={{
                            fontSize: '42px',
                            fontWeight: 700,
                            color: 'white',
                            lineHeight: 1.2,
                            marginBottom: '24px',
                            maxWidth: '90%',
                        }}
                    >
                        {project.title}
                    </div>

                    {/* Info grid */}
                    <div style={{ display: 'flex', gap: '20px', marginTop: 'auto' }}>
                        <div
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.15)',
                                borderRadius: '16px',
                                padding: '16px 24px',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                                📍 Địa điểm
                            </span>
                            <span style={{ fontSize: '22px', fontWeight: 600, color: 'white' }}>
                                {project.city}
                            </span>
                        </div>

                        <div
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.15)',
                                borderRadius: '16px',
                                padding: '16px 24px',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                                💰 Ngân sách
                            </span>
                            <span style={{ fontSize: '22px', fontWeight: 600, color: '#4ade80' }}>
                                {formatBudget(project.estimatedBudget)}
                            </span>
                        </div>

                        <div
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.15)',
                                borderRadius: '16px',
                                padding: '16px 24px',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                                👷 Ứng tuyển
                            </span>
                            <span style={{ fontSize: '22px', fontWeight: 600, color: 'white' }}>
                                {project.applications?.length || 0} hồ đã nộp
                            </span>
                        </div>
                    </div>

                    {/* CTA */}
                    <div
                        style={{
                            marginTop: '24px',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '12px 24px',
                            fontSize: '18px',
                            fontWeight: 600,
                            color: '#1e40af',
                            alignSelf: 'flex-start',
                        }}
                    >
                        👉 Xem chi tiết & ứng tuyển ngay
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        )
    } catch (error) {
        console.error('OG image generation error:', error)
        return new Response('Error generating image', { status: 500 })
    }
}
