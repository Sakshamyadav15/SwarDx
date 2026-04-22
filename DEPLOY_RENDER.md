# Deployment Guide for SwarDx

## Architecture
- **Backend**: Render (Docker) - https://swardx-backend.onrender.com
- **Frontend**: Vercel (Next.js) - https://swardx-frontend.vercel.app

## Step-by-Step Deployment Instructions

### Prerequisites
- GitHub account with this repository pushed
- Render account (free tier available at https://render.com)
- Vercel account (free tier available at https://vercel.com)

### Part 1: Deploy Backend on Render

#### 1. Push Repository to GitHub
```bash
git add .
git commit -m "Configure Render and Vercel deployment"
git push origin main
```

#### 2. Create Backend Service on Render

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Select your GitHub repository (authorize if needed)
4. Fill in the service details:
   - **Name**: `swardx-backend`
   - **Branch**: `main`
   - **Root Directory**: (leave empty or use `/`)
   - **Environment**: `Docker`
   - **Instance Type**: `Free` (or `Standard` for better performance)

5. Add Environment Variables:
   - `PYTHONUNBUFFERED=1`

6. Click **"Create Web Service"**

**⏳ Wait for deployment** (~5-10 minutes). Your backend URL will be: `https://swardx-backend.onrender.com`

Copy this URL - you'll need it for Vercel configuration.

---

### Part 2: Deploy Frontend on Vercel

#### 1. Connect to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Paste your GitHub repository URL and click **"Continue"**
5. Authorize Vercel to access your GitHub account

#### 2. Configure Project

1. **Framework Preset**: Should auto-detect as `Next.js`
2. **Root Directory**: Select `frontend`
3. Click **"Override"** and set:
   - Build Command: `pnpm install && pnpm run build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

#### 3. Add Environment Variables

Click **"Environment Variables"** and add:
- **Name**: `BACKEND_PREDICT_URL`
- **Value**: `https://swardx-backend.onrender.com/predict` (your Render backend URL)

#### 4. Deploy

Click **"Deploy"** and wait for the build to complete (~2-3 minutes).

Your frontend will be available at a URL like: `https://swardx-frontend.vercel.app`

---

## Verification

1. **Backend Health**: Visit `https://swardx-backend.onrender.com/docs`
   - Should see FastAPI Swagger UI

2. **Frontend**: Visit your Vercel URL
   - Should load without errors

3. **Test Integration**: 
   - Record audio in the frontend
   - Submit for prediction
   - Should get response from backend

---

## Configuration Files

### `vercel.json`
Configures Vercel build process for the frontend. Specifies:
- Build and install commands
- Environment variable endpoint
- Node.js runtime version

### `render.yaml`
Defines backend service configuration. Specifies:
- Docker build setup
- Health check endpoint
- Environment variables

---

## Troubleshooting

### Backend Issues on Render

**Build Fails**
- Check Docker build logs
- Ensure `ffmpeg` and other system dependencies install correctly
- Verify `requirements.txt` has all dependencies

**Runtime Errors**
- Check logs: Dashboard → Service → Logs
- Verify model files (`opxg_model.json`, `scaler.pkl`, etc.) are in repo
- Ensure audio preprocessing dependencies are installed

### Frontend Issues on Vercel

**Build Fails**
- Check Vercel build logs
- Ensure `pnpm-lock.yaml` is committed (for reproducible installs)
- Verify `next.config.mjs` is valid

**Can't Connect to Backend**
- Verify `BACKEND_PREDICT_URL` environment variable is set
- Check browser console for CORS/network errors
- Ensure backend URL in env var is correct
- Test endpoint directly: `https://swardx-backend.onrender.com/docs`

**TypeScript Errors**
- Already configured to ignore build errors in `next.config.mjs`
- If strict mode needed, remove `ignoreBuildErrors: true`

---

## Monitoring

### Render Backend
- **Logs**: Dashboard → Service → Logs
- **Metrics**: Dashboard → Service → Metrics
- **Manual Deploy**: Dashboard → Service → "Manual Deploy"

### Vercel Frontend
- **Logs**: Project Settings → Deployments → click deployment
- **Analytics**: Dashboard → Project → Analytics
- **Auto-Deploy**: Automatic on push to main branch

---

## Cost Optimization

### Render
- **Free Tier**: Limited to 750 hours/month, sleeps after 15 min inactivity
- **Standard**: $12/month - always running, better performance
- Recommendation: Use Free for testing, Standard for production

### Vercel
- **Free Tier**: Includes serverless functions, automatic scaling
- **Pro**: $20/month - analytics, priority support
- Recommendation: Free tier is sufficient for most use cases

---

## Auto-Deployment

Both services auto-deploy on push to `main`:
- Render: Automatically redeploys backend
- Vercel: Automatically redeploys frontend

For manual deploys:
- Render: Click "Manual Deploy" in dashboard
- Vercel: Click "Redeploy" in deployments tab

---

## Production Checklist

- [ ] Backend running on Render with health checks passing
- [ ] Frontend running on Vercel
- [ ] `BACKEND_PREDICT_URL` environment variable set on Vercel
- [ ] CORS working (backend accepts frontend origin)
- [ ] Audio upload and prediction working end-to-end
- [ ] Monitoring/logging configured
- [ ] Custom domain configured (optional)
