# Fly.io Deployment Checklist

## Pre-Deployment

- [ ] Repository pushed to GitHub
- [ ] `fly.toml` configured with your app name
- [ ] `Dockerfile` exists in root directory
- [ ] All environment variables documented

## Fly.io Setup

- [ ] Fly.io account created at [fly.io](https://fly.io)
- [ ] App created in Fly.io dashboard
- [ ] GitHub repository connected (optional)

## Secrets Configuration

### Essential
- [ ] `NODE_ENV=production`
- [ ] `PORT=3001`

### API URLs
- [ ] `VITE_API_URL=https://<your-app>.fly.dev/api`
- [ ] `API_URL=https://<your-app>.fly.dev/api`

### Optional: Redis (Recommended)
- [ ] Upstash Redis created
- [ ] `UPSTASH_REDIS_REST_URL` set
- [ ] `UPSTASH_REDIS_REST_TOKEN` set

### Optional: Groq Chatbot
- [ ] Groq API key obtained from [console.groq.com](https://console.groq.com)
- [ ] `GROQ_API_KEY` set
- [ ] `GROQ_MODEL=llama-3.1-8b-instant` set

### Optional: Fanart.tv
- [ ] Fanart API key obtained from [fanart.tv](https://fanart.tv)
- [ ] `FANART_API_KEY` set

### Optional: TMDB
- [ ] TMDB account created at [themoviedb.org](https://www.themoviedb.org)
- [ ] API keys obtained
- [ ] `TMDB_ACCESS_TOKEN` set
- [ ] `TMDB_API_KEY` set

### Optional: Firebase
- [ ] Firebase project created
- [ ] Web app created in Firebase
- [ ] All `VITE_FIREBASE_*` variables set
- [ ] Firestore security rules configured

## Deployment

- [ ] GitHub Actions workflow triggered (if using auto-deploy)
- [ ] Docker build successful
- [ ] Application deployed
- [ ] Health check endpoint responding (`/health`)
- [ ] Frontend accessible at `https://<your-app>.fly.dev`
- [ ] API endpoints working

## Post-Deployment

- [ ] Monitor logs for errors: `flyctl logs -f`
- [ ] Test anime/manga browsing
- [ ] Test video player (if available)
- [ ] Test search functionality
- [ ] Check memory usage
- [ ] Verify caching is working (if Redis enabled)

## Performance Optimization

- [ ] Enable Redis caching
- [ ] Scale up VM if needed
- [ ] Enable multiple instances
- [ ] Configure CDN for static assets (optional)
- [ ] Set up monitoring alerts

## Custom Domain (Optional)

- [ ] Custom domain registered
- [ ] DNS records configured
- [ ] SSL certificate auto-provisioned by Fly.io
- [ ] Domain pointing to Fly.io

## Maintenance

- [ ] Set up log monitoring
- [ ] Enable automatic backups (if using Firebase)
- [ ] Create deployment rollback plan
- [ ] Document emergency procedures
- [ ] Set up CI/CD workflow (optional)
