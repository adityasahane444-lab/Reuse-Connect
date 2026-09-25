# Deployment Guide — Reuse & Connect

This guide walks you through deploying **Reuse & Connect** to production using **Vercel** (recommended for Next.js), with alternatives for **Railway** or **Render**.

---

## 🚀 Best Option: Vercel (Recommended)

Vercel is built for Next.js and offers a generous free tier perfect for this project:
- **Free tier**: 3 deployments/month, unlimited bandwidth, global CDN
- **CI/CD**: Auto-deploys on every git push (no manual builds)
- **Database**: Works seamlessly with Supabase (external)
- **Email**: Mailjet integrations work flawlessly

### Prerequisites
- GitHub account (Vercel imports from GitHub)
- Supabase project already set up (with schema running)
- Mailjet account (free tier available at mailjet.com/pricing)
- Domain (optional—Vercel gives you a free *.vercel.app domain)

### Step 1: Push your code to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Reuse Connect with Mailjet"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/Reuse-Connect.git
git push -u origin main
```

### Step 2: Create a Vercel account and import the repo

1. Go to **vercel.com** → Sign up with GitHub
2. Click **"Add New Project"** → Select the Reuse-Connect repo
3. Vercel auto-detects Next.js (no build config needed)
4. Click **"Continue"** to go to environment variables

### Step 3: Add environment variables in Vercel

In the Vercel import screen, add these variables for **Production, Preview, and Development**:

| Variable | Value | Source |
|----------|-------|--------|
| `SUPABASE_URL` | `https://your-project.supabase.co` | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service_role key | Supabase → Settings → API → service_role "secret" |
| `MAILJET_API_KEY` | Your Mailjet API key | Mailjet → Account Settings → API Key Management |
| `MAILJET_SECRET_KEY` | Your Mailjet secret key | Mailjet → Account Settings → API Key Management |
| `MAILJET_FROM_EMAIL` | `noreply@yourdomain.com` | Must be verified in Mailjet |
| `MAILJET_FROM_NAME` | `Reuse & Connect` | Can be anything |

**Getting Mailjet credentials:**
1. Sign up at mailjet.com (free tier: 6,000 emails/month, 200/day limit)
2. Verify a sender email address (in Account → Sender emails)
3. Go to Account → API Key Management → Create an API key
4. Copy both the API key and secret key

### Step 4: Deploy

Click **"Deploy"** — Vercel builds and deploys your app to a live URL (e.g., `reuse-connect.vercel.app`) in 2–3 minutes.

Every future `git push` to `main` auto-deploys. Preview deployments are created for pull requests.

### Step 5: Test the deployment

1. Visit your Vercel URL
2. Sign up with an email address
3. Check your email inbox for the verification code
4. Complete registration
5. Check the Vercel logs if emails don't arrive: **Vercel dashboard → your project → Deployments → Logs**

### Step 6 (Optional): Use a custom domain

1. **Vercel**: Project Settings → Domains → Add your domain
2. **DNS Provider** (GoDaddy, Namecheap, etc.): Follow Vercel's DNS instructions
3. DNS propagation takes 5–10 minutes

---

## 🚂 Alternative: Railway

Railway is a good second choice—simpler than Vercel for beginners, but not as automated.

### Setup

1. Go to **railway.app** → Sign up with GitHub
2. Create a new project → Deploy code from GitHub
3. Select your Reuse-Connect repo
4. Railway auto-detects Next.js
5. In **Variables**, add all the same env vars as above
6. Railway builds and deploys automatically
7. Your app runs at `your-project.railway.app`

**Pros**: Simple, no build config needed  
**Cons**: Free tier has limited compute hours/month

---

## 🎯 Alternative: Render

Render is another solid free option with good uptime.

### Setup

1. Go to **render.com** → Sign up with GitHub
2. Create a new **Web Service** from GitHub
3. Select Reuse-Connect repo → Render detects Next.js
4. In **Environment**, paste your env vars
5. Deploy
6. Your app runs at `your-app.onrender.com`

**Pros**: Generous free tier, good performance  
**Cons**: Cold starts on free tier (takes 30s first request after idle)

---

## Vercel vs. Railway vs. Render

| Feature | Vercel | Railway | Render |
|---------|--------|---------|--------|
| **Free tier cost** | Free | $5 free credit/month | Free (with restrictions) |
| **Build time** | Fast | Medium | Medium |
| **Auto-deploy on push** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Custom domain** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Environment vars** | Easy UI | Easy UI | Easy UI |
| **Cold starts** | No | Minimal | Yes, on free tier |
| **Best for** | Next.js projects | General Node apps | General Node apps |

**Recommendation**: Use **Vercel** for this project.

---

## 🗂️ Project Structure (Pre-deployment)

Before pushing to GitHub, ensure:

```
Reuse-Connect/
├── .env.local.example      ← Template (no secrets)
├── .gitignore              ← Excludes .env.local, node_modules
├── package.json
├── next.config.ts
├── tsconfig.json
├── app/                    ← All routes
├── lib/
│   ├── supabase.ts         ← Reads SUPABASE_* from env
│   ├── email.ts            ← Reads MAILJET_* from env
│   └── ...
├── components/
├── supabase/
│   ├── schema.sql          ← Run once in Supabase SQL Editor
│   ├── migration-002-features.sql
│   └── setup-full.sql      ← Combined (easiest)
├── DEPLOYMENT.md           ← This file
└── README.md
```

---

## 🔑 Environment Variables Checklist

Before deploying, collect these:

- [ ] `SUPABASE_URL` (from Supabase dashboard)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (from Supabase dashboard — **NOT the anon key**)
- [ ] `MAILJET_API_KEY` (from Mailjet account)
- [ ] `MAILJET_SECRET_KEY` (from Mailjet account)
- [ ] `MAILJET_FROM_EMAIL` (verified in Mailjet)
- [ ] `MAILJET_FROM_NAME` (default: "Reuse & Connect")

---

## 🐛 Troubleshooting

### App deploys but shows "500 error"

**Cause**: Missing or wrong environment variables.

**Fix**: In Vercel, go to **Project Settings → Environment Variables** and double-check all values are pasted correctly (no extra spaces).

### Emails don't arrive after signup

1. Check Vercel logs: **Deployments → [latest] → Functions** tab
2. Look for Mailjet errors in the output
3. Verify in Mailjet that the `MAILJET_FROM_EMAIL` is a verified sender (Mailjet → Account → Sender emails)

### Build fails with "Cannot find module"

1. Ensure `package.json` and `package-lock.json` are committed to GitHub
2. Don't modify `package.json` after committing — let Vercel install deps

### Database connection error

1. Verify `SUPABASE_URL` matches your Supabase project URL exactly
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is the **service_role** key, not the anon key
3. Test the connection locally: `npm run dev` with `.env.local` set, then try signing up

---

## 📊 Monitoring After Deployment

Once live:

1. **Vercel Analytics**: Dashboard shows deploy history, build times, edge function execution
2. **Supabase Dashboard**: Monitor database usage, realtime subscriptions
3. **Mailjet Dashboard**: Track email deliverability, bounces, opens
4. **Set up alerts**: Vercel → Project Settings → Alerts (failed builds)

---

## 🔄 Updates & Rollbacks

Every `git push` to `main` triggers a new Vercel deployment:
- **New deployment**: Takes ~2 min
- **Rollback**: Vercel → Deployments → click a past deployment → "Promote to Production"

---

## Next Steps

1. Deploy to Vercel following **Step 1–5** above
2. Test signup → email verification → full registration flow
3. Sign up as the first admin: `update users set is_admin = true where email = 'you@example.com';` in Supabase SQL Editor
4. Visit `/admin` to unlock the moderation dashboard
5. Share the Vercel URL with your community!

---

For issues, check Vercel logs, Supabase SQL errors, or Mailjet delivery reports.
