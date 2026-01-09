# Tài Liệu Kỹ Thuật: Hệ Thống Gợi Ý Nhà Thầu

## Tổng Quan

### Mục Tiêu
Xây dựng hệ thống gợi ý nhà thầu phù hợp nhất cho mỗi dự án xây dựng, dựa trên việc phân tích nội dung mô tả dự án, hồ sơ nhà thầu và các yếu tố liên quan.

### Phương Pháp
- **Loại hệ thống**: Hybrid Recommendation System
- **Kỹ thuật chính**: Content-Based Filtering kết hợp Rule-Based Scoring
- **Mô hình NLP**: TF-IDF Vectorization với Cosine Similarity

### Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTEM ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Next.js Application - Vercel]                             │
│       │                                                     │
│       └── POST /api/recommendations/contractors             │
│                     │                                       │
│                     ↓                                       │
│  [ML Service - Render Free Tier]                            │
│       │                                                     │
│       ├── /health     (Health check)                        │
│       ├── /predict    (Get recommendations)                 │
│       └── /retrain    (Retrain model)                       │
│                     │                                       │
│                     ↓                                       │
│  [GitHub Actions]                                           │
│       │                                                     │
│       ├── Keep-warm job (every 14 minutes)                  │
│       └── Retrain job (weekly)                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Công Thức Tính Matching Score

### Công Thức Tổng Hợp

```
FINAL_SCORE = (α × Text_Similarity) + (β × Profile_Score) + (γ × Location_Score)
```

**Trọng số:**
| Ký hiệu | Giá trị | Thành phần |
|---------|---------|------------|
| α | 0.50 | Text Similarity (50%) |
| β | 0.35 | Profile Score (35%) |
| γ | 0.15 | Location Score (15%) |

---

### 1. Text Similarity (50%)

#### Thuật Toán: TF-IDF + Cosine Similarity

**TF-IDF (Term Frequency - Inverse Document Frequency)**

TF-IDF là phương pháp đánh giá mức độ quan trọng của một từ trong tài liệu, so với toàn bộ corpus.

```
TF(t,d) = Số lần từ t xuất hiện trong document d
          ─────────────────────────────────────
          Tổng số từ trong document d

IDF(t) = log(N / df(t))

Trong đó:
  N = Tổng số documents trong corpus
  df(t) = Số documents chứa từ t

TF-IDF(t,d) = TF(t,d) × IDF(t)
```

**Cosine Similarity**

Đo lường độ tương đồng giữa 2 vector trong không gian n-chiều:

```
                    A · B           Σ(Ai × Bi)
cos(θ) = ───────────────────── = ─────────────────────
          ‖A‖ × ‖B‖             √Σ(Ai²) × √Σ(Bi²)

Trong đó:
  A = TF-IDF vector của Project Description
  B = TF-IDF vector của Contractor (Skills + Bio)
  
Kết quả: Giá trị từ 0 đến 1 (0 = không liên quan, 1 = hoàn toàn giống)
```

**Ví dụ minh họa:**

```
Input Project: "Xây nhà 3 tầng, cần thợ hồ giỏi, có kinh nghiệm xây biệt thự"

Sau khi vectorize:
Vector A = [0.32, 0.48, 0.21, 0.45, 0.12, 0.28, ...]

Contractor: 
  skills = ["thợ hồ", "xây dựng", "biệt thự"]
  bio = "10 năm kinh nghiệm xây dựng nhà ở và biệt thự"
  
Vector B = [0.38, 0.52, 0.15, 0.42, 0.18, 0.31, ...]

Text_Similarity = cosine(A, B) = 0.85 (85% tương đồng)
```

---

### 2. Profile Score (35%)

Đánh giá chất lượng và độ tin cậy của nhà thầu dựa trên hồ sơ.

**Công thức:**

```
Profile_Score = (w1 × Rating_Norm) + (w2 × Experience_Norm) + 
                (w3 × Jobs_Norm) + (w4 × Verified_Bonus)
```

**Trọng số chi tiết:**
| Ký hiệu | Giá trị | Thành phần |
|---------|---------|------------|
| w1 | 0.40 | Rating (Đánh giá trung bình) |
| w2 | 0.25 | Experience (Số năm kinh nghiệm) |
| w3 | 0.25 | Completed Jobs (Số công việc hoàn thành) |
| w4 | 0.10 | Verified Status (Đã xác minh) |

**Normalization (Chuẩn hóa Min-Max):**

```
Rating_Norm = avgRating / 5.0
  → Giá trị từ 0 đến 1

Experience_Norm = min(experienceYears / 20, 1.0)
  → Tối đa 20 năm = 1.0

Jobs_Norm = min(completedJobs / 100, 1.0)
  → Tối đa 100 jobs = 1.0

Verified_Bonus = 1.0 if isVerified else 0.0
  → Binary: có hoặc không
```

**Ví dụ tính toán:**

```
Contractor A:
  avgRating = 4.5        → Rating_Norm = 4.5/5 = 0.90
  experienceYears = 8    → Experience_Norm = 8/20 = 0.40
  completedJobs = 45     → Jobs_Norm = 45/100 = 0.45
  isVerified = true      → Verified_Bonus = 1.0

Profile_Score = (0.40 × 0.90) + (0.25 × 0.40) + (0.25 × 0.45) + (0.10 × 1.0)
              = 0.36 + 0.10 + 0.1125 + 0.10
              = 0.6725 (67.25%)
```

---

### 3. Location Score (15%)

Đánh giá mức độ gần gũi về địa lý giữa nhà thầu và dự án.

**Logic phân loại:**

```python
def calculate_location_score(contractor, project):
    if contractor.city == project.city and contractor.district == project.district:
        return 1.0      # Cùng quận/huyện
    elif contractor.city == project.city:
        return 0.8      # Cùng thành phố
    elif same_province(contractor, project):
        return 0.5      # Cùng tỉnh
    else:
        return 0.2      # Khác tỉnh
```

**Bảng điểm:**
| Mức độ gần | Điểm |
|------------|------|
| Cùng quận/huyện | 1.0 |
| Cùng thành phố | 0.8 |
| Cùng tỉnh | 0.5 |
| Khác tỉnh | 0.2 |

---

## Ví Dụ Tính Toán Hoàn Chỉnh

### Input

**Project:**
```json
{
  "title": "Xây nhà 2 tầng",
  "description": "Cần thợ hồ có kinh nghiệm xây nhà ở, biết đọc bản vẽ",
  "city": "Biên Hòa",
  "district": "Tân Phong",
  "budget": "500-800 triệu"
}
```

### Candidates

**Contractor A (Biên Hòa):**
```json
{
  "displayName": "Nguyễn Văn A",
  "skills": ["thợ hồ", "xây dựng", "đọc bản vẽ"],
  "bio": "15 năm kinh nghiệm xây nhà ở dân dụng",
  "city": "Biên Hòa",
  "avgRating": 4.5,
  "experienceYears": 15,
  "completedJobs": 78,
  "isVerified": true
}
```

**Contractor B (TP.HCM):**
```json
{
  "displayName": "Trần Văn B", 
  "skills": ["thợ hồ", "xây dựng", "nội thất"],
  "bio": "Chuyên xây dựng công trình thương mại",
  "city": "TP. Hồ Chí Minh",
  "avgRating": 4.8,
  "experienceYears": 12,
  "completedJobs": 95,
  "isVerified": true
}
```

### Tính Toán

**Contractor A:**
```
Text_Similarity = 0.85 (match cao với "thợ hồ", "xây", "nhà ở", "bản vẽ")

Profile_Score:
  Rating_Norm = 4.5/5 = 0.90
  Experience_Norm = 15/20 = 0.75
  Jobs_Norm = 78/100 = 0.78
  Verified_Bonus = 1.0
  → Profile_Score = (0.40×0.90) + (0.25×0.75) + (0.25×0.78) + (0.10×1.0)
                  = 0.36 + 0.1875 + 0.195 + 0.10 = 0.8425

Location_Score = 1.0 (cùng thành phố Biên Hòa)

FINAL_SCORE = (0.50 × 0.85) + (0.35 × 0.8425) + (0.15 × 1.0)
            = 0.425 + 0.295 + 0.15
            = 0.87 (87%)
```

**Contractor B:**
```
Text_Similarity = 0.62 (match thấp hơn, thiếu "nhà ở", "bản vẽ")

Profile_Score:
  Rating_Norm = 4.8/5 = 0.96
  Experience_Norm = 12/20 = 0.60
  Jobs_Norm = 95/100 = 0.95
  Verified_Bonus = 1.0
  → Profile_Score = (0.40×0.96) + (0.25×0.60) + (0.25×0.95) + (0.10×1.0)
                  = 0.384 + 0.15 + 0.2375 + 0.10 = 0.8715

Location_Score = 0.5 (cùng vùng Đông Nam Bộ)

FINAL_SCORE = (0.50 × 0.62) + (0.35 × 0.8715) + (0.15 × 0.5)
            = 0.31 + 0.305 + 0.075
            = 0.69 (69%)
```

### Kết Quả

| Rank | Contractor | Score | Lý do |
|------|------------|-------|-------|
| 1 | Nguyễn Văn A | 87% | Match kỹ năng cao, cùng địa phương |
| 2 | Trần Văn B | 69% | Profile tốt nhưng xa và ít match nội dung |

---

## Mô Hình Chi Tiết

### Kiến Trúc Model

```
┌─────────────────────────────────────────────────────────────┐
│                    MODEL ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Input Layer]                                              │
│       │                                                     │
│       ├── Project Description (text)                        │
│       ├── Project Requirements (list[string])               │
│       ├── Project Location (city, district)                 │
│       └── Budget Range (optional)                           │
│                                                             │
│  [Preprocessing Layer]                                      │
│       │                                                     │
│       ├── Text Normalization                                │
│       │   └── Lowercase, remove punctuation                 │
│       │                                                     │
│       ├── Vietnamese Tokenization (Underthesea)             │
│       │   └── Word segmentation for Vietnamese              │
│       │                                                     │
│       └── Stopword Removal                                  │
│           └── Remove common Vietnamese stopwords            │
│                                                             │
│  [Feature Extraction Layer]                                 │
│       │                                                     │
│       └── TF-IDF Vectorizer                                 │
│           ├── Vocabulary size: ~5,000 terms                 │
│           ├── N-grams: unigram + bigram                     │
│           └── Max features: 5,000                           │
│                                                             │
│  [Matching Engine]                                          │
│       │                                                     │
│       ├── Cosine Similarity Calculator                      │
│       ├── Profile Score Calculator                          │
│       └── Location Score Calculator                         │
│                                                             │
│  [Aggregation Layer]                                        │
│       │                                                     │
│       └── Weighted Sum: 0.5×Text + 0.35×Profile + 0.15×Loc  │
│                                                             │
│  [Output Layer]                                             │
│       │                                                     │
│       └── Ranked List with explanations                     │
│           [{contractor_id, score, reasons[]}, ...]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Preprocessing Pipeline

```
Raw Text
    │
    ↓
┌─────────────────────┐
│ 1. Lowercase        │ "Xây NHÀ 3 Tầng" → "xây nhà 3 tầng"
└─────────────────────┘
    │
    ↓
┌─────────────────────┐
│ 2. Remove Punct.    │ "xây nhà 3 tầng!!!" → "xây nhà 3 tầng"
└─────────────────────┘
    │
    ↓
┌─────────────────────┐
│ 3. Tokenize (VN)    │ "xây nhà 3 tầng" → ["xây", "nhà", "3", "tầng"]
│    Underthesea      │ "thợ hồ" → ["thợ_hồ"] (compound word)
└─────────────────────┘
    │
    ↓
┌─────────────────────┐
│ 4. Remove Stopwords │ ["cần", "có", "và", "là"] removed
└─────────────────────┘
    │
    ↓
┌─────────────────────┐
│ 5. TF-IDF Vector    │ → [0.15, 0.22, 0.35, 0.18, ...]
└─────────────────────┘
```

---

## Technology Stack

### Thư Viện Python

| Thư viện | Version | Mục đích |
|----------|---------|----------|
| Flask | 3.0.x | REST API Framework |
| scikit-learn | 1.3.x | TF-IDF Vectorizer, Cosine Similarity |
| underthesea | 6.8.x | Vietnamese NLP Tokenization |
| joblib | 1.3.x | Model Serialization |
| numpy | 1.24.x | Numerical Operations |
| gunicorn | 21.x | Production WSGI Server |

### Infrastructure

| Component | Platform | Tier |
|-----------|----------|------|
| ML API | Render | Free |
| Main App | Vercel | Free |
| Database | MongoDB Atlas | Free |
| Scheduler | GitHub Actions | Free |

### API Endpoints

```
POST /predict
  Input: {
    "project_description": string,
    "project_requirements": string[],
    "project_city": string,
    "project_district": string,
    "limit": number (default: 10)
  }
  Output: {
    "success": true,
    "recommendations": [
      {
        "contractor_id": string,
        "score": float,
        "text_similarity": float,
        "profile_score": float,
        "location_score": float,
        "reasons": string[]
      }
    ]
  }

GET /health
  Output: { "status": "healthy", "model_loaded": true }

POST /retrain
  Headers: { "Authorization": "Bearer <SECRET>" }
  Output: { "success": true, "message": "Model retrained" }
```

---

## Đánh Giá Hiệu Năng

### Metrics

| Metric | Target | Mô tả |
|--------|--------|-------|
| Precision@5 | > 70% | Trong top 5 gợi ý, 70%+ là relevant |
| Precision@10 | > 60% | Trong top 10 gợi ý, 60%+ là relevant |
| MRR | > 0.6 | Mean Reciprocal Rank |
| Response Time | < 500ms | Thời gian phản hồi API |
| Cold Start | < 60s | Thời gian khởi động sau sleep |

### Feedback Loop

```
┌─────────────────────────────────────────────────────────────┐
│                    FEEDBACK LOOP                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User nhận danh sách gợi ý contractors                   │
│                     ↓                                       │
│  2. User chọn 1 contractor để liên hệ/thuê                  │
│                     ↓                                       │
│  3. System lưu: (project_id, chosen_contractor, position)   │
│                     ↓                                       │
│  4. Sau khi hoàn thành: lưu rating, success status          │
│                     ↓                                       │
│  5. Weekly retrain với dữ liệu mới                          │
│                     ↓                                       │
│  6. Model cải thiện theo thời gian                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Ưu Điểm & Hạn Chế

### Ưu Điểm

1. **Không cần dữ liệu lịch sử để bắt đầu**: Content-based approach cho phép gợi ý ngay từ đầu
2. **Chi phí thấp**: Chạy được trên free tier (RAM < 512MB)
3. **Xử lý tiếng Việt**: Sử dụng Underthesea cho tokenization chính xác
4. **Interpretable**: Có thể giải thích tại sao gợi ý contractor này
5. **Có khả năng học**: Feedback loop cho phép cải thiện theo thời gian

### Hạn Chế

1. **Cold start**: Render free tier sleep sau 15 phút → ~30-60s để khởi động lại
2. **Vocabulary limited**: TF-IDF không hiểu synonyms (thợ hồ ≠ thợ xây)
3. **No semantic understanding**: Không hiểu ngữ cảnh sâu như LLM
4. **Manual weight tuning**: Trọng số (α, β, γ) cần điều chỉnh thủ công

### Hướng Phát Triển

1. **FastText embeddings**: Thay TF-IDF bằng word embeddings để hiểu synonyms
2. **Learning to Rank**: Train model học từ click data
3. **A/B Testing**: So sánh các phiên bản algorithm
4. **Real-time personalization**: Gợi ý dựa trên lịch sử user

---

## Kết Luận

Hệ thống gợi ý nhà thầu sử dụng phương pháp Hybrid Recommendation kết hợp:
- **Content-Based Filtering** (TF-IDF + Cosine Similarity) để matching nội dung
- **Rule-Based Scoring** để đánh giá profile và location

Công thức tính điểm:
```
FINAL_SCORE = 0.50×TextSimilarity + 0.35×ProfileScore + 0.15×LocationScore
```

Hệ thống phù hợp cho:
- Dự án demo/MVP với ngân sách hạn chế
- Deployment trên free tier infrastructure
- Xử lý ngôn ngữ tiếng Việt
- Có khả năng mở rộng và cải thiện theo thời gian

---

*Tài liệu được tạo: 08/01/2026*
*Phiên bản: 1.0*
