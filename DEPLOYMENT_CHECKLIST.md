# Pre-Deployment Checklist

Complete this checklist before deploying to production on Vercel.

## 1. Supabase Setup ✓

- [ ] Supabase project created at supabase.com
- [ ] SQL schema applied (run `supabase/setup-full.sql` in SQL Editor)
- [ ] Storage bucket "avatars" exists (auto-created by migration)
- [ ] Verified you have Project URL and service_role key
- [ ] Row Level Security enabled on all tables (schema does this)

**Quick test**: Try logging in locally (`npm run dev`) to verify DB connection works

## 2. Mailjet Setup ✓

- [ ] Mailjet account created (free tier at mailjet.com/pricing)
- [ ] Sender email verified (Account → Sender emails → Add a sender → Verify via email)
- [ ] API key created (Account → API Key Management → Create)
- [ ] Secret key copied and saved securely
- [ ] From email and name configured

**Quick test**: Sign up locally with `npm run dev` and check your inbox for the OTP email

## 3. Code Verification ✓

- [ ] `.env.local.example` is present (template, no secrets)
- [ ] `.gitignore` includes `.env.local` (secrets won't be committed)
- [ ] No hardcoded credentials in `lib/supabase.ts` or `lib/email.ts`
- [ ] `vercel.json` is present (deployment config)
- [ ] `DEPLOYMENT.md` is present (this guide)

**Quick test**: 
```bash
npm install
npm run build  # Should complete with all 43 routes
npm run dev    # Should start without errors
```

## 4. GitHub Preparation ✓

- [ ] Repository created on GitHub (public or private)
- [ ] Code pushed to `main` branch
- [ ] `.gitignore` is working (check `git status` — `.env.local` and `node_modules` should NOT show)

```bash
# Verify no secrets are tracked
git status | grep -i "env\|key" || echo "✓ No secrets in git"
```

## 5. Vercel Account Setup ✓

- [ ] Vercel account created (vercel.com)
- [ ] GitHub connected to Vercel
- [ ] Ready to import your Reuse-Connect repo

## 6. Environment Variables (Save These!)

Copy all values into a safe place before deploying:

```
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
MAILJET_API_KEY=xxxxxxx
MAILJET_SECRET_KEY=xxxxxxx
MAILJET_FROM_EMAIL=noreply@yourdomain.com
MAILJET_FROM_NAME=Reuse & Connect
```

**⚠️ WARNING**: These are production secrets. **Never commit them to GitHub.** Only paste into Vercel environment variables UI.

## 7. Deployment (Follow DEPLOYMENT.md)

Once the above is done:

1. Go to vercel.com → "Add New Project"
2. Select your Reuse-Connect GitHub repo
3. Click "Continue" → Paste environment variables
4. Click "Deploy"
5. Wait 2–3 minutes for build to complete
6. Visit your Vercel URL and test the full flow:
   - Sign up → Receive OTP email → Verify email → Complete registration
   - Log in → Post food/resources → Check notifications
   - Try admin panel (set `is_admin = true` in Supabase first)

## 8. Post-Deployment

- [ ] Test signup/email verification on the live site
- [ ] Check Vercel logs if anything fails (Deployments → [latest] → Logs)
- [ ] Set yourself as admin: Run in Supabase SQL Editor:
  ```sql
  update users set is_admin = true where email = 'your@email.com';
  ```
- [ ] Check `/admin` page is accessible
- [ ] Share your live URL with the community!

---

## 🆘 If Something Goes Wrong

**Build fails on Vercel?**
- Check Vercel build logs: Dashboard → Deployments → [Latest] → Logs
- Verify environment variables are set in Vercel (Project Settings → Environment Variables)
- Ensure `.env.local.example` and `vercel.json` are committed to GitHub

**Emails don't arrive?**
- Check Vercel function logs (see above)
- Verify Mailjet `MAILJET_FROM_EMAIL` is a verified sender
- Check Mailjet dashboard → Message history for delivery status

**Database connection error?**
- Double-check `SUPABASE_URL` (no typos)
- Verify `SUPABASE_SERVICE_ROLE_KEY` is the service_role key, NOT the anon key

**Can't log in after deployment?**
- Check if session cookie is being set: Browser DevTools → Application → Cookies → check for session cookie
- Verify Supabase RLS is configured (schema does this automatically)

---

## 📋 File Checklist

Before pushing to GitHub, ensure these files exist:

```
.env.local.example ✓
.gitignore ✓
DEPLOYMENT.md ✓
DEPLOYMENT_CHECKLIST.md ✓
FEATURES.md ✓
README.md ✓
vercel.json ✓
package.json ✓
next.config.ts ✓
app/ ✓ (all routes)
lib/supabase.ts ✓ (no hardcoded keys)
lib/email.ts ✓ (reads from env)
supabase/setup-full.sql ✓ (schema)
```

---

All set? Now follow **DEPLOYMENT.md** to go live! 🚀
