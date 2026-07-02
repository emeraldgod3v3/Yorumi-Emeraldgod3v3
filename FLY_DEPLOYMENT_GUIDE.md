# Yorumi Fly.io Deployment Guide

This guide walks you through deploying Yorumi to Fly.io from the web dashboard.

## Prerequisites

- A Fly.io account (free tier available at [fly.io](https://fly.io))
- Your Yorumi GitHub repository
- API keys for optional services (Groq, TMDB, Fanart.tv, Firebase)

## Step 1: Create a Fly.io App via Web Dashboard

1. Go to [fly.io/dashboard](https://fly.io/dashboard)
2. Click **"Create App"** button
3. Select **"Create New App"**
4. Choose a unique app name (e.g., `yorumi-anime`)
5. Select your organization (or create one)
6. Choose a region closest to you (e.g., `sjc` for San Francisco, `ewr` for New York)
7. Click **"Create App"**

## Step 2: Configure Docker Image Build

### Option A: Connect GitHub Repository (Recommended)

1. On the app page, go to the **"Deployment"** tab
2. Click **"Deploy via GitHub"**
3. Authorize Fly.io to access your GitHub account
4. Select your `emeraldgod3v3/Yorumi-Emeraldgod3v3` repository
5. Choose the `fly-io-deployment` branch
6. Enable **"Deploy on every push to this branch"**
7. Click **"Deploy"**

### Option B: Manual Docker Build (via CLI)

```bash
# Install flyctl from https://fly.io/docs/hands-on/install-flyctl/
flyctl auth login
flyctl deploy --local-only --build-only
```

## Step 3: Set Environment Secrets

1. In your app dashboard, go to **"Secrets"** tab
2. Click **"+ New Secret"** for each of these variables:

### Essential Secrets (Required)

```bash
# Backend port (should match Dockerfile)
PORT=3001
NODE_ENV=production
```

### Recommended: Redis Cache (for performance)

1. Create a Redis database:
   - Go to **"Add-ons"** → **"Create Upstash Redis"**
   - Choose a region matching your app
   - Copy the credentials

2. Add secrets:
   ```bash
   UPSTASH_REDIS_REST_URL=<your-upstash-url>
   UPSTASH_REDIS_REST_TOKEN=<your-upstash-token>
   ```

### Optional: Groq API (for Yumi Chatbot)

1. Get API key from [console.groq.com](https://console.groq.com)
2. Add secret:
   ```bash
   GROQ_API_KEY=<your-groq-api-key>
   GROQ_MODEL=llama-3.1-8b-instant
   ```

### Optional: Fanart.tv (for anime artwork)

1. Get API key from [fanart.tv/api](https://fanart.tv/api/)
2. Add secret:
   ```bash
   FANART_API_KEY=<your-fanart-api-key>
   ```

### Optional: TMDB (for title matching)

1. Get API key from [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
2. Add secrets:
   ```bash
   TMDB_ACCESS_TOKEN=<your-tmdb-v4-token>
   TMDB_API_KEY=<your-tmdb-api-key>
   ```

### Optional: Firebase (for user authentication & profiles)

1. Create a project at [firebase.google.com](https://firebase.google.com)
2. Get your web app config from **Project Settings**
3. Add secrets:
   ```bash
   VITE_FIREBASE_API_KEY=<your-api-key>
   VITE_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=<your-project-id>
   VITE_FIREBASE_STORAGE_BUCKET=<your-project>.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
   VITE_FIREBASE_APP_ID=<your-app-id>
   VITE_FIREBASE_MEASUREMENT_ID=<your-measurement-id>
   ```

## Step 4: Configure Frontend Environment Variables

1. In the Fly.io dashboard **Secrets** tab, add:
   ```bash
   VITE_API_URL=https://<your-app-name>.fly.dev/api
   VITE_CLOUDINARY_CLOUD_NAME=div8klfkc
   ```

2. Or update the build environment by adding a **`fly.toml`** config:
   - The file is already in your repository
   - Modify the `app` name to match your Fly.io app

## Step 5: Deploy the Application

### Via GitHub (Automatic)
- Push changes to the `fly-io-deployment` branch
- Fly.io automatically builds and deploys
- Monitor progress in **"Deployments"** tab

### Via CLI (Manual)
```bash
flyctl deploy
```

## Step 6: Monitor Your Deployment

1. Go to **"Monitoring"** tab to see:
   - CPU usage
   - Memory consumption
   - Request metrics
   - Deployment logs

2. View real-time logs:
   - Click **"Logs"** tab
   - Or use CLI: `flyctl logs -f`

## Step 7: Scale Your App (Optional)

If you experience performance issues:

1. Go to **"Machines"** tab
2. Click on your machine
3. Choose a larger VM size:
   - `shared-cpu-1x` (512MB RAM) - Free tier
   - `shared-cpu-2x` (1GB RAM)
   - `performance-1x` (2GB RAM)
   - `performance-2x` (4GB RAM)

## Troubleshooting

### App Won't Start

1. Check **"Logs"** for errors
2. Verify all required secrets are set
3. Ensure Dockerfile builds correctly locally:
   ```bash
   docker build -t yorumi:latest .
   docker run -p 3001:3001 yorumi:latest
   ```

### Out of Memory

1. Scale up VM size (see Step 7)
2. Disable scraper warmer: `DISABLE_SCRAPER_WARMER=true`
3. Reduce cache warming timeout in `backend/src/index.ts`

### Cold Starts Taking Too Long

- Normal for first deployment (can take 30-60 seconds)
- Enable Redis to speed up subsequent requests
- Add more replicas in **"Scale"** tab

### API Calls Fail / 502 Errors

1. Check if backend is handling CORS properly
2. Verify `VITE_API_URL` is set to `https://your-app.fly.dev/api`
3. Check logs for specific errors

## Accessing Your App

Once deployed:

- **Frontend**: `https://<your-app-name>.fly.dev`
- **API**: `https://<your-app-name>.fly.dev/api`
- **Health Check**: `https://<your-app-name>.fly.dev/health`

## Useful CLI Commands

```bash
# View app status
flyctl status

# SSH into the running instance
flyctl ssh console

# View real-time logs
flyctl logs -f

# List all deployments
flyctl releases list

# Rollback to previous version
flyctl releases rollback

# View secrets
flyctl secrets list

# Update a secret
flyctl secrets set MY_VAR=new_value

# Remove a secret
flyctl secrets unset MY_VAR

# Scale app
flyctl scale count=2  # Create 2 instances

# View metrics
flyctl monitoring
```

## Next Steps

1. **Enable Continuous Deployment**: GitHub Actions workflow to auto-deploy on push
2. **Set up monitoring**: Create alerts for errors/crashes
3. **Enable Custom Domain**: Add your own domain in **"Custom Domains"** tab
4. **Backup User Data**: Enable Firestore backups if using Firebase
5. **Performance Optimization**: Enable Redis caching for better response times

## Need Help?

- Fly.io Docs: [fly.io/docs](https://fly.io/docs)
- Yorumi GitHub: [github.com/emeraldgod3v3/Yorumi-Emeraldgod3v3](https://github.com/emeraldgod3v3/Yorumi-Emeraldgod3v3)
- Community: [fly.io/slack](https://slack.fly.io)
