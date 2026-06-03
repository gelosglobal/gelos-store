# Gelos Premium Dental Care - Store & Admin Dashboard

A modern, minimalist e-commerce platform for Gelos, a high-end dental care brand. Features a beautiful customer storefront and comprehensive admin dashboard for product, order, customer, and inventory management.

## 🎨 Design & Branding

- **Color Palette**: Minimalist aesthetic with soft creams, deep charcoals, and teal accents
- **Typography**: Serif fonts for headings, clean sans-serif for body text
- **Style**: Luxury minimal with excellent whitespace and smooth interactions
- **Responsive**: Mobile-first design that scales beautifully to desktop

## 📁 Project Structure

### Customer Storefront (`/app`)

```
app/
├── page.tsx              # Homepage with hero section, categories, featured products
├── shop/
│   └── page.tsx         # Product listing with filters and sorting
├── product/
│   └── [id]/page.tsx    # Product detail page with reviews, variants
├── cart/
│   └── page.tsx         # Shopping cart with summary
├── layout.tsx           # Root layout with navigation
└── globals.css          # Design tokens and global styles
```

**Features:**
- Hero section with CTAs
- Category browsing
- Product catalog with search & filters
- Product details with ratings and related products
- Shopping cart with order summary
- Responsive navigation with mobile menu
- Trust indicators (satisfaction, customer count, etc.)

### Admin Dashboard (`/app/admin`)

```
app/admin/
├── page.tsx             # Dashboard overview with KPIs and charts
├── layout.tsx           # Admin layout with sidebar navigation
├── products/page.tsx    # Product management (CRUD operations)
├── orders/page.tsx      # Order tracking and management
├── customers/page.tsx   # Customer database and insights
├── analytics/page.tsx   # Sales analytics and metrics
└── settings/page.tsx    # Store configuration
```

**Dashboard Features:**

1. **Overview Dashboard**
   - Revenue, orders, customers, products KPIs
   - Sales trend visualization
   - Top products by sales
   - Recent orders list
   - Conversion rate tracking

2. **Product Management**
   - Product listing with images
   - Search and filtering
   - Add/Edit/Delete products
   - Stock level visualization
   - Category management

3. **Order Management**
   - Order status tracking (Processing, Shipped, Delivered)
   - Order details modal
   - Customer information
   - Order history filtering

4. **Customer Management**
   - Customer database with contact info
   - Customer cards with lifetime value
   - Total spending and order count
   - Sorting by spending and order frequency
   - Customer join dates

5. **Analytics**
   - Revenue trend charts
   - Conversion funnel analysis
   - Top products by reviews
   - Customer segmentation
   - Traffic source attribution
   - Monthly performance metrics

6. **Settings**
   - Store information (name, email, currency)
   - Notification preferences
   - Payment method configuration
   - Appearance customization
   - Theme colors and branding

### Data & Utilities

```
lib/
└── mock-data.ts         # Mock products, orders, customers, analytics data
```

## 🎯 Product Catalog

Gelos offers premium dental care products:

1. **Fruity Mint Toothpaste** - $12.99
   - Natural whitening properties
   - Refreshing fruity mint flavor

2. **Stainless Steel Tongue Scraper** - $9.99
   - Professional-grade
   - Optimal oral hygiene

3. **V34 Shade Correction Kit** - $34.99
   - Advanced shade correction
   - Professional results

4. **Activated Charcoal Powder** - $14.99
   - Natural teeth whitening
   - Pure activated charcoal

5. **Aromatherapy Nasal Inhaler** - $8.99
   - Therapeutic essential oils
   - Wellness benefits

6. **Gold Tooth Tattoos (24-pack)** - $6.99
   - Metallic decoration
   - Fun dental accessory

7. **Premium Whitening Strips (30 pairs)** - $24.99
   - Professional-grade results
   - 14-day whitening system

8. **Bamboo Toothbrush Set (3-pack)** - $11.99
   - Eco-friendly materials
   - Soft bristles

## 🛠️ Technologies

- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: React hooks with mock data
- **Icons**: Lucide React
- **Typography**: Google Fonts (Geist family)

## 🚀 Key Features

### Storefront
- Fully responsive design
- Product search and filtering
- Category browsing
- Detailed product pages with ratings
- Shopping cart functionality
- Trust signals and testimonials
- Fast page load with optimized images

### Admin Dashboard
- Collapsible sidebar navigation
- Real-time KPI cards
- Interactive charts and visualizations
- Modal dialogs for actions
- Data tables with sorting
- Search and filtering
- Status indicators with color coding
- Customer insights and segmentation

## 🎨 Design System

### Colors
- **Primary**: Teal/Blue (#0891b2) - Main brand color
- **Secondary**: Dark charcoal (#1f2937) - Text and emphasis
- **Accent**: Warm gold/orange (#d97706) - Highlights and CTAs
- **Background**: Off-white/cream (#f9fafb)
- **Borders**: Light gray (#e5e7eb)

### Typography
- **Display**: Serif font (font-serif class)
- **Body**: Sans-serif (font-sans class)
- **Mono**: Monospace (font-mono class)

### Spacing
- Uses Tailwind's default spacing scale (4px baseline)
- Consistent padding and margins throughout
- Generous whitespace for luxury feel

## 📱 Responsive Design

- **Mobile**: Optimized touch targets, collapsible menus
- **Tablet**: Two-column layouts, optimized grids
- **Desktop**: Full sidebar, three+ column layouts
- **Max-width**: 7xl container (80rem) for comfortable reading

## 🔮 Next Steps (Backend Integration)

When ready to add backend functionality:

1. **Database**: Connect to Supabase or Neon PostgreSQL
   - Products table
   - Orders table
   - Customers table
   - Inventory tracking

2. **Authentication**: Implement user auth
   - Admin login
   - Customer accounts
   - Session management

3. **Payments**: Integrate payment processor
   - Stripe checkout
   - Order processing
   - Payment confirmation

4. **Real-time Features**
   - Live order updates
   - Stock synchronization
   - Inventory alerts

5. **Admin Features**
   - Dynamic product CRUD
   - Order status updates
   - Customer communications
   - Analytics calculations

## 📖 How to Use

1. **View Storefront**: Navigate to `/` for the homepage
2. **Browse Products**: Visit `/shop` to see all products with filters
3. **View Product**: Click any product to see details at `/product/[id]`
4. **Shopping Cart**: Add items to cart, view at `/cart`
5. **Admin Dashboard**: Access at `/admin` to see overview
6. **Manage Products**: Go to `/admin/products` for product management
7. **View Orders**: Check `/admin/orders` for order tracking
8. **Customer Data**: Visit `/admin/customers` for customer insights
9. **Analytics**: View `/admin/analytics` for sales performance
10. **Settings**: Configure store at `/admin/settings`

## 🎯 Features Checklist

### Storefront ✓
- [x] Homepage with hero section
- [x] Product listing page with filters
- [x] Product detail page
- [x] Shopping cart
- [x] Category navigation
- [x] Search functionality
- [x] Responsive design
- [x] Product ratings and reviews display

### Admin Dashboard ✓
- [x] Overview with KPIs
- [x] Product management (CRUD)
- [x] Order management
- [x] Customer management
- [x] Analytics and reporting
- [x] Settings page
- [x] Sidebar navigation
- [x] Responsive admin layout

### Design ✓
- [x] Minimalist aesthetic
- [x] Consistent color scheme
- [x] Beautiful typography
- [x] Smooth interactions
- [x] Mobile-first approach
- [x] Accessibility (ARIA labels, semantic HTML)

---

**Gelos** - Premium Dental Care for the Modern Smile
