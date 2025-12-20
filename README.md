# 🏗️ SmartBuild AI - Construction Materials Store

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/MongoDB-green?style=for-the-badge&logo=mongodb" />
  <img src="https://img.shields.io/badge/Prisma-ORM-blue?style=for-the-badge&logo=prisma" />
</p>

A comprehensive **AI-powered construction materials e-commerce platform** with inventory management, employee management, and intelligent chatbot assistance. Built for SMEs in Vietnam's construction materials industry.

---

## ✨ Key Features

### 🛒 E-Commerce Platform
- Product catalog with categories, filters, and search
- Shopping cart with persistent storage
- Guest checkout support
- Order tracking and history
- Product reviews and ratings
- Wishlist management

### 🤖 AI & Machine Learning
| Feature | Description |
|---------|-------------|
| **RAG Chatbot** | Intelligent assistant with product knowledge using Gemini AI |
| **Demand Forecasting** | ML-based inventory predictions |
| **Smart Recommendations** | Collaborative filtering + content-based |
| **OCR Processing** | Invoice and receipt scanning |
| **Material Calculator** | AI-powered construction material estimator |

### 📊 Admin Dashboard
- Real-time KPI dashboards with charts
- Sales analytics and trends
- Employee task management
- Inventory alerts and forecasting
- Supplier performance tracking

### 👥 HR & Payroll
- Employee work shift management
- Attendance tracking
- Payroll calculation with bonuses/penalties
- Salary advance requests
- Task assignment and performance tracking

### 💳 Payment Integration
- Bank transfer (QR Code - VietQR)
- Cash on delivery (COD)
- Deposit payment options (30%, 40%, 50%)

### 🔔 Notifications
- Email notifications (order confirmations, shipping updates)
- Firebase push notifications
- In-app notification center
- Stock alert emails

### 📱 Mobile Ready
- Responsive design
- PWA support
- Offline capability

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB database (Atlas recommended)
- Google AI API key (for Gemini)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/construction-materials-store.git
cd construction-materials-store

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run development server
npm run dev
```

### Environment Variables

Create a `.env` file with the following:

```env
# Database
DATABASE_URL="mongodb+srv://..."

# Authentication
JWT_SECRET="your-super-secret-key"
NEXTAUTH_SECRET="your-nextauth-secret"

# Google AI (Gemini)
GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-key"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="app-password"

# Firebase (Optional - for push notifications)
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."

# Sentry (Optional - for error tracking)
NEXT_PUBLIC_SENTRY_DSN="..."

# Base URL
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard pages
│   ├── account/           # Customer account pages
│   ├── api/               # API routes (53 modules)
│   ├── products/          # Product pages
│   └── ...
├── components/            # React components (36 files)
├── lib/                   # Services & utilities (54 files)
│   ├── ai-service.ts      # Gemini AI integration
│   ├── rag-service.ts     # RAG chatbot service
│   ├── email-service.ts   # Email notifications
│   └── ...
├── stores/                # Zustand state management
├── contexts/              # React contexts
└── middleware.ts          # Auth & routing middleware
```

---

## 🔌 API Overview

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |

### Products & Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products |
| GET | `/api/products/[id]` | Product details |
| GET | `/api/inventory` | Inventory items |
| POST | `/api/inventory/movements` | Record stock movement |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List orders |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/[id]` | Order details |
| PUT | `/api/orders/[id]/confirm` | Confirm order (admin) |

### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chatbot` | AI chatbot conversation |
| POST | `/api/ocr` | Process OCR image |
| GET | `/api/predictions/inventory` | Demand forecasting |
| GET | `/api/recommendations/cart` | Cart recommendations |

> 📖 Full API documentation: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## 🛠️ Development Scripts

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Production build
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed sample data

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# AI Tools
npm run test:gemini      # Test Gemini connection
npm run test:rag         # Test RAG service
npm run check:ai         # Check AI setup
```

---

## 🔐 Security Features

- **JWT Authentication** with role-based access control
- **Security Headers** (HSTS, X-Frame-Options, CSP)
- **Rate Limiting** for API endpoints
- **Input Sanitization** and validation
- **CSRF Protection**
- **Sentry Error Tracking** (optional)

---

## 🌐 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy!

```bash
# Manual deployment
vercel --prod
```

### Docker

```bash
docker build -t smartbuild-ai .
docker run -p 3000:3000 smartbuild-ai
```

---

## 📊 Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, Prisma ORM |
| Database | MongoDB |
| AI/ML | Google Gemini, RAG, Vector Search |
| Email | Nodemailer |
| Notifications | Firebase Cloud Messaging |
| Charts | Recharts |
| State | Zustand |
| Validation | Zod |
| Testing | Vitest |

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 📞 Support

- 📧 Email: support@smartbuild.vn
- 📖 Documentation: [docs.smartbuild.vn](https://docs.smartbuild.vn)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/construction-materials-store/issues)

---

<p align="center">Made with ❤️ for Vietnam's construction industry</p>