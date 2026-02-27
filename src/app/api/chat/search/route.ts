import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const decoded = await verifyTokenFromRequest(req)
        if (!decoded || (decoded.role !== 'MANAGER' && decoded.role !== 'EMPLOYEE')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const searchParams = req.nextUrl.searchParams
        const query = searchParams.get('q')

        if (!query || query.length < 2) {
            return NextResponse.json({ success: true, data: [] })
        }

        // Use MongoDB Atlas Search for "xịn" (advanced) search: fuzzy matching, accents, etc.
        // This requires the 'default' search index we just created on Atlas.
        const results: any = await prisma.$runCommandRaw({
            aggregate: 'messages',
            pipeline: [
                {
                    $search: {
                        index: 'default',
                        text: {
                            query: query,
                            path: 'content',
                            fuzzy: {
                                maxEdits: 1,
                                prefixLength: 1
                            }
                        },
                        highlight: {
                            path: 'content'
                        }
                    }
                },
                { $limit: 50 },
                {
                    $lookup: {
                        from: 'conversations',
                        localField: 'conversationId',
                        foreignField: '_id',
                        as: 'conversation'
                    }
                },
                { $unwind: '$conversation' },
                {
                    $project: {
                        _id: 1,
                        content: 1,
                        createdAt: 1,
                        senderName: 1,
                        conversationId: 1,
                        highlights: { $meta: 'searchHighlights' },
                        participant1Id: '$conversation.participant1Id',
                        participant1Name: '$conversation.participant1Name',
                        participant2Id: '$conversation.participant2Id',
                        participant2Name: '$conversation.participant2Name'
                    }
                }
            ],
            cursor: {}
        });

        const messages = (results.cursor?.firstBatch || []) as any[];

        // Format results for the UI
        const formattedResults = messages.map(msg => {
            const isP1Admin = msg.participant1Id === 'admin_support';
            const title = isP1Admin ? msg.participant2Name : msg.participant1Name;

            return {
                id: msg._id.$oid,
                content: msg.content,
                createdAt: msg.createdAt.$date || msg.createdAt,
                senderName: msg.senderName,
                conversationId: msg.conversationId.$oid,
                conversationTitle: title || 'Khách hàng',
                // If highlights exist, we could use them for "xịn" UI in the future
                highlights: msg.highlights
            };
        });

        return NextResponse.json({
            success: true,
            data: formattedResults
        })

    } catch (error: any) {
        console.error('[CHAT_SEARCH_GET]', error)
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
