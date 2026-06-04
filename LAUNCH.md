# e-Cagraray — Permanent Launch Guide

Barangay Cagraray residents and officials need a **24/7 public URL** that does not depend on your PC or a temporary tunnel.

## Recommended: Fly.io (Singapore)

**Permanent URL:** `https://ecagraray-app.fly.dev`

You are already logged in to Fly as `edgartoledana233@gmail.com`. Fly requires a payment method on file for verification (free tier is available; you are not charged unless you exceed limits).

### One-time setup (about 5 minutes)

1. Open billing and add a card:  
   https://fly.io/dashboard/personal/billing

2. Deploy from the project folder:

   ```powershell
   cd C:\Users\Administrator\Downloads\eCagraray\eCagraray
   .\scripts\deploy.ps1
   ```

3. Share the URL with the community:
   - **Home:** https://ecagraray-app.fly.dev
   - **Login:** https://ecagraray-app.fly.dev/login
   - **Register:** https://ecagraray-app.fly.dev/register

4. Change default passwords after first login (`admin` / `admin123`, etc.).

### Auto-deploy from GitHub (optional)

After the first successful deploy:

```powershell
flyctl tokens create deploy -a ecagraray-app
```

Add the token as a GitHub secret named `FLY_API_TOKEN` on  
https://github.com/edgartoledana-dotcom/eCagraray/settings/secrets/actions

Every push to `main` will then redeploy automatically.

---

## Alternative: Cloudflare Workers (no credit card)

**Permanent URL:** `https://ecagraray.<your-account>.workers.dev`

1. Complete login in the browser when prompted:

   ```powershell
   cd C:\Users\Administrator\Downloads\eCagraray\eCagraray
   npx wrangler login
   ```

2. Deploy:

   ```powershell
   .\scripts\deploy-cloudflare.ps1
   ```

---

## What was configured

| Item | Purpose |
|------|---------|
| `fly.toml` | Fly.io app in Singapore with 1 GB persistent data volume |
| `Dockerfile` | Production Node server (Nitro) |
| `vite.config.ts` | Production build with Nitro `node-server` |
| `.github/workflows/publish-and-deploy.yml` | CI deploy when secrets are set |
| `scripts/deploy.ps1` | Fly.io one-command launch |
| `scripts/deploy-cloudflare.ps1` | Cloudflare Workers launch |

Data (users, residents, barangay info) is stored in `/app/data` on Fly or in Cloudflare D1 when using the Cloudflare deploy path.
