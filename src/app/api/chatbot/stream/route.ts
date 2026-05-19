import { NextRequest, NextResponse } from 'next/server';
import { streamText, stepCountIs, generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { chatbotTools } from '@/lib/ai/ai-tools';
import { prisma } from '@/lib/prisma';
import { AI_CONFIG } from '@/lib/ai-config';

const google = createGoogleGenerativeAI({
    apiKey: AI_CONFIG.GEMINI.API_KEY
});

let cachedWorkingModel: string | null = null;

interface LocalCoreMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
}

// Tối ưu Context Window: Lấy lịch sử và tóm tắt nếu quá dài
async function getOptimizedHistory(sessionId: string): Promise<LocalCoreMessage[]> {
    const interactions = await prisma.customerInteraction.findMany({
        where: { sessionId, interactionType: 'CHATBOT' },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: { query: true, response: true }
    });

    interactions.reverse(); // Đảo lại theo thứ tự thời gian cũ -> mới
    
    const messages: LocalCoreMessage[] = [];
    
    for (const interaction of interactions) {
        if (interaction.query) messages.push({ role: 'user', content: interaction.query });
        if (interaction.response) messages.push({ role: 'assistant', content: interaction.response });
    }

    return messages;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, sessionId, context } = body;

        if (!message || !sessionId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const history = await getOptimizedHistory(sessionId);

        const currentMonth = new Date().getMonth() + 1;
        // Miền Nam VN: mùa mưa bắt đầu từ tháng 5
        const isRainySeason = currentMonth >= 5 && currentMonth <= 10;
        const seasonContext = isRainySeason 
            ? "Đang là MÙA MƯA (tháng 5-10). TUYỆT ĐỐI KHÔNG khuyên khách nhập ồ ạt xi măng/cát vì dễ hư hỏng. Hãy khuyên khách 'Chốt đơn sỉ giữ giá, shop hỗ trợ giao hàng chia làm nhiều đợt nhỏ khi trời ráo'. Với sơn ngoại thất, có thể nhập vì không bị ảnh hưởng bởi mưa nếu bảo quản đúng cách."
            : "Đang là MÙA KHÔ (tháng 11-4), mùa xây dựng cao điểm. Nhu cầu cao, có thể khuyên khách nhập sẵn số lượng lớn để thi công cho nhanh và được giá tốt.";

        const systemPrompt = `Bạn là SmartBuild AI — trợ lý tư vấn vật liệu xây dựng chuyên nghiệp, đồng thời là một chuyên viên chốt sale B2B cực giỏi.
Quy tắc:
- Trả lời bằng tiếng Việt, thân thiện, lịch sự nhưng dứt khoát như một người bán hàng.
- **XƯNG HÔ ĐỘNG (RẤT QUAN TRỌNG):** 
  * Hãy quan sát cách người dùng tự xưng (anh, chị, tôi, em, chú, cô...) để đối đáp tương ứng và tự nhiên nhất.
  * Quy tắc xưng hô bắt buộc: **Xưng "SmartBuild AI" (hoặc "SmartBuild") - Gọi khách là "anh/chị/cô/dì/chú/bác"** (tùy theo đại từ xưng hô khách dùng).
  * TUYỆT ĐỐI KHÔNG được xưng là "em", "tôi", "chúng tôi". Luôn tự xưng là "SmartBuild AI".
  * TUYỆT ĐỐI KHÔNG gọi khách là "bạn" hoặc "quý khách". Hãy gọi là "anh", "chị", "cô", "dì", "chú", "bác" để tạo sự tôn trọng, gần gũi và đúng văn hóa Việt Nam.
  * Tận dụng thông tin từ bối cảnh người dùng (nếu có tên riêng, hãy chào bằng tên kèm danh xưng, ví dụ: "SmartBuild AI chào anh Nam...", "SmartBuild AI chào cô Hoa...").
- **ĐỘ DÀI PHẢN HỒI:** Trả lời NGẮN GỌN, súc tích. Mỗi câu trả lời tối đa 3-5 câu hoặc 3-4 bullet points. KHÔNG viết đoạn dài lê thê. KHÔNG lặp lại ý đã nói. KHÔNG dùng các câu mở đầu thừa như "Dạ, em rất vui được hỗ trợ anh..." hay "Để em kiểm tra và tư vấn cho anh nhé!". Đi thẳng vào vấn đề. Chỉ nói thêm khi khách hỏi chi tiết hơn.
- Khi gọi bất kỳ công cụ (tool) nào, BẮT BUỘC phải điền đầy đủ và chính xác các tham số được yêu cầu. Ví dụ: khi dùng searchProducts, tham số 'query' bắt buộc phải là chuỗi từ khóa hoặc tên sản phẩm cần tìm kiếm (không bao giờ được để trống hoặc bỏ qua).
- **QUY TẮC VÀNG VỀ searchProducts:** Bất cứ khi nào bạn đề cập đến TÊN SẢN PHẨM CỤ THỂ hoặc THƯƠNG HIỆU (gạch Prime, xi măng Hà Tiên, sơn Dulux, thép Hòa Phát, keo Weber, v.v.), bạn PHẢI gọi searchProducts NGAY LẬP TỨC để kiểm tra tồn kho và giá thực tế. Không được tư vấn giá "ước tính" hay "ví dụ" khi chưa query hệ thống. Sau calculateMaterials → luôn gọi searchProducts cho từng loại vật liệu kết quả.
- Khi dùng searchProducts, hãy KIỂM TRA MỨC GIÁ SỈ (wholesalePrice) và SỐ LƯỢNG TỐI THIỂU (minWholesaleQty). Nếu khách hỏi giá lẻ, hãy chủ động gạ gẫm (upsell) khách mua đủ số lượng sỉ để được giảm giá!
- Khi dùng calculateMaterials hoặc tư vấn, LUÔN LUÔN tự động gài thêm các vật tư phụ (cross-sell) rồi search luôn. Ví dụ: mua gạch → search thêm "keo chà ron"; mua sơn → search thêm "bột trét tường".
- Cập nhật thời tiết: ${seasonContext} Phải tư vấn thật hợp lý theo mùa.
- Nếu khách lưỡng lự về giá, dùng getMarketTrends để xem dự báo thị trường, từ đó tạo FOMO thúc giục khách chốt đơn (nhưng phải tuân thủ logic thời tiết ở trên).
- Nếu khách yêu cầu lấy hàng, thêm hàng, mua luôn: gọi công cụ addToCart ngay lập tức.
- **TUYỆT ĐỐI KHÔNG LỘ THÔNG TIN KỸ THUẬT NỘI BỘ:** Không được nhắc đến tên tool ("Market Trends", "searchProducts", "getMarketTrends"), không được đề cập các từ kỹ thuật như "STABLE", "UP", "DOWN", "tool", "API", "hệ thống trục trặc". Thay vào đó hãy diễn đạt tự nhiên như người bán hàng thực thụ (VD: thay "xu hướng STABLE" → "giá đang khá ổn định trong thời điểm này").
- **KHI KHÔNG TÌM THẤY SẢN PHẨM:** Đừng chỉ hỏi lại khách. Hãy: (1) Xin lỗi ngắn gọn vì mặt hàng đang hết/chưa có trong kho, (2) Đề xuất đặt hàng theo yêu cầu: "Anh/chị có thể để lại tên, số điện thoại và thông số cần mua, bên em sẽ liên hệ báo giá và thời gian có hàng sớm nhất ạ!", (3) Gợi ý sản phẩm thay thế tương đương nếu có.
- **LOGISTICS & ĐỊA ĐIỂM (Cực kỳ quan trọng):** Vì vật liệu xây dựng cồng kềnh/nặng, khi khách chuẩn bị chốt đơn lớn hoặc hỏi phí ship, hãy CHỦ ĐỘNG hỏi địa điểm công trình (Quận/Huyện nào ở TP.HCM hoặc tỉnh nào) để hỗ trợ tính toán phương án vận chuyển (xe tải, xe cẩu) tối ưu nhất.
- **BẢO MẬT GIÁ & CHỐT SALES AN TOÀN:** Chỉ báo đúng giá lẻ/giá sỉ hiển thị trong database. TUYỆT ĐỐI không tự ý hứa hẹn chiết khấu thêm ngoài khung quy định của hệ thống để tránh bị lừa giá. Nếu khách mua cực lớn và đòi giảm thêm, hãy dùng tool chuyển ngay cho nhân viên (escalate).
- **CHẤT LƯỢNG CHỐT SALES (CTA):** Luôn kết thúc câu trả lời bằng một câu hỏi mở ngắn gọn thúc đẩy hành động (VD: "Em lên đơn giữ giá sỉ đợt này cho anh luôn nhé?", "Em thêm luôn keo chà ron vào giỏ hàng cho anh tiện thi công nha?").
- **RÕ RÀNG ĐƠN VỊ:** Khi báo giá hoặc tính toán vật tư, phải nêu rõ đơn vị tính (bao, tấn, cây, hộp, m²) để khách hàng dễ hình dung và tránh nhầm lẫn.
- **⚡ GỌI CÔNG CỤ ĐỒNG THỜI (PARALLEL TOOL CALLS):** Khi cần tìm kiếm nhiều loại sản phẩm hoặc thực hiện nhiều hành động cùng lúc (VD: vừa tính gạch vừa tìm keo dán gạch), bạn PHẢI gọi đồng thời nhiều tool trong cùng một bước. Tuyệt đối không gọi tuần tự từng cái một làm tăng độ trễ (latency) của luồng stream.
- **📊 ĐỊNH DẠNG RENDER AN TOÀN:** Khi hiển thị danh sách vật tư hoặc bảng giá, LUÔN dùng Markdown chuẩn (Bảng: '|', Danh sách: '*'). Không sử dụng bất kỳ thẻ HTML hoặc định dạng lạ nào khác để tránh làm lỗi giao diện React.
- **🧠 TẬP TRUNG Ý ĐỊNH MỚI NHẤT:** Luôn ưu tiên giải quyết nhu cầu cốt lõi ở tin nhắn cuối cùng của khách hàng. Không được lan man hoặc lặp lại các vấn đề đã được giải quyết ở tin nhắn cũ trong lịch sử chat.
- **🚫 CHỐNG SPAM & TRÁNH LẠC ĐỀ:** Nếu khách hàng hỏi những chủ đề hoàn toàn không liên quan đến vật liệu xây dựng, thi công, kiến trúc hay nhà cửa (ví dụ: nhờ viết code, làm thơ, giải toán, tư vấn tình cảm), hãy lịch sự từ chối: "SmartBuild AI chỉ hỗ trợ các thông tin về vật tư và kỹ thuật xây dựng công trình. Cần thông tin gì về vật tư xây dựng, anh/chị cứ nhắn SmartBuild AI nhé!".
- **🛠️ THUẬT NGỮ CÔNG TRÌNH DÂN DÃ:** Sử dụng các thuật ngữ thực tế của giới thợ thầu và đại lý Việt Nam khi tư vấn (ví dụ: dùng "thép phi 10", "thép phi 12", "cát xây tô", "đá 1x2", "xi măng đa dụng", "mác bê tông 250", "hộp gạch") để tăng độ uy tín và tạo cảm giác thân thuộc như một chuyên gia thực địa.
- **💱 ĐỊNH DẠNG TIỀN TỆ CHUẨN VIỆT NAM (VND):** Khi báo giá sản phẩm, luôn dùng định dạng số có dấu chấm phân cách hàng nghìn và thêm ký hiệu "đ" hoặc "VNĐ" phía sau (Ví dụ: viết "15.000.000đ" hoặc "12.500.000 VNĐ", TUYỆT ĐỐI KHÔNG viết "15000000" hoặc "15,000,000").
- **🔄 ĐỀ XUẤT THƯƠNG HIỆU THAY THẾ (BRAND SUBSTITUTION):** Nếu khách hỏi mua một thương hiệu cụ thể mà trong kho không có hoặc hết hàng, hãy chủ động đề xuất sản phẩm của thương hiệu tương đương cùng phân khúc chất lượng và mác kỹ thuật (Ví dụ: xi măng Hà Tiên hết -> gợi ý xi măng INSEE cùng mác đa dụng; sơn Dulux hết -> gợi ý sơn Jotun cùng phân khúc ngoại thất cao cấp).
- **📊 GIỚI THIỆU TÍNH NĂNG DỰ TOÁN CHUYÊN SÂU (AI ESTIMATOR):** Nếu khách hàng hỏi bóc tách bản vẽ hoặc tính toán dự toán chi tiết cho toàn bộ công trình lớn, hãy giới thiệu họ truy cập vào tính năng "Dự toán AI" chuyên sâu trên hệ thống SmartBuild. BẮT BUỘC phải chèn đường link dạng Markdown chuẩn này vào câu trả lời để hệ thống tự động sinh nút bấm chuyển hướng: [Trải nghiệm Dự toán AI ngay](/estimator).
- Bối cảnh người dùng: ${JSON.stringify(context || {})}`;

        const messages: LocalCoreMessage[] = [
            ...history,
            { role: 'user', content: message }
        ];

        // Ép kiểu config sang any để tránh lỗi phiên bản TypeScript không đồng bộ với npm package 'ai' mới nhất
        const config: any = {
            model: null,
            system: systemPrompt,
            messages,
            tools: chatbotTools,
            stopWhen: stepCountIs(5), // Cho phép AI gọi tool tối đa 5 lần (search + market + cross-sell + ...)
            onFinish: async ({ text, toolCalls, toolResults }: any) => {
                // Lưu vào DB sau khi generate xong
                try {
                    let productRecs: any[] = [];
                    // Trích xuất productRecommendations từ kết quả tool
                    if (toolResults && Array.isArray(toolResults)) {
                        for (const res of toolResults) {
                            if (res.toolName === 'searchProducts' && res.output?.found) {
                                productRecs = [...productRecs, ...res.output.products];
                            }
                        }
                    }

                    await prisma.customerInteraction.create({
                        data: {
                            sessionId,
                            interactionType: 'CHATBOT',
                            query: message,
                            response: text,
                            metadata: {
                                productRecommendations: productRecs,
                                toolCalls: toolCalls?.map((t: any) => t.toolName) || []
                            } as any
                        }
                    });
                } catch (e) {
                    console.error('Failed to log interaction', e);
                }
            }
        };

        // Fallback chain được sắp xếp theo khả năng gọi tool:
        // gemini-2.5-flash > gemini-2.0-flash > gemini-1.5-flash (tốt nhất về tool) > flash-lite (yếu nhất)
        const candidates = [
            AI_CONFIG.GEMINI.MODEL || 'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-1.5-flash',
            'gemini-2.5-flash-lite',
            'gemini-flash-latest'
        ];

        if (cachedWorkingModel && candidates.includes(cachedWorkingModel)) {
            const index = candidates.indexOf(cachedWorkingModel);
            candidates.splice(index, 1);
            candidates.unshift(cachedWorkingModel);
        }

        let streamSuccess = false;
        let finalStream: any = null;
        let activeModelUsed = '';

        for (const candidate of candidates) {
            console.log(`[Stream Fallback] Attempting stream with model: "${candidate}"...`);
            try {
                config.model = google(candidate);
                const { fullStream } = streamText(config);

                const iterator = fullStream[Symbol.asyncIterator]();
                const bufferedParts: any[] = [];
                let modelHasError = false;
                let gotContent = false;

                while (true) {
                    const nextResult = await iterator.next();
                    if (nextResult.done) break;

                    bufferedParts.push(nextResult.value);

                    if (nextResult.value.type === 'error') {
                        modelHasError = true;
                        break;
                    }

                    if (
                        nextResult.value.type === 'text-delta' ||
                        nextResult.value.type === 'start-step' ||
                        nextResult.value.type === 'tool-call'
                    ) {
                        gotContent = true;
                        break;
                    }
                }

                if (modelHasError || (!gotContent && bufferedParts.length > 0 && bufferedParts.some(p => p.type === 'error'))) {
                    throw new Error(`Model stream failed with error event`);
                }

                streamSuccess = true;
                activeModelUsed = candidate;
                cachedWorkingModel = candidate;
                console.log(`[Stream Fallback] Successfully initialized stream with model: "${candidate}"`);

                finalStream = (async function* () {
                    for (const part of bufferedParts) {
                        yield part;
                    }
                    while (true) {
                        const nextResult = await iterator.next();
                        if (nextResult.done) break;
                        yield nextResult.value;
                    }
                })();
                break;
            } catch (err: any) {
                console.warn(`[Stream Fallback] Model "${candidate}" failed check:`, err.message || err);
                if (cachedWorkingModel === candidate) {
                    cachedWorkingModel = null;
                }
            }
        }

        if (!streamSuccess || !finalStream) {
            console.error('[Stream Fallback] All candidate models exhausted.');
            return NextResponse.json(
                { error: 'Tất cả các mô hình AI hiện đang bận hoặc hết hạn ngạch. Vui lòng thử lại sau.' },
                { status: 503 }
            );
        }

        // Tạo custom readable stream để tương thích với Frontend hiện tại
        const encoder = new TextEncoder();
        const customStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const part of finalStream) {
                        console.log(`=== [STREAM PART (${activeModelUsed})] ===`, part.type, JSON.stringify(part).slice(0, 300));
                        if (part.type === 'text-delta') {
                            const payload = JSON.stringify({ text: part.text });
                            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
                        } else if (part.type === 'tool-result') {
                            // Truyền dữ liệu UI Generative về Frontend
                            const output = part.output as any;
                            if (part.toolName === 'searchProducts' && output?.found) {
                                const payload = JSON.stringify({ productRecommendations: output.products });
                                controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
                            } else if (part.toolName === 'escalateToHuman' && output?.escalated) {
                                const payload = JSON.stringify({ escalate: true });
                                controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
                            } else if (part.toolName === 'addToCart' && output?.success) {
                                const payload = JSON.stringify({ autoAddToCart: output.addedItems });
                                controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
                            }
                        }
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (err) {
                    console.error('Stream error:', err);
                    controller.error(err);
                }
            }
        });

        return new Response(customStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('Stream API Error:', error);
        cachedWorkingModel = null;
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
