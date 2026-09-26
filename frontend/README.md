# Adire Teems - Next.js Frontend

A modern, responsive e-commerce frontend for Adire Teems built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui.

## Project Overview

This is the customer-facing storefront and admin dashboard foundation for the Adire Teems e-commerce platform. It features:

- **Modern Storefront**: Homepage with hero section, featured collections, and category showcase
- **Product Catalogue**: Browsable shop with filtering, sorting, and multiple view modes (grid/list)
- **Product Details**: Individual product pages with image gallery, variant selection, and related products
- **Responsive Design**: Mobile-first design optimized for all screen sizes
- **Brand Theming**: Custom Tailwind configuration with Adire brand colors (primary: #0D0D0D, accent: #D4AF37)
- **Component Library**: Pre-built shadcn/ui components for consistent UI

## Tech Stack

- **Framework**: Next.js 16.3+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **State Management**: Zustand (prepared)
- **Database Client**: @supabase/ssr, @supabase/supabase-js
- **Icons**: Lucide React
- **UI Components**: shadcn/ui

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout with header/footer
│   ├── page.tsx                # Homepage
│   ├── shop/
│   │   └── page.tsx            # Shop/catalogue page
│   └── product/
│       └── [slug]/
│           └── page.tsx        # Product detail page
├── components/
│   ├── header.tsx              # Navigation header
│   ├── footer.tsx              # Footer
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   ├── server.ts           # Server Supabase client
│   │   └── admin.ts            # Admin service role client
│   ├── types.ts                # TypeScript types
│   └── utils.ts                # Utility functions
├── .env.local                  # Environment variables (local)
├── tailwind.config.js          # Tailwind configuration
├── next.config.ts              # Next.js configuration
└── tsconfig.json               # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase project (for backend integration)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create or update `.env.local` with your configuration:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   AI_SERVICE_URL=http://localhost:8000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Pages

### Public Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with hero, featured collections, and categories |
| `/shop` | Product catalogue with filters, sorting, and view modes |
| `/product/[slug]` | Product detail page with images, variants, and related items |

### Placeholder Pages (to implement)

| Route | Description |
|-------|-------------|
| `/about` | About page |
| `/blog` | Blog listing |
| `/contact` | Contact page |
| `/faq` | FAQ page |

### Future Pages

| Route | Description |
|-------|-------------|
| `/cart` | Shopping cart |
| `/checkout` | Payment checkout |
| `/order/[id]` | Order confirmation |
| `/dashboard` | User dashboard |
| `/admin` | Admin panel |

## Components

### Layout Components

- **Header**: Navigation bar with logo, menu, search, and cart icon
- **Footer**: Company info, links, and contact details

### UI Components

Using shadcn/ui with pre-configured Button and other components. Add more with:
```bash
npx shadcn@latest add [component-name]
```

## Styling

### Brand Colors

Configured in `app/globals.css` using Tailwind CSS 4 inline themes:

```css
--primary: #0D0D0D    (Dark navy/black)
--secondary: #F5F5F5  (Light gray)
--accent: #D4AF37     (Gold)
--foreground: white
--background: light/dark variants
```

### Fonts

- **Heading**: Fraunces (serif) - used for titles
- **Body**: Inter (sans-serif) - used for text

Loaded from Google Fonts in `app/globals.css`.

## Key Features

### Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly navigation and buttons

### Homepage Features

- Full-width hero section with CTA
- Featured collections showcase (3 cards)
- Category cards with image galleries
- Call-to-action section

### Shop Features

- **Filtering**: By category and price range
- **Sorting**: Featured, price (low-high, high-low), newest
- **View Modes**: Grid (default) or list view
- **Product Cards**: Shows name, price, stock status
- **Responsive Grid**: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)

### Product Detail Features

- **Image Gallery**: Multiple images with thumbnail selection
- **Variant Selection**: Size and color options
- **Stock Display**: Real-time availability
- **Quantity Selector**: Add-to-cart quantity
- **Related Products**: Similar items
- **Product Info**: Description, specifications, care instructions
- **Benefits Section**: Shipping, returns, quality guarantee
- **Reviews**: Rating and review count display

## Environment Variables

Create `.env.local` in the root directory (never commit to git):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Service
AI_SERVICE_URL=http://localhost:8000

# Paystack (server-side; webhook signatures use this same secret)
PAYSTACK_SECRET_KEY=your-paystack-secret-key
# Other payment gateways (future)
FLUTTERWAVE_SECRET_KEY=your-flutterwave-secret-key
FLUTTERWAVE_WEBHOOK_SECRET=your-flutterwave-webhook-secret

# Email Service (future)
RESEND_API_KEY=your-resend-api-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**: 
- `NEXT_PUBLIC_*` variables are exposed to the browser (use only non-sensitive data)
- Service keys must be server-side only
- Add `.env.local` to `.gitignore`

## Deployment

### To Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

```bash
# One-time setup
vercel link

# Deploy
vercel deploy
```

### Local Build & Test

```bash
npm run build
npm start
```

Visit http://localhost:3000

## Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally: `npm run dev`
3. Run lint: `npm run lint`
4. Build and test: `npm run build`
5. Commit and push
6. Create pull request

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Next.js Image optimization
- Code splitting and lazy loading
- Tailwind CSS purging
- Optimized fonts with `next/font`
- Responsive images for mobile

## Accessibility

- Semantic HTML
- ARIA labels on interactive elements
- Keyboard navigation
- Color contrast compliance (WCAG AA)
- Focus indicators

## Next Steps (Phase 2)

The following will be implemented in Phase 2:

1. Supabase database integration
   - Connect product queries to actual database
   - Replace mock data with real data

2. User authentication
   - Sign up / Login page
   - User dashboard
   - Order history

3. Shopping cart
   - Zustand state management
   - LocalStorage persistence
   - Cart page

4. Checkout flow
   - Shipping address form
   - Additional payment gateways (Paystack is implemented; see ../docs/paystack-setup.md)
   - Order confirmation

5. Admin dashboard
   - Product management
   - Order management
   - Inventory tracking

## Troubleshooting

### Port 3000 in use
```bash
npm run dev -- -p 3001
```

### Clear cache and reinstall
```bash
rm -rf node_modules .next package-lock.json
npm install
npm run dev
```

### Build errors
```bash
npm run lint
npm run build
```

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Supabase Docs](https://supabase.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)

## License

Proprietary to Adire Teems - All rights reserved

## Support

Email: support@adrieteems.com  
Phone: +234 123 456 789

---

**Status**: Phase 1 Complete ✅  
**Next**: Phase 2 - Database & Authentication  
**Last Updated**: August 2026
