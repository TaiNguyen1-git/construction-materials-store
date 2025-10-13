# SmartBuild AI - Construction Materials Store

A comprehensive construction materials store management system built with Next.js 15, Prisma, and PostgreSQL.

## Features Implemented

### ✅ Real-time Stock Tracking with Notifications
- WebSocket-based real-time inventory updates
- Low stock alerts and notifications
- Notification center in admin panel
- Email/SMS notifications for critical stock levels

### ✅ Customer Loyalty Program
- Tiered loyalty system (Bronze, Silver, Gold, Platinum, Diamond)
- Points earning based on purchase amount with tier multipliers
- Point redemption for discounts
- Referral program with bonus points
- Birthday and anniversary rewards
- Loyalty dashboard for customers

### ✅ Enhanced Supplier Performance Dashboard
- Supplier performance metrics (on-time delivery, quality ratings)
- Spending trends and analytics
- Supplier comparison charts
- Detailed supplier performance reports
- Response time tracking

### ✅ Project Management Tool for Customers
- Customer project dashboard
- Project creation and management
- Task tracking with progress indicators
- Material requirements planning
- Budget and spending tracking
- Admin project management interface

### ✅ Advanced Analytics and Reporting
- Sales performance dashboards
- Inventory turnover analysis
- Customer behavior insights
- Financial reporting
- Custom report builder

### ✅ Mobile App Enhancements
- Native mobile application
- Offline functionality
- Push notifications
- Mobile-optimized UI/UX
- Barcode scanning for inventory

## Technical Architecture

### Frontend
- Next.js 15 with App Router
- React 19
- TypeScript
- Tailwind CSS
- Recharts for data visualization

### Backend
- Prisma ORM
- PostgreSQL database
- WebSocket server for real-time updates
- RESTful API endpoints

### Features Documentation
- [Loyalty Program](./LOYALTY_PROGRAM.md)
- [Project Management](./PROJECT_MANAGEMENT.md)
- [Analytics & Reporting](./ANALYTICS_REPORTING.md)
- [Mobile Enhancements](./MOBILE_ENHANCEMENTS.md)
- [Authentication Improvements](./AUTHENTICATION_IMPROVEMENTS.md)
- [AI Features](./AI_FEATURES.md)
- [Design System](./DESIGN_SYSTEM.md)
- [OCR Training Guide](./OCR_TRAINING_GUIDE.md)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

### Inventory
- `GET /api/inventory` - List inventory items
- `GET /api/inventory/[id]` - Get inventory item details
- `POST /api/inventory` - Create inventory item
- `PUT /api/inventory/[id]` - Update inventory item
- `DELETE /api/inventory/[id]` - Delete inventory item

### Products
- `GET /api/products` - List products
- `GET /api/products/[id]` - Get product details
- `POST /api/products` - Create product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Orders
- `GET /api/orders` - List orders
- `GET /api/orders/[id]` - Get order details
- `POST /api/orders` - Create order
- `PUT /api/orders/[id]` - Update order
- `DELETE /api/orders/[id]` - Delete order

### Customers
- `GET /api/customers` - List customers
- `GET /api/customers/[id]` - Get customer details
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

### Suppliers
- `GET /api/suppliers` - List suppliers with performance metrics
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/[id]` - Update supplier
- `DELETE /api/suppliers/[id]` - Delete supplier

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project details
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project
- `GET /api/projects/[id]/tasks` - List project tasks
- `POST /api/projects/[id]/tasks` - Create project task
- `PUT /api/projects/[id]/tasks/[taskId]` - Update project task
- `DELETE /api/projects/[id]/tasks/[taskId]` - Delete project task

### Loyalty
- `GET /api/loyalty` - Get customer loyalty data
- `POST /api/loyalty` - Process loyalty actions (redeem points, generate referral)

### Notifications
- `GET /api/notifications` - List user notifications
- `PUT /api/notifications/[id]/read` - Mark notification as read
- `DELETE /api/notifications/[id]` - Delete notification

### Analytics
- `GET /api/analytics` - Get analytics data

## Database Schema

The application uses Prisma ORM with a PostgreSQL database. The schema includes models for:
- Users and authentication
- Customers and loyalty program
- Employees and payroll
- Products and inventory
- Orders and order tracking
- Suppliers and purchase orders
- Invoices and payments
- Projects and tasks
- Notifications
- AI features and OCR processing

## Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis (for caching and sessions)
- Google Cloud or OpenAI API key (for AI features)

### Environment Variables
Create a `.env` file with the following variables:
```
DATABASE_URL=postgresql://user:password@localhost:5432/construction_materials_store
JWT_SECRET=your_jwt_secret_key
REDIS_URL=redis://localhost:6379
GOOGLE_AI_API_KEY=your_google_ai_api_key
OPENAI_API_KEY=your_openai_api_key
```

### Installation
```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## Development

### Project Structure
```
src/
├── app/                 # Next.js app router pages
│   ├── admin/          # Admin dashboard pages
│   ├── account/        # Customer account pages
│   ├── api/            # API routes
│   └── ...             # Other pages
├── components/         # React components
├── lib/                # Utility functions and services
├── contexts/           # React contexts
└── middleware.ts       # Next.js middleware
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For support or questions, please open an issue on GitHub.