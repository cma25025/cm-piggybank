# CM Piggybank — Setup Guide

## 1. Create GitHub Repo

```bash
cd cm-piggybank
git init
git add .
git commit -m "Initial scaffold: Next.js + Supabase + Vercel"
gh repo create cma25025/cm-piggybank --public --source=. --push
```

## 2. Create Supabase Project

1. Go to https://supabase.com/dashboard → "New Project"
2. Name it `cm-piggybank`, pick a region, set a DB password
3. Once created, go to **Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

## 3. Run the Database Migration

In the Supabase dashboard:
1. Go to **SQL Editor**
2. Paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Click **Run**

## 4. Configure Supabase Auth

In the Supabase dashboard → **Authentication → URL Configuration**:
- Site URL: `http://localhost:3000` (change to production URL later)
- Redirect URLs: add `http://localhost:3000/auth/callback`

## 5. Deploy to Vercel

1. Go to https://vercel.com/new
2. Import your `cma25025/cm-piggybank` GitHub repo
3. Framework will auto-detect as Next.js
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Deploy

## 6. Update Supabase Auth for Production

Once Vercel gives you a URL (e.g., `https://cm-piggybank.vercel.app`):
1. Go back to Supabase → **Authentication → URL Configuration**
2. Update Site URL to your Vercel URL
3. Add `https://cm-piggybank.vercel.app/auth/callback` to Redirect URLs

## 7. Local Development

```bash
cp .env.local.example .env.local
# Fill in your Supabase keys
npm install
npm run dev
```

Open http://localhost:3000

## Project Structure

```
src/
├── app/
│   ├── auth/callback/route.ts   ← OAuth/email confirmation handler
│   ├── dashboard/page.tsx       ← Protected page (shows piggybanks)
│   ├── login/page.tsx           ← Sign in / sign up
│   ├── page.tsx                 ← Landing page
│   ├── globals.css
│   └── layout.tsx
├── components/
│   └── SignOutButton.tsx
├── lib/supabase/
│   ├── client.ts                ← Browser-side Supabase client
│   └── server.ts                ← Server-side Supabase client
├── middleware.ts                ← Session refresh + route protection
supabase/
└── migrations/
    └── 001_initial_schema.sql   ← DB schema with RLS policies
```
