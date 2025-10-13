# 📷 Hướng Dẫn Sử Dụng OCR (Quét Hóa Đơn)

## 🎯 Tính Năng

Tính năng OCR (Optical Character Recognition) cho phép bạn:
- ✅ **Quét hóa đơn tự động** từ camera hoặc thư viện ảnh
- ✅ **Trích xuất thông tin** như: Số hóa đơn, ngày, nhà cung cấp, sản phẩm, giá
- ✅ **Tạo nháp hóa đơn** tự động từ kết quả quét
- ✅ **Thêm sản phẩm mới** tự động nếu chưa có trong hệ thống
- ✅ **Đánh giá độ chính xác** của kết quả quét

## 🚀 Cách Sử Dụng

### 1. Mở Màn Hình OCR Scanner

Có 2 cách:

**Cách 1**: Từ Dashboard
- Vào Dashboard
- Chọn "Quét Hóa Đơn" trong Quick Actions (icon scan màu vàng)

**Cách 2**: Từ bottom tab
- Tab có icon `scan`

### 2. Cấp Quyền Camera

Lần đầu sử dụng, ứng dụng sẽ yêu cầu:
- ✅ Quyền truy cập **Camera** (để chụp ảnh)
- ✅ Quyền truy cập **Thư viện ảnh** (để chọn ảnh có sẵn)

**Lưu ý**: Phải cấp quyền để sử dụng tính năng!

### 3. Chụp Hoặc Chọn Ảnh Hóa Đơn

#### Chụp Ảnh Mới
1. Đặt hóa đơn trong khung hình chữ nhật (guide frame)
2. Đảm bảo ánh sáng đủ, hóa đơn rõ ràng
3. Nhấn nút chụp (nút tròn lớn màu xanh)

#### Chọn Từ Thư Viện
1. Nhấn icon `images` (góc dưới trái)
2. Chọn ảnh hóa đơn từ thư viện
3. Crop ảnh nếu cần

#### Tips Chụp Ảnh Tốt
- ✅ Đặt hóa đơn trên nền phẳng, sáng
- ✅ Tránh bóng mờ, mờ ảnh
- ✅ Chụp thẳng góc, không nghiêng
- ✅ Đảm bảo chữ rõ ràng, không bị nhòe
- ❌ Tránh chụp trong môi trường tối
- ❌ Tránh chụp khi hóa đơn bị nhàu, rách

### 4. Chọn Loại Quét

Sau khi chụp/chọn ảnh, chọn loại quét:

**Hóa Đơn** (Mặc định)
- Trích xuất thông tin cấu trúc: Số HĐ, ngày, NCC, sản phẩm, giá
- Tự động tạo nháp hóa đơn trong hệ thống
- Phù hợp với: Hóa đơn VAT, phiếu xuất kho

**Văn Bản**
- Chỉ trích xuất text thuần túy
- Không phân tích cấu trúc
- Phù hợp với: Ghi chú, tài liệu văn bản

### 5. Nhấn "Quét" Và Đợi Kết Quả

- Ảnh được upload lên server
- AI xử lý và trích xuất thông tin (5-10 giây)
- Hiển thị kết quả với độ chính xác

## 📊 Hiểu Kết Quả OCR

### Độ Chính Xác (Confidence Score)

**Thanh màu hiển thị độ tin cậy:**
- 🟢 **> 80%**: Rất chính xác - Có thể dùng ngay
- 🟡 **60-80%**: Tạm chấp nhận - Nên kiểm tra lại
- 🔴 **< 60%**: Thấp - Cần xem xét kỹ và sửa thủ công

### Thông Tin Trích Xuất

**Với loại "Hóa Đơn", hệ thống trích xuất:**

1. **Thông tin chung**
   - Số hóa đơn
   - Ngày phát hành
   - Nhà cung cấp

2. **Danh sách sản phẩm**
   - Tên sản phẩm
   - Số lượng
   - Đơn giá
   - Thành tiền

3. **Tổng tiền**
   - Tổng cộng từ hóa đơn

### Văn Bản Gốc

Phần "Văn Bản Gốc" hiển thị toàn bộ text được quét, giúp bạn:
- Kiểm tra xem có thông tin nào bị thiếu
- So sánh với dữ liệu đã trích xuất
- Copy text nếu cần

## 💾 Xử Lý Sau Quét

### Nếu Kết Quả Tốt (> 80%)

**Tự động:**
- ✅ Hệ thống tạo **nháp hóa đơn** trong database
- ✅ Tự động tìm/tạo nhà cung cấp
- ✅ Tự động tìm sản phẩm trong hệ thống
- ✅ Tạo mới sản phẩm nếu chưa có (đánh dấu inactive để review)

**Bạn cần làm:**
1. Nhấn "Lưu Kết Quả" để confirm
2. Vào menu "Hóa Đơn" để xem nháp
3. Kiểm tra và duyệt hóa đơn

### Nếu Kết Quả Kém (< 80%)

**Cảnh báo:**
- ⚠️ "Low confidence score - please review carefully"
- ⚠️ Nên kiểm tra kỹ trước khi dùng

**Bạn nên:**
1. So sánh với hóa đơn gốc
2. Sửa thông tin sai
3. Quét lại nếu kết quả quá tệ

## 🔄 Thao Tác

### Quét Lại
- Nhấn "Quét Lại" nếu kết quả không như mong muốn
- Camera sẽ mở lại để chụp ảnh khác

### Lưu Kết Quả
- Nhấn "Lưu Kết Quả" để tạo hóa đơn nháp
- Chuyển đến màn hình Hóa Đơn để xem và chỉnh sửa

### Hủy
- Nhấn "X" để hủy và quay lại màn hình trước

## 🔧 Backend API

### Endpoint

**POST** `/api/ocr/invoice`

**Request:**
```javascript
FormData {
  image: File (jpg/png),
  invoiceType: 'SUPPLIER' | 'CUSTOMER' // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ocrResult": {
      "extractedText": "...",
      "processedData": {
        "invoiceNumber": "INV-001",
        "date": "2025-01-10",
        "supplier": {
          "name": "Công ty ABC",
          "address": "123 Đường XYZ"
        },
        "items": [
          {
            "name": "Xi măng PC40",
            "quantity": 100,
            "unitPrice": 2000000,
            "unit": "bag",
            "total": 200000000
          }
        ],
        "totals": {
          "subtotal": 200000000,
          "tax": 20000000,
          "total": 220000000
        }
      },
      "confidence": 0.92
    },
    "draftInvoice": {
      "id": "...",
      "invoiceNumber": "INV-001",
      "status": "DRAFT"
    },
    "requiresReview": false
  }
}
```

## 🎓 Best Practices

### Để Có Kết Quả Tốt Nhất

1. **Chất lượng ảnh**
   - Độ phân giải cao (ít nhất 1080p)
   - Ánh sáng tự nhiên hoặc đèn LED trắng
   - Không có bóng mờ che chữ

2. **Góc chụp**
   - Chụp thẳng góc 90°
   - Hóa đơn nằm trong khung guide
   - Không bị biến dạng, nghiêng

3. **Loại hóa đơn**
   - ✅ Tốt: Hóa đơn in máy tính, font chữ rõ ràng
   - ⚠️ Tạm: Hóa đơn viết tay đẹp
   - ❌ Kém: Chữ viết tay xấu, mờ nhòe

4. **Kiểm tra sau quét**
   - Luôn xem lại kết quả trước khi lưu
   - Đối chiếu số liệu với hóa đơn gốc
   - Sửa lỗi nhỏ thay vì quét lại

### Xử Lý Lỗi Thường Gặp

**"Không thể xử lý hình ảnh"**
- Kiểm tra kết nối internet
- Đảm bảo backend API đang chạy
- Thử lại sau vài giây

**"Độ chính xác thấp"**
- Chụp lại với ánh sáng tốt hơn
- Đảm bảo hóa đơn nằm thẳng
- Thử dùng ảnh từ thư viện nếu có ảnh tốt hơn

**"Không tìm thấy sản phẩm"**
- Bình thường! Sản phẩm mới sẽ được tạo tự động
- Review và active sản phẩm mới sau

## 🔐 Bảo Mật & Privacy

- ✅ Ảnh được mã hóa khi upload
- ✅ Lưu trên server an toàn
- ✅ Chỉ admin/manager mới truy cập được
- ⚠️ Không quét thông tin cá nhân nhạy cảm
- ⚠️ Xóa ảnh gốc sau khi xử lý xong

## 📱 Yêu Cầu Hệ Thống

- **Android**: 5.0+ (API 21+), camera ít nhất 8MP
- **iOS**: 13.0+, camera ít nhất 8MP
- **Network**: Cần kết nối internet để xử lý
- **Storage**: ~50MB cho cache ảnh tạm

## 🐛 Troubleshooting

### Camera không mở được
```
1. Kiểm tra quyền camera trong Settings
2. Restart app
3. Restart device
```

### Upload thất bại
```
1. Kiểm tra kết nối internet
2. Kiểm tra backend API đang chạy
3. Thử với ảnh nhỏ hơn (<5MB)
```

### Kết quả sai hoàn toàn
```
1. Đảm bảo chọn đúng loại quét (Hóa đơn / Văn bản)
2. Chụp lại với chất lượng tốt hơn
3. Liên hệ support nếu vẫn lỗi
```

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Check README.md và SETUP.md
2. Xem logs trong terminal
3. Liên hệ team support

---

**Chúc bạn quét hóa đơn hiệu quả! 📷✨**
