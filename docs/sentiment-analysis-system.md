# Tài Liệu Kỹ Thuật: Hệ Thống Phân Tích Cảm Xúc (Sentiment Analysis)

## Tổng Quan

### Mục Tiêu
Phân tích tự động nội dung đánh giá (reviews) của khách hàng để xác định cảm xúc (positive/negative/neutral), trích xuất các chủ đề chính, và cung cấp insights cho admin/nhà thầu.

### Phương Pháp
- **Loại hệ thống**: Natural Language Processing (NLP)
- **Kỹ thuật chính**: Lexicon-based + Machine Learning Hybrid
- **Ngôn ngữ xử lý**: Tiếng Việt

### Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────────┐
│                 SENTIMENT ANALYSIS SYSTEM                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Review Input]                                             │
│       │                                                     │
│       ↓                                                     │
│  [Preprocessing Layer]                                      │
│       ├── Text normalization                                │
│       ├── Vietnamese tokenization (Underthesea)             │
│       └── Stopword removal                                  │
│                     │                                       │
│                     ↓                                       │
│  [Sentiment Analysis Engine]                                │
│       ├── Lexicon-based scoring                             │
│       ├── Aspect extraction                                 │
│       └── Confidence calculation                            │
│                     │                                       │
│                     ↓                                       │
│  [Output]                                                   │
│       ├── Sentiment: POSITIVE/NEGATIVE/NEUTRAL              │
│       ├── Score: -1.0 to +1.0                               │
│       ├── Aspects: [giao hàng, chất lượng, giá cả, ...]     │
│       └── Confidence: 0.0 to 1.0                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Công Thức Tính Sentiment Score

### Phương Pháp 1: Lexicon-Based (Từ điển)

#### Công Thức Cơ Bản

```
Sentiment_Score = (Σ Positive_Words - Σ Negative_Words) / Total_Words

Trong đó:
  Positive_Words = số từ tích cực (tốt, đẹp, nhanh, uy tín, ...)
  Negative_Words = số từ tiêu cực (chậm, xấu, tệ, thất vọng, ...)
  Total_Words = tổng số từ có nghĩa trong review
```

#### Weighted Lexicon Score

```
Weighted_Score = Σ(word_i × weight_i × modifier_i) / N

Trong đó:
  word_i = 1 (positive) hoặc -1 (negative)
  weight_i = mức độ mạnh của từ (0.5 - 2.0)
  modifier_i = hệ số điều chỉnh (negation, intensifier)
  N = số từ sentiment
```

### Bảng Từ Điển Tiếng Việt

#### Positive Words (Từ Tích Cực)

| Từ | Weight | Loại |
|----|--------|------|
| tốt | 1.0 | Standard |
| rất tốt | 1.5 | Intensified |
| tuyệt vời | 2.0 | Strong |
| xuất sắc | 2.0 | Strong |
| nhanh | 1.0 | Standard |
| uy tín | 1.5 | Strong |
| chất lượng | 1.0 | Standard |
| đẹp | 1.0 | Standard |
| hài lòng | 1.5 | Strong |
| recommend | 1.5 | Strong |

#### Negative Words (Từ Tiêu Cực)

| Từ | Weight | Loại |
|----|--------|------|
| chậm | -1.0 | Standard |
| xấu | -1.0 | Standard |
| tệ | -1.5 | Strong |
| thất vọng | -2.0 | Strong |
| dở | -1.0 | Standard |
| kém | -1.0 | Standard |
| hư | -1.5 | Strong |
| lừa đảo | -2.0 | Strong |
| không uy tín | -1.5 | Negated |

#### Modifiers (Bộ điều chỉnh)

| Loại | Từ | Hệ số |
|------|-----|-------|
| Intensifier | rất, cực kỳ, quá | ×1.5 |
| Diminisher | hơi, một chút, khá | ×0.7 |
| Negation | không, chẳng, đừng | ×(-1) |

### Ví Dụ Tính Toán

```
Review: "Giao hàng rất nhanh, xi măng chất lượng tốt. Rất hài lòng!"

Tokenize: ["giao hàng", "rất", "nhanh", "xi măng", "chất lượng", "tốt", "rất", "hài lòng"]

Phân tích:
  - "nhanh" = +1.0, modifier "rất" = ×1.5 → +1.5
  - "chất lượng" = +1.0 → +1.0
  - "tốt" = +1.0 → +1.0
  - "hài lòng" = +1.5, modifier "rất" = ×1.5 → +2.25

Total_Score = (1.5 + 1.0 + 1.0 + 2.25) / 4 = 1.4375
Normalized = 1.4375 / 2.0 = 0.72 (scale to 0-1)

Final: POSITIVE (0.72)
```

---

## Phương Pháp 2: Aspect-Based Sentiment Analysis

### Mục Đích
Không chỉ phân tích tổng thể, mà còn xác định cảm xúc theo từng khía cạnh cụ thể.

### Các Aspect (Khía cạnh) Chính

| Aspect | Keywords |
|--------|----------|
| **Giao hàng** | giao, ship, vận chuyển, nhận hàng, đóng gói |
| **Chất lượng** | chất lượng, hàng, sản phẩm, đảm bảo, chuẩn |
| **Giá cả** | giá, rẻ, đắt, hợp lý, phải chăng |
| **Dịch vụ** | nhân viên, tư vấn, hỗ trợ, thái độ, nhiệt tình |
| **Thời gian** | nhanh, chậm, đúng hẹn, trễ |

### Công Thức Aspect Extraction

```python
def extract_aspects(review):
    aspects = {}
    sentences = split_sentences(review)
    
    for sentence in sentences:
        detected_aspect = detect_aspect(sentence)  # Dựa vào keywords
        sentiment = calculate_sentiment(sentence)
        
        if detected_aspect:
            aspects[detected_aspect] = sentiment
    
    return aspects
```

### Ví Dụ

```
Review: "Giao hàng nhanh, nhưng xi măng bị ướt. Giá thì hợp lý."

Output:
{
  "overall": 0.2 (NEUTRAL),
  "aspects": {
    "giao_hang": { "sentiment": "POSITIVE", "score": 0.7 },
    "chat_luong": { "sentiment": "NEGATIVE", "score": -0.6 },
    "gia_ca": { "sentiment": "POSITIVE", "score": 0.5 }
  }
}
```

---

## Phương Pháp 3: Machine Learning (Nâng cao)

### Model Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ML SENTIMENT MODEL                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Input] Review Text                                        │
│       │                                                     │
│       ↓                                                     │
│  [TF-IDF Vectorizer]                                        │
│       │  Max features: 5000                                 │
│       │  N-grams: (1, 2)                                    │
│       ↓                                                     │
│  [Classifier]                                               │
│       │  Options:                                           │
│       │  - Naive Bayes (nhanh, đơn giản)                    │
│       │  - Logistic Regression (cân bằng)                   │
│       │  - SVM (chính xác hơn)                              │
│       ↓                                                     │
│  [Output]                                                   │
│       ├── Class: POSITIVE/NEGATIVE/NEUTRAL                  │
│       └── Probabilities: [0.1, 0.85, 0.05]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Training Data Requirements

| Class | Số lượng tối thiểu | Nguồn |
|-------|-------------------|-------|
| POSITIVE | 200+ reviews | Reviews 4-5 sao |
| NEGATIVE | 200+ reviews | Reviews 1-2 sao |
| NEUTRAL | 100+ reviews | Reviews 3 sao |

---

## API Specification

### Endpoint

```
POST /api/sentiment/analyze
```

### Request

```json
{
  "text": "Giao hàng nhanh, hàng chất lượng tốt!",
  "options": {
    "includeAspects": true,
    "includeConfidence": true
  }
}
```

### Response

```json
{
  "success": true,
  "data": {
    "sentiment": "POSITIVE",
    "score": 0.78,
    "confidence": 0.92,
    "aspects": {
      "giao_hang": { "sentiment": "POSITIVE", "score": 0.8 },
      "chat_luong": { "sentiment": "POSITIVE", "score": 0.75 }
    },
    "keywords": {
      "positive": ["nhanh", "chất lượng", "tốt"],
      "negative": []
    }
  }
}
```

---

## Ứng Dụng Thực Tế

### 1. Dashboard Admin

```
┌────────────────────────────────────────────────┐
│  📊 SENTIMENT OVERVIEW - Tuần này              │
├────────────────────────────────────────────────┤
│                                                │
│  Positive: ████████████████████ 72%            │
│  Neutral:  ██████ 18%                          │
│  Negative: ███ 10%                             │
│                                                │
│  ⚠️ Cảnh báo: 5 reviews negative về "giao hàng"│
│                                                │
└────────────────────────────────────────────────┘
```

### 2. Product Page

```
Xi măng Holcim PCB40
★★★★☆ 4.2 (156 reviews)

📊 Phân tích reviews:
• Chất lượng: 92% positive ✅
• Giá cả: 78% positive ✅
• Giao hàng: 65% positive ⚠️
```

### 3. Contractor Profile

```
Nhà thầu: Công ty XYZ
★★★★★ 4.8 (42 reviews)

Khách hàng nói gì:
✅ Chuyên nghiệp (mentioned 35 times)
✅ Đúng hẹn (mentioned 28 times)
⚠️ Giá cao (mentioned 8 times)
```

---

## Technology Stack

### Python Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| underthesea | 6.8.x | Vietnamese NLP |
| scikit-learn | 1.3.x | ML classifiers |
| nltk | 3.8.x | Text processing |
| Flask | 3.0.x | API server |

### Infrastructure

| Component | Platform |
|-----------|----------|
| Sentiment API | Render Free |
| Main App | Vercel |
| Database | MongoDB Atlas |

---

## Metrics & Evaluation

| Metric | Target | Mô tả |
|--------|--------|-------|
| Accuracy | > 80% | Tỷ lệ phân loại đúng |
| Precision | > 75% | Độ chính xác positive prediction |
| Recall | > 75% | Tỷ lệ phát hiện đúng |
| F1-Score | > 0.77 | Harmonic mean |
| Response Time | < 200ms | Thời gian phân tích 1 review |

---

## Ưu Điểm & Hạn Chế

### Ưu Điểm
1. **Tự động hóa**: Không cần đọc thủ công hàng trăm reviews
2. **Insights nhanh**: Dashboard real-time
3. **Aspect-level**: Biết chính xác khách phàn nàn điều gì
4. **Xử lý tiếng Việt**: Dùng Underthesea cho tokenization

### Hạn Chế
1. **Sarcasm**: Khó phát hiện mỉa mai ("Tuyệt vời, chờ 1 tuần mới có hàng")
2. **Ngữ cảnh**: Một số từ thay đổi nghĩa theo context
3. **Từ mới**: Cần update từ điển định kỳ

---

*Tài liệu được tạo: 08/01/2026*
*Phiên bản: 1.0*
