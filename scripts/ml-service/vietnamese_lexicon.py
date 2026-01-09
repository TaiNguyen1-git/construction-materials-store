#!/usr/bin/env python3
"""
Vietnamese Sentiment Lexicon and Synonyms for VLXD (Building Materials)
Contains Vietnamese words with sentiment weights, modifiers, and domain-specific synonyms
"""

# =============================================================================
# SENTIMENT LEXICON
# =============================================================================

# Positive words with weights (1.0 = standard, 2.0 = very strong)
POSITIVE_WORDS = {
    # General positive
    "tốt": 1.0,
    "hay": 1.0,
    "đẹp": 1.0,
    "nhanh": 1.0,
    "ổn": 0.8,
    "được": 0.5,
    "ok": 0.6,
    "okay": 0.6,
    
    # Strong positive
    "tuyệt vời": 2.0,
    "xuất sắc": 2.0,
    "hoàn hảo": 2.0,
    "tuyệt hảo": 2.0,
    "rất tốt": 1.5,
    "quá tốt": 1.5,
    "cực tốt": 1.8,
    
    # Service related
    "uy tín": 1.5,
    "chuyên nghiệp": 1.5,
    "nhiệt tình": 1.5,
    "chu đáo": 1.5,
    "tận tâm": 1.5,
    "lịch sự": 1.2,
    "thân thiện": 1.2,
    "hỗ trợ tốt": 1.5,
    
    # Quality related
    "chất lượng": 1.0,
    "bền": 1.2,
    "đảm bảo": 1.2,
    "chuẩn": 1.0,
    "chính hãng": 1.3,
    "xịn": 1.2,
    "ngon": 1.0,
    
    # Price related
    "rẻ": 1.0,
    "hợp lý": 1.2,
    "phải chăng": 1.2,
    "giá tốt": 1.3,
    "tiết kiệm": 1.2,
    "xứng đáng": 1.2,
    "đáng tiền": 1.3,
    
    # Delivery related
    "đúng hẹn": 1.5,
    "giao nhanh": 1.5,
    "đóng gói tốt": 1.3,
    "đóng gói cẩn thận": 1.5,
    "nguyên vẹn": 1.2,
    
    # Satisfaction
    "hài lòng": 1.5,
    "thỏa mãn": 1.5,
    "recommend": 1.5,
    "giới thiệu": 1.2,
    "ủng hộ": 1.3,
    "quay lại": 1.3,
    "mua tiếp": 1.3,
    "5 sao": 2.0,
}

# Negative words with weights (-1.0 = standard, -2.0 = very strong)
NEGATIVE_WORDS = {
    # General negative
    "xấu": -1.0,
    "tệ": -1.5,
    "dở": -1.0,
    "kém": -1.0,
    "tồi": -1.2,
    "chán": -1.0,
    
    # Strong negative
    "thất vọng": -2.0,
    "rất tệ": -1.8,
    "quá tệ": -1.8,
    "cực tệ": -2.0,
    "kinh khủng": -2.0,
    "tệ hại": -2.0,
    "lừa đảo": -2.0,
    "scam": -2.0,
    "gian lận": -2.0,
    
    # Service related
    "không uy tín": -1.5,
    "thái độ xấu": -1.5,
    "thiếu chuyên nghiệp": -1.5,
    "hời hợt": -1.2,
    "cẩu thả": -1.5,
    "vô trách nhiệm": -1.8,
    
    # Quality related
    "hư": -1.5,
    "hỏng": -1.5,
    "lỗi": -1.3,
    "khuyết điểm": -1.0,
    "giả": -2.0,
    "nhái": -1.8,
    "kém chất lượng": -1.5,
    "không đảm bảo": -1.3,
    
    # Price related
    "đắt": -1.0,
    "quá đắt": -1.5,
    "chặt chém": -1.8,
    "không đáng tiền": -1.5,
    "phí tiền": -1.5,
    
    # Delivery related
    "chậm": -1.0,
    "trễ": -1.0,
    "giao chậm": -1.3,
    "giao trễ": -1.3,
    "hư hỏng": -1.5,
    "vỡ": -1.5,
    "móp": -1.2,
    "méo": -1.2,
    "ướt": -1.3,
    "thiếu hàng": -1.5,
    "giao sai": -1.5,
    "đóng gói tệ": -1.5,
    
    # Dissatisfaction
    "không hài lòng": -1.5,
    "không bao giờ": -1.5,
    "tức giận": -1.8,
    "bực mình": -1.5,
    "1 sao": -2.0,
}

# =============================================================================
# MODIFIERS
# =============================================================================

# Intensifiers - multiply sentiment by this value
INTENSIFIERS = {
    "rất": 1.5,
    "cực kỳ": 1.8,
    "cực": 1.8,
    "vô cùng": 1.8,
    "quá": 1.5,
    "siêu": 1.6,
    "thật sự": 1.3,
    "thực sự": 1.3,
    "hoàn toàn": 1.4,
    "tuyệt đối": 1.5,
    "vô địch": 1.5,
}

# Diminishers - reduce sentiment intensity
DIMINISHERS = {
    "hơi": 0.7,
    "một chút": 0.6,
    "chút": 0.6,
    "khá": 0.8,
    "tương đối": 0.8,
    "cũng": 0.7,
    "tạm": 0.6,
}

# Negators - flip sentiment polarity
NEGATORS = {
    "không": -1.0,
    "chẳng": -1.0,
    "đừng": -1.0,
    "chưa": -0.8,
    "hổng": -1.0,  # Southern Vietnamese
    "hem": -1.0,   # Informal
    "ko": -1.0,    # Internet slang
}

# =============================================================================
# ASPECT KEYWORDS
# =============================================================================

ASPECT_KEYWORDS = {
    "giao_hang": [
        "giao", "ship", "shipping", "giao hàng", "vận chuyển", "nhận hàng",
        "đóng gói", "bọc", "kiện hàng", "shipper", "đơn hàng", "gói hàng"
    ],
    "chat_luong": [
        "chất lượng", "hàng", "sản phẩm", "đảm bảo", "chuẩn", "xịn",
        "bền", "chính hãng", "nguyên liệu", "vật liệu", "hư", "hỏng"
    ],
    "gia_ca": [
        "giá", "rẻ", "đắt", "hợp lý", "phải chăng", "tiền", "chi phí",
        "giá cả", "mức giá", "báo giá", "thanh toán"
    ],
    "dich_vu": [
        "nhân viên", "tư vấn", "hỗ trợ", "thái độ", "nhiệt tình",
        "chăm sóc", "phục vụ", "support", "cskh", "chuyên nghiệp"
    ],
    "thoi_gian": [
        "nhanh", "chậm", "đúng hẹn", "trễ", "kịp", "thời gian",
        "ngày", "giờ", "hôm", "tuần"
    ]
}

# =============================================================================
# VLXD-SPECIFIC SYNONYMS (for semantic search query expansion)
# =============================================================================

VLXD_SYNONYMS = {
    # Materials
    "chịu lửa": ["chịu nhiệt", "refractory", "samot", "chống cháy"],
    "thép": ["sắt", "steel", "inox", "thép không gỉ"],
    "xi măng": ["cement", "ximang", "xm", "bê tông"],
    "gạch": ["brick", "gạch ống", "gạch đặc", "gạch không nung"],
    "cát": ["sand", "cát vàng", "cát xây", "cát đen"],
    "đá": ["stone", "đá dăm", "đá 1x2", "đá 4x6"],
    "sơn": ["paint", "sơn nước", "sơn dầu", "sơn phủ"],
    
    # Properties
    "rẻ": ["giá rẻ", "tiết kiệm", "phải chăng", "giá tốt", "rẻ tiền"],
    "tốt": ["chất lượng", "bền", "đảm bảo", "uy tín"],
    "chống thấm": ["waterproof", "không thấm nước", "chịu nước"],
    
    # Brands shortcuts
    "holcim": ["xi măng holcim", "pcb40"],
    "hoa sen": ["thép hoa sen", "tôn hoa sen"],
    "hoà phát": ["thép hoà phát", "hoa phat"],
    "vicem": ["xi măng vicem", "hà tiên"],
    
    # Common misspellings
    "ximang": ["xi măng"],
    "gach": ["gạch"],
    "thep": ["thép"],
    "son": ["sơn"],
}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def get_word_sentiment(word: str) -> tuple:
    """
    Get sentiment value for a word
    Returns: (sentiment_value, is_positive)
    """
    word_lower = word.lower().strip()
    
    if word_lower in POSITIVE_WORDS:
        return (POSITIVE_WORDS[word_lower], True)
    elif word_lower in NEGATIVE_WORDS:
        return (NEGATIVE_WORDS[word_lower], False)
    
    return (0.0, None)


def get_modifier_value(word: str) -> tuple:
    """
    Get modifier type and value
    Returns: (modifier_type, value) where type is 'intensifier', 'diminisher', 'negator', or None
    """
    word_lower = word.lower().strip()
    
    if word_lower in INTENSIFIERS:
        return ("intensifier", INTENSIFIERS[word_lower])
    elif word_lower in DIMINISHERS:
        return ("diminisher", DIMINISHERS[word_lower])
    elif word_lower in NEGATORS:
        return ("negator", NEGATORS[word_lower])
    
    return (None, 1.0)


def get_aspect(text: str) -> str:
    """
    Detect aspect from text snippet
    Returns aspect key or None
    """
    text_lower = text.lower()
    
    for aspect, keywords in ASPECT_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                return aspect
    
    return None


def expand_query(query: str) -> list:
    """
    Expand query with synonyms
    Returns list of expanded queries
    """
    expanded = [query]
    query_lower = query.lower()
    
    for term, synonyms in VLXD_SYNONYMS.items():
        if term in query_lower:
            for syn in synonyms:
                expanded.append(query_lower.replace(term, syn))
    
    return list(set(expanded))


if __name__ == "__main__":
    # Test
    print("=== Sentiment Lexicon Test ===")
    print(f"'tốt' sentiment: {get_word_sentiment('tốt')}")
    print(f"'tệ' sentiment: {get_word_sentiment('tệ')}")
    print(f"'rất' modifier: {get_modifier_value('rất')}")
    
    print("\n=== Query Expansion Test ===")
    print(f"Expand 'gạch chịu lửa': {expand_query('gạch chịu lửa')}")
    print(f"Expand 'xi măng chống thấm': {expand_query('xi măng chống thấm')}")
    
    print("\n=== Aspect Detection Test ===")
    print(f"Aspect of 'giao hàng nhanh': {get_aspect('giao hàng nhanh')}")
    print(f"Aspect of 'giá hợp lý': {get_aspect('giá hợp lý')}")
