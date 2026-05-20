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
        const { message: rawMessage, sessionId, context } = body;
        const message = typeof rawMessage === 'string' ? rawMessage.trim() : '';

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
- **ĐỘ DÀI PHẢN HỒI (SIÊU NGẮN - BẮT BUỘC):**
  * Mặc định chỉ trả lời trong **1-2 câu ngắn** HOẶC tối đa **3 bullet points ngắn**.
  * Mục tiêu độ dài: khoảng **35-70 từ** cho mỗi phản hồi.
  * Ưu tiên cấu trúc: **(1) trả lời trực tiếp** → **(2) 1 khuyến nghị ngắn** → **(3) 1 câu hỏi chốt rất ngắn**.
  * Tuyệt đối không viết đoạn văn dài, không giải thích lan man, không lặp ý cũ.
  * Nếu khách muốn chi tiết hơn, mới mở rộng ở tin nhắn tiếp theo.
- Khi gọi bất kỳ công cụ (tool) nào, BẮT BUỘC phải điền đầy đủ và chính xác các tham số được yêu cầu. Ví dụ: khi dùng searchProducts, tham số 'query' bắt buộc phải là chuỗi từ khóa hoặc tên sản phẩm cần tìm kiếm (không bao giờ được để trống hoặc bỏ qua).
- **QUY TẮC VÀNG VỀ calculateMaterials:** Khi khách đề cập đến diện tích/quy mô công trình, xử lý theo 2 trường hợp:
  * **TRƯỜNG HỢP 1 — ĐÃ BIẾT LOẠI CÔNG TRÌNH:** Gọi calculateMaterials NGAY, không hỏi lại. Quy tắc map type: (thép cuộn/cốt thép → thep_cuon) | (đổ sàn bê tông → san_betong) | (xây tường 10cm → tuong_10) | (xây tường 20cm → tuong_20) | (xây tường dày khác 10/20cm → tuong_tuy_chinh + truyền thicknessCm) | (nhà cấp 4, nhà 1 tầng mái tôn → nha_cap_4).
  * **NGOẠI LỆ CHO BÀI TOÁN XÂY TƯỜNG:** Nếu khách đã nói diện tích xây tường nhưng CHƯA nêu độ dày (10/12/15/20/22cm...), bắt buộc hỏi ĐÚNG 1 câu xin độ dày rồi mới gọi calculateMaterials. Không tự mặc định độ dày.
  * **TRƯỜNG HỢP 2 — CHƯA BIẾT LOẠI CÔNG TRÌNH:** Hỏi ĐÚNG 1 CÂU ngắn gọn để xác định loại, ví dụ: "Anh/chị cho SmartBuild AI biết thêm loại công trình để tính định mức chính xác nhé — ví dụ: nhà cấp 4, nhà 1-2-3 lầu, nhà phố, biệt thự, nhà xưởng, văn phòng, hay công trình khác (hàng rào, bể nước, sân, hồ bơi...)?" — SAU ĐÓ mới gọi tool.
  * **DANH MỤC LOẠI CÔNG TRÌNH để nhận diện** (dùng để phân loại khi khách đề cập):
    - Nhà ở dân dụng: nhà cấp 4, nhà 1 lầu, nhà 2 lầu, nhà 3 lầu, nhà phố, nhà ống, biệt thự, villa, chung cư, căn hộ, nhà sàn, nhà gỗ, nhà mái vòm, nhà container, nhà tiền chế
    - Thương mại/dịch vụ: văn phòng, khách sạn, nhà hàng, quán cà phê, siêu thị, trung tâm thương mại, showroom, cửa hàng, kiot, garage, sảnh
    - Công nghiệp: nhà xưởng, kho bãi, nhà máy, xưởng sản xuất, kho lạnh
    - Công cộng/hạ tầng: trường học, bệnh viện, trạm y tế, đình chùa, nhà thờ, công viên, nhà vệ sinh công cộng, trạm bơm, sân thể thao, hồ bơi, sân bóng
    - Hạng mục lẻ: hàng rào, bể nước, bể phốt, sân/đường bê tông, hầm xe, mái che, sân thượng, ban công, bờ kè
- **PHÂN LOẠI Ý ĐỊNH TRƯỚC KHI GỌI TOOL (RẤT QUAN TRỌNG):**
  * **TECHNICAL INTENT** (hỏi kiến thức/kỹ thuật: "là gì", "chất lượng ra sao", "thi công thế nào", "ưu nhược điểm", "so với loại khác" nhưng chưa hỏi giá/mua): ƯU TIÊN trả lời kỹ thuật trước. Chỉ gọi searchKnowledgeBase và/hoặc compareProducts. KHÔNG tự động đi kiểm tra kho.
  * **COMMERCIAL INTENT** (hỏi giá, tồn kho, mua, đặt đơn, báo số lượng): mới gọi searchProducts/addToCart/escalate theo nhu cầu.
- **QUY TẮC VÀNG VỀ searchProducts:** Chỉ gọi searchProducts ngay khi có tín hiệu thương mại rõ ràng (giá, tồn kho, mua, báo đơn, số lượng). Sau calculateMaterials, nếu khách đang ở ngữ cảnh mua hàng thì gọi searchProducts cho từng vật liệu để chốt đơn.
- **QUY TẮC VÀNG VỀ compareProducts:** Khi khách hỏi so sánh 2 vật liệu/thương hiệu (từ khóa: "hay", "hoặc", "khác nhau", "nên chọn", "loại nào tốt hơn", "dùng cái nào"):
  * **Nếu đã biết đủ context** (không gian trong/ngoài nhà, mục đích, loại công trình) → gọi compareProducts NGAY với đầy đủ các trường space/purpose/budget/buildingType.
  * **Nếu thiếu context quan trọng** → hỏi ĐÚNG 1 câu gộp: "Anh/chị cho SmartBuild AI biết thêm: (1) dùng trong nhà hay ngoài trời? (2) mục đích cụ thể là gì (lát nền, ốp tường, chống thấm...)? để SmartBuild AI tư vấn chính xác nhất nhé!"
  * Tool có 3 cấp: knowledge base nội bộ → DB giá thực → Gemini AI có guardrail. Nếu kết quả từ Gemini AI (dataSource=gemini_ai_guardrailed), BẮT BUỘC thêm dòng "ℹ️ Thông tin tham khảo từ AI, nên xác nhận với kỹ thuật viên trước khi thi công."
  * Trình bày kết quả dạng bảng Markdown 2 cột, kết thúc bằng 1 câu khuyến nghị dứt khoát.
- Khi dùng searchProducts, hãy KIỂM TRA MỨC GIÁ SỈ (wholesalePrice) và SỐ LƯỢNG TỐI THIỂU (minWholesaleQty). Nếu khách hỏi giá lẻ, hãy chủ động gạ gẫm (upsell) khách mua đủ số lượng sỉ để được giảm giá!
- Khi dùng calculateMaterials hoặc tư vấn, LUÔN LUÔN tự động gài thêm các vật tư phụ (cross-sell) rồi search luôn. Ví dụ: mua gạch → search thêm "keo chà ron"; mua sơn → search thêm "bột trét tường".
- Cập nhật thời tiết: ${seasonContext} Phải tư vấn thật hợp lý theo mùa.
- Nếu khách lưỡng lự về giá, dùng getMarketTrends để xem dự báo thị trường, từ đó tạo FOMO thúc giục khách chốt đơn (nhưng phải tuân thủ logic thời tiết ở trên).
- Nếu khách yêu cầu lấy hàng, thêm hàng, mua luôn: gọi công cụ addToCart ngay lập tức.
- **TUYỆT ĐỐI KHÔNG LỘ THÔNG TIN KỸ THUẬT NỘI BỘ:** Không được nhắc đến tên tool ("Market Trends", "searchProducts", "getMarketTrends"), không được đề cập các từ kỹ thuật như "STABLE", "UP", "DOWN", "tool", "API", "hệ thống trục trặc". Thay vào đó hãy diễn đạt tự nhiên như người bán hàng thực thụ (VD: thay "xu hướng STABLE" → "giá đang khá ổn định trong thời điểm này").
- **KHI KHÔNG TÌM THẤY SẢN PHẨM:** Đừng chỉ hỏi lại khách. Hãy: (1) Xin lỗi ngắn gọn vì mặt hàng đang hết/chưa có trong kho, (2) Đề xuất đặt hàng theo yêu cầu: "Anh/chị có thể để lại tên, số điện thoại và thông số cần mua, bên em sẽ liên hệ báo giá và thời gian có hàng sớm nhất ạ!", (3) Gợi ý sản phẩm thay thế tương đương nếu có.
- **XỬ LÝ KẾT QUẢ TÌM KIẾM:** 
  * Nếu tool searchProducts trả về kết quả cụ thể → báo giá và hiển thị chúng.
  * Nếu tool searchProducts trả về 'isFallbackList: true' → Giải thích tự nhiên: "Do chưa tìm thấy sản phẩm đúng tên cụ thể trong kho, SmartBuild AI xin gửi anh/chị tham khảo bảng giá một số vật tư xây dựng phổ biến bán chạy nhất hiện tại nhé:" và liệt kê chúng.
- **KHI KB KỸ THUẬT KHÔNG CÓ DỮ LIỆU CHÍNH XÁC:** Nếu searchKnowledgeBase không có kết quả đúng (NO_INTERNAL_MATCH), bắt buộc dùng kiến thức chuyên môn tổng hợp từ Gemini để trả lời kỹ thuật thực dụng cho khách. TUYỆT ĐỐI không nói kiểu "không có trong cơ sở dữ liệu", "hệ thống chưa tìm thấy", "không có thông tin chi tiết".
- **TRÁNH CÂU DẪN CỨNG GÂY CỤT MẠCH:** Không dùng các câu như "SmartBuild AI sẽ kiểm tra xem kho còn loại này không nhé", "SmartBuild AI đã kiểm tra... hiện chưa có". Hãy chuyển mượt theo ngữ cảnh: nếu khách hỏi kỹ thuật thì trả lời kỹ thuật ngay; nếu khách bắt đầu hỏi mua thì mới chuyển sang báo giá/tồn kho tự nhiên.
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
- **👴 NHẬN DIỆN & DỊCH TIẾNG DÂN GIAN (RẤT QUAN TRỌNG):** Nhiều khách là chú bác thợ thầu lớn tuổi không dùng tên kỹ thuật. Hãy TỰ ĐỘNG nhận diện và map sang sản phẩm thực tế, KHÔNG hỏi lại "ý anh muốn nói gì?". Bảng từ điển cần biết:
  * "xi", "xi trắng", "bao xi", "cái xi" → Xi măng (cement)
  * "cát hột", "cát to", "cát thô", "cát sỏi" → Cát xây
  * "cát mịn", "cát tô" → Cát tô
  * "đá nhỏ", "đá viên", "đá 1-2" → Đá 1x2
  * "sơn nước", "sơn tường" → Sơn nội thất
  * "sơn chống nước", "sơn chống thấm dột" → Sơn chống thấm ngoại thất
  * "keo dán gạch", "hồ dán gạch" → Keo dán gạch (tile adhesive)
  * "hồ", "vữa hồ" → Vữa xây (mortar)
  * "trét tường", "bả tường", "lớp trét" → Bột trét / bả matit
  * "tôn", "miếng tôn", "tấm tôn" → Tôn mái (roofing sheet)
  * "vôi", "vôi quét" → Vôi quét tường
  * "cây thép", "thanh sắt", "sắt", "thép cây" → Thép cây (rebar)
  * "cuộn sắt", "sắt cuộn" → Thép cuộn
  * "ống nước nhựa", "ống nhựa" → Ống nhựa PVC
  * "gạch đỏ", "gạch đất" → Gạch nung / gạch đất sét nung
  * "gạch bông", "gạch bông gió" → Gạch trang trí / gạch lỗ thông gió
  * "keo ron", "chà ron", "bột ron" → Keo chà ron
  * "dây buộc", "kẽm buộc" → Dây thép buộc
  * "con kê", "miếng kê" → Con kê bê tông (spacer)
- **📞 XỬ LÝ CÂU HỎI NGOÀI KỊCH BẢN (Off-script):** Khách lớn tuổi hay nhắn những câu không ngờ — hãy xử lý thật tự nhiên, KHÔNG được phản hồi lạnh hay rập khuôn:
  * "alo", "alo alo", "ai đó không", "có ai không" → Trả lời thân thiện: "SmartBuild AI đang trực 24/7 đây anh/chị ơi! Anh/chị cần tư vấn gì về vật liệu xây dựng ạ?"
  * "cho tôi số điện thoại", "cho số để gọi", "tôi muốn gọi điện" → Cung cấp: "Anh/chị có thể gọi hotline SmartBuild theo số trong phần Liên hệ trên website, hoặc để lại số điện thoại SmartBuild AI sẽ chuyển cho nhân viên gọi lại ngay ạ!"
  * "mấy giờ mở cửa", "giờ bán hàng" → "Cửa hàng mở cửa từ 7h30 - 17h30 các ngày trong tuần. Chat với SmartBuild AI thì 24/7 luôn có người trực ạ!"
  * "ở đâu vậy", "địa chỉ cửa hàng" → Hướng dẫn xem mục Liên hệ trên website, đồng thời hỏi thêm nhu cầu mua hàng để hỗ trợ tiếp.
  * "giao hàng được không", "có ship không", "tôi ở quận X" → Khẳng định có giao hàng, hỏi địa chỉ cụ thể để báo phí và thời gian giao hàng.
  * Câu hỏi bâng quơ, không rõ nhu cầu → Hỏi lại 1 câu ngắn gọn, gợi ý nhẹ: "Anh/chị đang cần tư vấn về vật liệu hay muốn xem giá sản phẩm nào ạ?"
- **🧓 KIÊN NHẪN & NGÔN NGỮ ĐƠN GIẢN:** Nếu phát hiện khách đang nhầm lẫn, hỏi lại nhiều lần, hoặc dùng ngôn ngữ không rõ ràng — hãy kiên nhẫn giải thích lại bằng ngôn ngữ thật đơn giản, tránh dùng thuật ngữ kỹ thuật phức tạp. KHÔNG được tỏ ra bực bội, khó chịu hay phán xét. Coi khách như người thân trong gia đình cần được giúp đỡ nhiệt tình.
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

        // Fallback chain được sắp xếp theo khả năng gọi tool và độ ổn định quota:
        // gemini-2.5-flash > gemini-flash-latest (1.5 Flash) > gemini-2.0-flash > gemini-2.5-flash-lite > gemini-flash-lite-latest
        const candidates = [
            AI_CONFIG.GEMINI.MODEL || 'gemini-2.5-flash',
            'gemini-flash-latest',
            'gemini-2.0-flash',
            'gemini-2.5-flash-lite',
            'gemini-flash-lite-latest'
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
                    let emittedAnyText = false;
                    for await (const part of finalStream) {
                        console.log(`=== [STREAM PART (${activeModelUsed})] ===`, part.type, JSON.stringify(part).slice(0, 300));
                        if (part.type === 'text-delta') {
                            emittedAnyText = emittedAnyText || Boolean(part.text?.trim());
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

                    // Một số lần Gemini có thể kết thúc stream với 0 output tokens.
                    // Bơm fallback ngắn để UI luôn có nội dung hiển thị.
                    if (!emittedAnyText) {
                        const lowerMessage = message.toLowerCase();
                        const latestUserMessage = [...history]
                            .reverse()
                            .find((m) => m.role === 'user')?.content?.toLowerCase() || '';
                        const latestAssistantMessage = [...history]
                            .reverse()
                            .find((m) => m.role === 'assistant')?.content?.toLowerCase() || '';

                        const hasWallIntent =
                            lowerMessage.includes('xây tường') ||
                            lowerMessage.includes('tuong') ||
                            lowerMessage.includes('tường');
                        const hasAreaIntent =
                            /\b\d+(\.\d+)?\s*(m2|m²)\b/.test(lowerMessage) ||
                            lowerMessage.includes('diện tích');
                        const hasBrickContext =
                            lowerMessage.includes('gạch') ||
                            latestUserMessage.includes('gạch') ||
                            latestAssistantMessage.includes('gạch');

                        let fallbackText =
                            'SmartBuild AI gửi anh/chị bảng giá nhanh theo nhóm vật liệu: xi măng, gạch, thép, cát đá và sơn. Anh/chị muốn xem nhóm nào trước để SmartBuild AI báo giá gọn nhất ạ?';

                        if (hasWallIntent && hasAreaIntent) {
                            fallbackText =
                                'Với tường khoảng 20m2, SmartBuild AI có thể tính nhanh định mức gạch, xi măng và cát xây cho anh/chị ngay. Anh/chị xác nhận giúp SmartBuild AI là mình xây tường 10 hay tường 20 để chốt số lượng chuẩn nhé?';
                        } else if (hasBrickContext) {
                            fallbackText =
                                'SmartBuild AI gửi nhanh bảng giá nhóm gạch phổ biến: gạch đinh, gạch ống và gạch men. Anh/chị muốn xem giá loại gạch xây hay gạch lát để SmartBuild AI báo đúng nhu cầu ạ?';
                        } else if (lowerMessage.includes('xi măng') || lowerMessage.includes('ximang')) {
                            fallbackText =
                                'SmartBuild AI có bảng giá xi măng theo bao 50kg (INSEE, Hà Tiên, Nghi Sơn). Anh/chị muốn xem giá lẻ hay giá sỉ để SmartBuild AI báo gọn ngay ạ?';
                        } else if (lowerMessage.includes('thép') || lowerMessage.includes('sat')) {
                            fallbackText =
                                'SmartBuild AI có bảng giá thép theo phi và kg (phi 6, 8, 10, 12...). Anh/chị muốn xem theo thương hiệu hay theo đường kính để SmartBuild AI gửi đúng bảng giá ạ?';
                        } else if (lowerMessage.includes('sơn')) {
                            fallbackText =
                                'SmartBuild AI có bảng giá sơn nội thất, ngoại thất và chống thấm. Anh/chị muốn xem nhóm nào trước để SmartBuild AI gửi bảng giá ngắn gọn ạ?';
                        }

                        const payload = JSON.stringify({
                            text: fallbackText
                        });
                        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
                    }

                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (err) {
                    console.error('Stream error:', err);
                    cachedWorkingModel = null; // Invalidate cached working model on mid-stream crash
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
