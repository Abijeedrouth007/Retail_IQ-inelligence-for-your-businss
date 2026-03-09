# RetailIQ - Product Requirements Document

## Original Problem Statement
Build RetailIQ - an AI-powered retail management and analytics SaaS platform for small shop owners and customers.

## Tech Stack
- **Frontend**: React 18, Tailwind CSS, shadcn/ui, Framer Motion, Recharts
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT + Emergent Google OAuth
- **AI Integration**: Gemini 3 Flash via Emergent Integrations

## User Personas
1. **Admin (Shop Owner)**: Manages inventory, views analytics, tracks sales, manages customers and suppliers
2. **Customer**: Browses products, manages cart/wishlist, places orders, views order history

## Core Requirements (Static)
- Role-based access control (admin/customer)
- Product inventory management with stock tracking
- Customer order management
- Analytics dashboard with revenue/sales charts
- AI chatbot for retail insights
- Google Maps integration (placeholder)

## What's Been Implemented (MVP - Jan 2026)

### Backend
- User authentication (signup, login, Google OAuth)
- JWT token-based session management
- Products CRUD API
- Orders API with stock management
- Suppliers CRUD API
- Cart and Wishlist APIs
- Analytics endpoints (dashboard stats, sales trends, top products)
- AI Chat endpoint with Gemini 3 Flash

### Frontend
- Landing page with cinematic hero section
- Auth page (login/signup/Google OAuth)
- Admin Dashboard with KPIs and charts
- Analytics page with revenue insights
- Inventory management with add/edit/delete
- Customer management page
- Sales page with CSV export
- Suppliers management
- Customer store with product grid
- Shopping cart page
- Order history with reorder
- Wishlist page
- AI Chatbot (floating widget)
- Responsive sidebar navigation

### Database Collections
- users, user_sessions, user_roles
- products, orders, suppliers
- cart_items, wishlist
- chat_messages

## Prioritized Backlog

### P0 (Critical - Immediate)
- None (MVP complete)

### P1 (High Priority)
- Email notifications for orders
- Product search autocomplete
- Order status updates (pending, shipped, delivered)
- Payment integration (Stripe)

### P2 (Medium Priority)
- Multi-store support
- Product variants (sizes, colors)
- Customer reviews/ratings
- Discount/coupon system
- Export reports to PDF

### P3 (Nice to Have)
- Real-time inventory sync
- Supplier order management
- Advanced AI demand forecasting
- Mobile app (React Native)

## Demo Credentials
- **Admin**: admin@retailiq.com / admin123
- **Google OAuth**: Available via "Continue with Google"

## API Endpoints
- POST /api/auth/signup, login, google-session, logout
- GET /api/auth/me
- GET/POST/PUT/DELETE /api/products
- GET/POST /api/orders
- GET/POST/PUT/DELETE /api/suppliers
- GET/POST/PUT/DELETE /api/cart
- GET/POST/DELETE /api/wishlist
- GET /api/analytics/dashboard, sales-trend, top-products, customers
- POST /api/chat

## Next Tasks
1. Add payment processing with Stripe
2. Implement email notifications
3. Add order status workflow
4. Create admin settings page
5. Add product bulk import/export
