Deployment guide — Deploying `eCagraray` with a shareable domain

This project is container-ready. Below are quick, tested options to publish the app and get a public URL you can share.

Prerequisites (local):
- Docker installed
- GitHub repository for your project
- (Optional) `flyctl` if deploying from your machine

Quick local build + run (testing):

```bash
# build the project (already verified works in this workspace)
npm run build

# build the Docker image locally
docker build -t ghcr.io/<OWNER>/<REPO>:latest .

# run the container locally
docker run -p 4173:4173 ghcr.io/<OWNER>/<REPO>:latest
# open http://localhost:4173
```

Option A — Deploy to Fly.io (recommended for simple Docker deployments)

1. Install `flyctl`: https://fly.io/docs/hands-on/install-flyctl/
2. Login and create app:

```bash
flyctl auth login
flyctl apps create ecagraray-app
```

3. From the repo, deploy using the image built by GitHub Actions or locally:

```bash
# using local image
docker build -t ghcr.io/<OWNER>/<REPO>:latest .
docker push ghcr.io/<OWNER>/<REPO>:latest
flyctl deploy --image ghcr.io/<OWNER>/<REPO>:latest --config fly.toml
```

4. Fly will provide a public hostname like `ecagraray-app.fly.dev` which you can share.

Custom domain (example: `www.example.com`):

- In Fly: `flyctl domains create www.example.com`
- In your DNS provider: add a CNAME `www` -> `ecagraray-app.fly.dev` and follow Fly's instructions to validate and add TLS.

Option B — Use GitHub Actions + GitHub Container Registry + Fly (CI-driven)

- The provided GitHub Actions workflow `.github/workflows/publish-and-deploy.yml` builds a Docker image and pushes it to GHCR.
- Set repository secret `FLY_API_TOKEN` (from Fly account) in GitHub Settings → Secrets.
- Push to `main` branch and the workflow will build and deploy automatically.

Option C — Railway / Render / Other

- These platforms accept either a connected GitHub repo (auto-build) or a Docker image. Use the same image `ghcr.io/<OWNER>/<REPO>:<tag>` or configure their build steps to run `npm run build` then `node dist/server/server.js`.

DNS / Domain notes

- Register a domain with any registrar (Namecheap, Cloudflare, Google Domains, etc.).
- Use your host's published instructions to point the domain via CNAME (for Fly) or A records (if provided IPs).

If you want, I can:
- Create a GitHub repo and push this code (requires your GitHub credentials).
- Configure a GitHub Actions secret template and help you register the Fly app and set `FLY_API_TOKEN`.
- Walk through adding a custom domain step-by-step for your DNS provider.

Commands summary (copyable):

```bash
# build locally
npm run build

# build and push image to GHCR (replace placeholders)
docker build -t ghcr.io/<OWNER>/<REPO>:latest .
echo $GHCR_PAT | docker login ghcr.io -u <OWNER> --password-stdin
docker push ghcr.io/<OWNER>/<REPO>:latest

# deploy with flyctl
flyctl auth login
flyctl apps create ecagraray-app
flyctl deploy --image ghcr.io/<OWNER>/<REPO>:latest --config fly.toml
```
