
import { POST } from '../src/app/api/chatbot/route'

// Mock NextRequest
class MockRequest {
    private body: any
    public headers: Map<string, string>
    public url: string

    constructor(body: any, headers: any = {}) {
        this.body = body
        this.headers = new Map(Object.entries(headers))
        this.url = 'http://localhost:3000/api/chatbot'
    }

    async json() {
        return this.body
    }
}

async function runRAGTest() {
    console.log('🧪 Testing RAG Integration...\n')

    const scenarios = [
        {
            name: 'General Price Inquiry (RAG Fallback)',
            msg: 'Giá cát xây dựng hôm nay thế nào?'
        },
        {
            name: 'Advisory (RAG Context)',
            msg: 'Tư vấn giúp mình quy trình xây nhà cơ bản'
        },
        {
            name: 'Product Comparison',
            msg: 'Nên dùng xi măng Hà Tiên hay Insee?'
        }
    ]

    for (const scenario of scenarios) {
        console.log(`\n--- Testing: ${scenario.name} ---`)
        console.log(`User: "${scenario.msg}"`)

        try {
            const req = new MockRequest({
                message: scenario.msg,
                sessionId: `test-rag-${Date.now()}`,
                isAdmin: false
            }) as any

            const response = await POST(req)
            const data = await response.json()

            if (response.status === 200) {
                console.log(`✅ Response:`)
                console.log(data.data.message)

                // Basic validation
                if (data.data.message.length > 50 && !data.data.message.includes('không biết')) {
                    console.log('✅ Quality Check: PASS (Response seems detailed)')
                } else {
                    console.log('⚠️ Quality Check: WARNING (Response might be too short or generic)')
                }
            } else {
                console.error(`❌ Error: ${data.message}`)
            }
        } catch (error: any) {
            console.error(`💥 Exception: ${error.message}`)
        }
    }
}

runRAGTest().catch(console.error)
