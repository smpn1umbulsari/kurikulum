# Deployment Guide: Guru Spenturi v2

## Prerequisites

1. **Node.js 18+**
2. **Supabase CLI** or Supabase Cloud account
3. **Vercel Account** (recommended) or any Next.js hosting

---

## Environment Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd Aplikasi-Master
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 3. Database Setup

```bash
# Push schema to Supabase
npx supabase db push

# Or run migrations manually
psql -h db.your-project.supabase.co -U postgres -f database/schema.sql
```

---

## Deployment

### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set environment variables in Vercel dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

### Option B: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Database Migrations

### Run Migrations

```bash
# Apply all migrations
supabase db push

# Or via SQL
psql $DATABASE_URL -f database/schema.sql
```

### Supabase SQL Editor

Run these in Supabase SQL Editor:

```sql
-- Enable RLS on all tables
-- (See database/schema.sql for full schema)

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

---

## Android APK Build

### 1. Build Web App

```bash
CAPACITOR_BUILD=true npm run build
```

### 2. Add Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Guru Spenturi" "com.guruspenturi.app" --web-dir=out
npx cap add android
```

### 3. Sync & Build

```bash
npx cap sync android
npx cap open android
```

In Android Studio:

1. Open project
2. Build > Generate Signed Bundle / APK
3. Choose "APK" > Next
4. Create/select keystore
5. Build release APK

---

## Post-Deployment Checklist

### Security

- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Configure Supabase Auth settings
- [ ] Setup API rate limiting
- [ ] Enable audit logging
- [ ] Test all authentication flows

### Monitoring

- [ ] Setup Sentry error tracking
- [ ] Configure uptime monitoring
- [ ] Setup logging aggregation

### Backup

- [ ] Configure automatic backups (pg_cron)
- [ ] Test backup/restore procedure
- [ ] Store backups in secure location

### Performance

- [ ] Enable Supabase connection pooling
- [ ] Add database indexes
- [ ] Configure CDN for static assets
- [ ] Enable image optimization

---

## Rollback Procedure

If deployment fails:

1. Revert to previous version in Vercel dashboard
2. Restore database from backup if needed
3. Check Supabase logs for errors

---

## Support

For issues, check:

- Vercel deployment logs
- Supabase project logs
- Browser console errors
- Network tab for API failures
