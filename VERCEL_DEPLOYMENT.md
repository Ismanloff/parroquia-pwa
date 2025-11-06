# 🚀 Vercel Deployment Guide

## Prerequisites

- ✅ All manual tests passed ([MANUAL_TESTING_CHECKLIST.md](MANUAL_TESTING_CHECKLIST.md))
- ✅ Server runs locally without errors
- ✅ Environment variables documented
- ✅ Git repository clean (no sensitive data)

---

## Step 1: Prepare for Deployment

### 1.1 Verify Build

```bash
cd "/Users/admin/Movies/Proyecto SaaS/resply"

# Clean build
rm -rf .next

# Test production build
npm run build
```

**Expected output:**
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

**If errors:**
- Fix TypeScript errors: `npm run type-check`
- Fix ESLint errors: `npm run lint`
- Review error logs

---

### 1.2 Check Environment Variables

Verify `.env.example` has all required variables:

```bash
cat .env.example
```

**Required variables:**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Pinecone
PINECONE_API_KEY=
PINECONE_INDEX_NAME=saas

# Voyage AI
VOYAGE_API_KEY=

# Resend (Email)
RESEND_API_KEY=
FROM_EMAIL=noreply@resply.com

# Sentry (Optional)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=

# Slack (Optional)
SLACK_WEBHOOK_URL=

# UptimeRobot (Optional)
UPTIME_ROBOT_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

---

### 1.3 Git Commit (if needed)

```bash
# Check status
git status

# Add all changes
git add .

# Commit
git commit -m "feat: Sprint 1 & 2 complete - Monitoring & Load Testing ready"

# Push to main
git push origin main
```

---

## Step 2: Vercel Setup

### 2.1 Install Vercel CLI (if not installed)

```bash
npm install -g vercel
```

### 2.2 Login to Vercel

```bash
vercel login
```

Follow prompts to authenticate.

---

## Step 3: Deploy to Vercel

### 3.1 Initial Deployment

```bash
cd "/Users/admin/Movies/Proyecto SaaS/resply"

# Deploy to preview
vercel
```

**Prompts:**
- Set up and deploy? → **Yes**
- Which scope? → Select your account
- Link to existing project? → **No** (first time) or **Yes** (if exists)
- Project name? → `resply` (or your preferred name)
- Directory? → `./` (current directory)
- Override settings? → **No**

Wait for deployment... (~2-3 minutes)

**Output:**
```
✓ Deployment ready
https://resply-abc123.vercel.app
```

---

### 3.2 Configure Environment Variables

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to: https://vercel.com/dashboard
2. Select your project: `resply`
3. Go to: Settings → Environment Variables
4. Add each variable from `.env.local`:

**Required variables to add:**

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Production, Preview, Development |
| `OPENAI_API_KEY` | Your OpenAI key | Production, Preview, Development |
| `PINECONE_API_KEY` | Your Pinecone key | Production, Preview, Development |
| `PINECONE_INDEX_NAME` | `saas` | Production, Preview, Development |
| `VOYAGE_API_KEY` | Your Voyage key | Production, Preview, Development |
| `RESEND_API_KEY` | Your Resend key | Production, Preview, Development |
| `FROM_EMAIL` | `noreply@resply.com` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` | Production |

**Optional (for monitoring):**

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Your Sentry DSN | Production, Preview |
| `SENTRY_DSN` | Your Sentry DSN | Production, Preview |
| `SENTRY_ORG` | Your Sentry org | Production |
| `SENTRY_PROJECT` | Your Sentry project | Production |
| `SENTRY_AUTH_TOKEN` | Your Sentry token | Production |
| `SLACK_WEBHOOK_URL` | Your Slack webhook | Production |

---

**Option B: Via CLI**

```bash
# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste value when prompted
# Select: Production

# Repeat for each variable
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENAI_API_KEY
# ... etc
```

---

### 3.3 Redeploy with Environment Variables

After adding all env variables:

```bash
# Trigger new deployment
vercel --prod
```

Wait for production deployment...

**Output:**
```
✓ Production deployment ready
https://resply.vercel.app
```

---

## Step 4: Verify Deployment

### 4.1 Test Health Endpoint

```bash
curl https://your-domain.vercel.app/api/health
```

**Expected:**
```json
{
  "status": "healthy",
  "services": {
    "database": {
      "status": "healthy"
    }
  }
}
```

---

### 4.2 Visual Tests

Open in browser:

1. **Home:** https://your-domain.vercel.app
   - [ ] Loads without errors

2. **Health Check:** https://your-domain.vercel.app/api/health
   - [ ] Returns healthy status

3. **Dashboard:** https://your-domain.vercel.app/dashboard
   - [ ] Redirects to login (if not authenticated)

4. **Login:** https://your-domain.vercel.app/login
   - [ ] Login form works

---

### 4.3 Check Vercel Logs

```bash
# View deployment logs
vercel logs

# Or in dashboard:
# https://vercel.com/your-project/deployments
```

**Look for:**
- [ ] No 500 errors
- [ ] No missing env variables
- [ ] API routes work
- [ ] Build completed successfully

---

## Step 5: Post-Deployment Configuration

### 5.1 Configure Custom Domain (Optional)

1. Go to: Project Settings → Domains
2. Add your domain: `resply.com`
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` env variable

---

### 5.2 Setup Sentry (if configured)

1. Go to: https://sentry.io
2. Create project: "resply"
3. Get DSN
4. Add to Vercel env variables (see Step 3.2)
5. Redeploy: `vercel --prod`

**Test Sentry:**
```bash
curl https://your-domain.vercel.app/api/test-sentry?type=error
```

Check Sentry dashboard for captured error.

---

### 5.3 Setup UptimeRobot

1. Go to: https://uptimerobot.com
2. Create monitor:
   - Type: HTTP(s)
   - URL: `https://your-domain.vercel.app/api/health`
   - Interval: 5 minutes
   - Keyword: `healthy`

3. Add alert contacts (Email + Slack)

---

### 5.4 Setup Slack Alerts

1. Go to your Slack workspace
2. Add Incoming Webhook
3. Copy webhook URL
4. Add to Vercel env variables as `SLACK_WEBHOOK_URL`
5. Redeploy: `vercel --prod`

**Test Slack:**
```bash
curl "https://your-domain.vercel.app/api/alerts/test-slack?type=test"
```

Check Slack for test message.

---

## Step 6: Performance Optimization

### 6.1 Enable Edge Caching

In `next.config.ts`, add:

```typescript
const nextConfig = {
  // ... existing config
  headers: async () => [
    {
      source: '/api/health',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, s-maxage=60, stale-while-revalidate=120',
        },
      ],
    },
  ],
};
```

---

### 6.2 Configure ISR (Incremental Static Regeneration)

For static pages, add revalidation:

```typescript
// app/page.tsx
export const revalidate = 3600; // 1 hour
```

---

### 6.3 Enable Vercel Analytics

1. Go to: Project Settings → Analytics
2. Enable Web Analytics
3. Redeploy

---

## Step 7: Monitoring Setup

### 7.1 Vercel Dashboard

Monitor:
- **Functions:** View function invocations, errors, duration
- **Logs:** Real-time logs, filter by severity
- **Analytics:** Page views, performance metrics

URL: https://vercel.com/your-project

---

### 7.2 Sentry Dashboard

Monitor:
- **Issues:** Errors with stack traces
- **Performance:** Transaction traces
- **Releases:** Track deployments

URL: https://sentry.io

---

### 7.3 UptimeRobot Dashboard

Monitor:
- **Uptime:** 99.9% SLA
- **Response Time:** < 2s average
- **Incidents:** Downtime alerts

URL: https://uptimerobot.com

---

## Troubleshooting

### Issue 1: Build Failed

**Error:** `npm run build` fails

**Fix:**
```bash
# Check TypeScript errors
npm run type-check

# Fix errors
# Then rebuild
npm run build
```

---

### Issue 2: Environment Variables Not Working

**Error:** API returns "Missing environment variable"

**Fix:**
1. Verify env vars in Vercel dashboard
2. Check spelling matches `.env.example`
3. Redeploy: `vercel --prod`

---

### Issue 3: Database Connection Failed

**Error:** Health check shows "unhealthy"

**Fix:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check `SUPABASE_SERVICE_ROLE_KEY` is valid
3. Verify Supabase project is active
4. Check firewall/IP restrictions

---

### Issue 4: 504 Gateway Timeout

**Error:** Functions timeout after 10s

**Fix:**
1. Increase timeout in `route.ts`:
   ```typescript
   export const maxDuration = 60; // 60 seconds
   ```
2. Move long-running tasks to background jobs
3. Optimize database queries

---

### Issue 5: High Cold Start Times

**Error:** First request takes > 5s

**Fix:**
1. Enable Vercel Edge Functions (for simple endpoints)
2. Use warming strategy (cron job)
3. Optimize bundle size
4. Use dynamic imports

---

## Rollback Strategy

### If deployment fails:

```bash
# View deployments
vercel ls

# Rollback to previous
vercel rollback https://resply-prev123.vercel.app --prod
```

### Via Dashboard:

1. Go to: Deployments
2. Find previous working deployment
3. Click: Promote to Production

---

## Continuous Deployment

### Option A: Git Integration (Recommended)

1. Go to: Project Settings → Git
2. Connect GitHub repository
3. Configure:
   - Production Branch: `main`
   - Preview Branches: All branches

**Auto-deploys on:**
- Push to `main` → Production
- Push to `feature/*` → Preview
- Pull Request → Preview with comment

---

### Option B: Manual Deployment

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

## Success Criteria

Your deployment is successful if:

- [ ] ✅ Build completes without errors
- [ ] ✅ Health check returns "healthy"
- [ ] ✅ Dashboard loads correctly
- [ ] ✅ Login/auth works
- [ ] ✅ API endpoints respond
- [ ] ✅ Database connected
- [ ] ✅ No console errors
- [ ] ✅ Monitoring setup (Sentry, UptimeRobot)
- [ ] ✅ Slack alerts working (if configured)
- [ ] ✅ Performance acceptable (< 3s page loads)

---

## Next Steps After Deployment

1. **Monitor for 24 hours:**
   - Watch Vercel logs
   - Check Sentry for errors
   - Monitor UptimeRobot alerts
   - Review Slack notifications

2. **Run load tests on production:**
   ```bash
   TEST_TARGET_URL=https://your-domain.vercel.app npm run test:load:health
   ```

3. **Setup custom domain** (if not done)

4. **Configure SSL certificate** (auto by Vercel)

5. **Enable Vercel Analytics** (optional)

6. **Document deployment process** for team

---

## Resources

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Vercel CLI Reference:** https://vercel.com/docs/cli
- **Environment Variables:** https://vercel.com/docs/concepts/projects/environment-variables

---

## Support

If issues persist:

1. **Vercel Support:** https://vercel.com/support
2. **Community:** https://github.com/vercel/next.js/discussions
3. **Status Page:** https://www.vercel-status.com/

---

**Deployment Date:** 2025-01-05
**Version:** Sprint 1 & 2 Complete
**Status:** ✅ Ready for deployment

**Deployed by:** [Your name]
**Production URL:** https://your-domain.vercel.app
