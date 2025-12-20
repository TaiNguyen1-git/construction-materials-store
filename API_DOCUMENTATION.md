# 📖 SmartBuild AI - API Documentation

## Overview

SmartBuild AI provides a RESTful API for the construction materials e-commerce platform. All endpoints return JSON responses.

**Base URL:**
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.vercel.app/api`

---

## Authentication

### JWT Token-Based Authentication

Most protected endpoints require a JWT token in the `Authorization` header:

```http
Authorization: Bearer <your-jwt-token>
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "CUSTOMER"
    }
  }
}
```

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "User Name",
  "password": "secure-password",
  "phone": "0901234567"
}
```

### User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| `CUSTOMER` | Regular customer | Public + own orders/profile |
| `EMPLOYEE` | Store employee | Admin dashboard (limited) |
| `MANAGER` | Store manager | Full admin access |

---

## Products

### List Products

```http
GET /api/products
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10) |
| `category` | string | Filter by category ID |
| `search` | string | Search by name/description |
| `minPrice` | number | Minimum price filter |
| `maxPrice` | number | Maximum price filter |
| `sort` | string | Sort field (price, name, createdAt) |
| `order` | string | Sort order (asc, desc) |

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### Get Product Details

```http
GET /api/products/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "product-id",
    "name": "Xi Măng PCB40",
    "description": "...",
    "price": 120000,
    "unit": "bao",
    "images": ["url1", "url2"],
    "category": {...},
    "inventoryItem": {
      "quantity": 500,
      "availableQuantity": 450
    }
  }
}
```

---

## Orders

### Create Order

```http
POST /api/orders
Content-Type: application/json

{
  "items": [
    {
      "productId": "product-id",
      "quantity": 10
    }
  ],
  "guestName": "Nguyễn Văn A",
  "guestEmail": "email@example.com",
  "guestPhone": "0901234567",
  "shippingAddress": {
    "address": "123 Đường ABC",
    "ward": "Phường 1",
    "district": "Quận 1",
    "city": "TP. Hồ Chí Minh"
  },
  "paymentMethod": "COD",
  "notes": "Giao buổi sáng"
}
```

**Payment Methods:**
- `COD` - Cash on delivery
- `BANK_TRANSFER` - Bank transfer
- `QR_CODE` - QR code payment

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-id",
    "orderNumber": "ORD-20241220-001",
    "status": "PENDING_CONFIRMATION",
    "totalAmount": 1200000,
    "netAmount": 1250000
  }
}
```

### Order Statuses

| Status | Description |
|--------|-------------|
| `PENDING_CONFIRMATION` | Waiting for admin confirmation |
| `CONFIRMED_AWAITING_DEPOSIT` | Confirmed, waiting for deposit |
| `DEPOSIT_PAID` | Deposit received |
| `CONFIRMED` | Order confirmed |
| `PROCESSING` | Being prepared |
| `SHIPPED` | Out for delivery |
| `DELIVERED` | Delivered |
| `CANCELLED` | Cancelled |

---

## Inventory (Admin)

### List Inventory

```http
GET /api/inventory
Authorization: Bearer <token>
```

### Record Stock Movement

```http
POST /api/inventory/movements
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "product-id",
  "movementType": "IN",
  "quantity": 100,
  "reason": "Nhập hàng từ NCC",
  "notes": "PO-123"
}
```

**Movement Types:**
- `IN` - Stock in
- `OUT` - Stock out
- `ADJUSTMENT` - Adjustment
- `DAMAGE` - Damaged stock
- `RETURN` - Customer return

---

## AI Features

### Chatbot

```http
POST /api/chatbot
Content-Type: application/json

{
  "message": "Tôi cần xi măng xây tường",
  "conversationHistory": [
    {"role": "user", "content": "Xin chào"},
    {"role": "assistant", "content": "Chào bạn!"}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Để xây tường, bạn cần xi măng PCB40...",
    "suggestions": ["Xem giá xi măng", "Tính vật liệu"],
    "productRecommendations": [...]
  }
}
```

### Material Calculator

```http
POST /api/material-calculator
Content-Type: application/json

{
  "projectType": "wall",
  "area": 50,
  "thickness": 0.2
}
```

### OCR Processing

```http
POST /api/ocr
Content-Type: multipart/form-data

file: <image-file>
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Access token required"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limiting

API endpoints are rate limited:

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| General API | 100 requests | 1 minute |
| OCR Processing | 10 requests | 1 hour |
| Chatbot | 30 requests | 1 minute |

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1703065200
```

---

## Webhooks (Future)

| Event | Description |
|-------|-------------|
| `order.created` | New order placed |
| `order.confirmed` | Order confirmed by admin |
| `order.shipped` | Order shipped |
| `inventory.low_stock` | Stock below threshold |

---

## SDKs & Libraries

Coming soon:
- JavaScript/TypeScript SDK
- React hooks library

---

## Support

- Issues: GitHub Issues
- Email: api-support@smartbuild.vn
