# OrbitDine - Supabase Production Setup

## What Was Done

### Database (Supabase Project: OrbitDine - ilcajwggnghfjuezsidk)
All tables created with Row Level Security:
- `profiles` - Links to auth.users, stores role (owner/manager)
- `restaurants` - Restaurant settings (theme, is_operational)
- `tables` - Floor tables with QR code URLs
- `menu_categories` & `menu_items` - Full menu management
- `orders` & `order_items` - Live order tracking
- `feedback` - Customer feedback (1-3 star monitor)
- `manager_permissions` - Granular access control

### Auth
- Supabase Email/Password auth (replaces mock login)
- Auto-profile creation on signup via database trigger
- Role-based routing (owner vs manager)
- Demo restaurant auto-assigned on signup

### Files Updated
Replace these files in your project:

| File | Description |
|------|-------------|
| `src/lib/supabase.ts` | Supabase client |
| `src/lib/database.types.ts` | TypeScript types |
| `src/store/AuthContext.tsx` | Real auth with Supabase |
| `src/App.tsx` | Loading state + profile-based routing |
| `src/pages/Login.tsx` | Real login + signup form |
| `src/layouts/ManagerLayout.tsx` | Uses real profile data |
| `src/layouts/OwnerLayout.tsx` | Uses real profile data |
| `src/pages/manager/ManagerDashboard.tsx` | Real-time table/order data |
| `src/pages/owner/MenuManagement.tsx` | Full CRUD menu management |
| `src/pages/owner/TableConfig.tsx` | Real table CRUD + QR codes |
| `src/pages/owner/Feedback.tsx` | Real feedback from DB |
| `src/pages/owner/ManagerPermissions.tsx` | Real permission editing |
| `src/pages/owner/Settings.tsx` | Saves theme + operational status |
| `vite.config.ts` | Updated env var handling |

## Environment Variables
Add to your `.env.local`:
```
VITE_SUPABASE_URL=https://ilcajwggnghfjuezsidk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsY2Fqd2dnbmdoZmp1ZXpzaWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzM1NjMsImV4cCI6MjA4NzYwOTU2M30.s73b5_i-H6RR68xZ6SXSwmD3T-7QYgtGbgK66YNIrMc
```

## How to Test
1. Sign up with role = **owner** → gets full owner portal
2. Sign up with role = **manager** → gets floor map portal
3. Owner can edit manager permissions from the Managers page

## Production Checklist
- [ ] Enable Email confirmations in Supabase Auth settings
- [ ] Set up custom SMTP in Supabase for production emails
- [ ] Add your production domain to Supabase Auth redirect URLs
- [ ] Review RLS policies in Supabase dashboard
- [ ] Set up Supabase Realtime for live order updates (already wired in code)
