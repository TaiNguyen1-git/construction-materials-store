# 📸 Hướng Dẫn Import Ảnh Sản Phẩm

## Vấn đề hiện tại
Ảnh sản phẩm hiển thị bên phía client không trùng khớp với sản phẩm thực tế.

## Giải pháp

Bạn có 2 lựa chọn:

### ✅ Option 1: Tự tìm ảnh và đặt vào folder (Khuyến nghị)

Tôi đã tạo script tự động để import ảnh từ folder local vào database.

#### Bước 1: Chuẩn bị ảnh

1. Tạo folder `product-images` ở thư mục gốc của project:
```
construction-materials-store/
├── product-images/          ← Tạo folder này
│   ├── XM-INSEE-PCB40/     ← Tên folder = SKU hoặc tên sản phẩm
│   │   ├── image1.jpg
│   │   ├── image2.jpg
│   │   └── image3.jpg
│   ├── THEP-CB240-D10/
│   │   ├── image1.jpg
│   │   └── image2.jpg
│   └── ...
```

2. **Cách đặt tên folder:**
   - **Option A (Khuyến nghị):** Dùng SKU của sản phẩm
     - Ví dụ: `XM-INSEE-PCB40`, `THEP-CB240-D10`, `GACH-OP-30X60`
   - **Option B:** Dùng tên sản phẩm
     - Ví dụ: `Xi măng INSEE PCB40`, `Thép CB240 D10`
     - Script sẽ tự động match với tên trong database

3. **Đặt ảnh vào folder:**
   - Mỗi sản phẩm có thể có nhiều ảnh
   - Đặt tên file ảnh bất kỳ (script sẽ tự động đổi tên)
   - Format ảnh hỗ trợ: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.svg`
   - Ảnh sẽ được sắp xếp theo thứ tự alphabet

#### Bước 2: Chạy script import

```bash
# Import ảnh (match theo SKU - mặc định)
npx tsx scripts/import-product-images-from-folder.ts

# Import ảnh (match theo tên sản phẩm)
MATCH_BY_NAME=true npx tsx scripts/import-product-images-from-folder.ts

# Force update (ghi đè ảnh cũ)
FORCE_UPDATE=true npx tsx scripts/import-product-images-from-folder.ts
```

#### Bước 3: Kiểm tra kết quả

Script sẽ:
- ✅ Copy ảnh vào `public/products/`
- ✅ Đổi tên file theo format: `[SKU]-1.jpg`, `[SKU]-2.jpg`, ...
- ✅ Update database với URLs: `/products/[SKU]-1.jpg`, `/products/[SKU]-2.jpg`, ...
- ✅ Hiển thị summary: số sản phẩm đã import, số lỗi, số không tìm thấy

---

### Option 2: Tìm ảnh online và cập nhật database

Nếu bạn muốn tôi giúp tìm ảnh online, tôi có thể:
1. Tạo script để update ảnh từ URLs online
2. Bạn chỉ cần cung cấp URLs hoặc tôi có thể tìm từ Unsplash/Pexels

**Lưu ý:** Option này có thể không chính xác 100% vì ảnh online có thể không đúng với sản phẩm thực tế.

---

## 📋 Cấu trúc Folder Chi Tiết

### Ví dụ 1: Dùng SKU (Khuyến nghị)

```
product-images/
├── XM-INSEE-PCB40/
│   ├── cement-bag-1.jpg
│   ├── cement-bag-2.jpg
│   └── cement-detail.jpg
├── XM-HATIEN-PCB40/
│   ├── hatien-cement.jpg
│   └── hatien-detail.jpg
├── THEP-CB240-D10/
│   ├── steel-rebar.jpg
│   └── steel-detail.jpg
└── GACH-OP-30X60/
    ├── brick-1.jpg
    ├── brick-2.jpg
    └── brick-3.jpg
```

### Ví dụ 2: Dùng Tên Sản Phẩm

```
product-images/
├── Xi măng INSEE PCB40/
│   ├── image1.jpg
│   └── image2.jpg
├── Thép CB240 D10/
│   └── steel.jpg
└── Gạch ốp 30x60/
    ├── tile1.jpg
    └── tile2.jpg
```

**Lưu ý:** Khi dùng tên sản phẩm, script sẽ fuzzy match nên có thể match sai. Tốt nhất là dùng SKU.

---

## 🔍 Kiểm tra SKU của Sản Phẩm

Nếu bạn không biết SKU của sản phẩm, có thể:

1. **Kiểm tra trong database:**
```bash
npx prisma studio
# Hoặc query trong code
```

2. **Chạy script để xem danh sách SKU:**
```bash
npx tsx scripts/check-missing-images.ts
```

3. **Hoặc tạo script mới để list tất cả products:**
Tôi có thể tạo script để export danh sách products với SKU và tên để bạn dễ dàng tạo folder.

---

## 🎯 Workflow Khuyến nghị

1. **Tìm ảnh sản phẩm:**
   - Chụp ảnh thực tế
   - Hoặc tải từ website nhà cung cấp
   - Hoặc tìm trên Google với tên sản phẩm chính xác

2. **Tổ chức ảnh:**
   ```
   product-images/
   ├── [SKU-1]/
   │   ├── image1.jpg
   │   └── image2.jpg
   ├── [SKU-2]/
   │   └── image1.jpg
   └── ...
   ```

3. **Chạy script import:**
   ```bash
   npx tsx scripts/import-product-images-from-folder.ts
   ```

4. **Verify trên website:**
   - Kiểm tra trang sản phẩm
   - Đảm bảo ảnh hiển thị đúng
   - Nếu sai, sửa lại folder và chạy lại với `FORCE_UPDATE=true`

---

## 📝 Lưu ý

1. **Ảnh sẽ được copy vào `public/products/`** - không xóa ảnh gốc trong `product-images/`
2. **Tên file sẽ được đổi** theo format: `[SKU]-[index].[ext]`
3. **URLs trong database** sẽ là relative paths: `/products/[SKU]-1.jpg`
4. **Script sẽ skip** sản phẩm đã có ảnh (trừ khi dùng `FORCE_UPDATE=true`)
5. **Nếu folder không match** với sản phẩm nào, script sẽ báo lỗi và list SKUs available

---

## 🆘 Troubleshooting

### Lỗi: "Product not found for folder: [folder-name]"

**Nguyên nhân:** Folder name không match với SKU hoặc tên sản phẩm trong database.

**Giải pháp:**
1. Kiểm tra SKU trong database: `npx prisma studio`
2. Đổi tên folder cho đúng với SKU
3. Hoặc dùng `MATCH_BY_NAME=true` để match theo tên

### Lỗi: "No images found in folder"

**Nguyên nhân:** Folder không có file ảnh hoặc format không hỗ trợ.

**Giải pháp:**
1. Kiểm tra file ảnh có đúng format: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.svg`
2. Đảm bảo file ảnh không bị corrupted

### Lỗi: "already has images"

**Nguyên nhân:** Sản phẩm đã có ảnh trong database.

**Giải pháp:**
```bash
# Ghi đè ảnh cũ
FORCE_UPDATE=true npx tsx scripts/import-product-images-from-folder.ts
```

---

## ✅ Checklist

Trước khi chạy script:
- [ ] Tạo folder `product-images/` ở thư mục gốc
- [ ] Tạo subfolders với tên SKU hoặc tên sản phẩm
- [ ] Đặt ảnh vào từng subfolder
- [ ] Kiểm tra SKU trong database (nếu dùng SKU matching)
- [ ] Backup database (optional but recommended)

Sau khi chạy script:
- [ ] Kiểm tra ảnh đã được copy vào `public/products/`
- [ ] Kiểm tra database đã được update
- [ ] Test hiển thị ảnh trên website
- [ ] Xóa folder `product-images/` nếu không cần nữa (optional)

---

## 📞 Hỗ trợ

Nếu bạn gặp vấn đề:
1. Kiểm tra logs trong console
2. Xem file `PRODUCT_IMAGES_IMPORT_GUIDE.md` này
3. Hoặc tôi có thể tạo script để list tất cả products với SKU để bạn dễ dàng tạo folder

