# Render Deployment Guide for SwarDx

## Step-by-Step Deployment Instructions

### Prerequisites
- GitHub account with this repository pushed
- Render account (free tier available at https://render.com)

### Deployment Steps

#### 1. Push Repository to GitHub
```bash
git add .
git commit -m "Add render.yaml for Render deployment"
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
   - **Build Command**: (leave empty - uses Dockerfile)
   - **Start Command**: (leave empty - uses Dockerfile)

5. Add Environment Variables:
   - `PYTHONUNBUFFERED=1`

6. Click **"Create Web Service"**

**⏳ Wait for deployment** (~5-10 minutes). Your backend URL will be something like: `https://swardx-backend.onrender.com`

#### 3. Create Frontend Service on Render

1. Click **"New +"** → **"Web Service"** again
2. Select your GitHub repository
3. Fill in the service details:
   - **Name**: `swardx-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Environment**: `Node`
   - **Node Version**: `20` (or current LTS)
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `pnpm start`
   - **Instance Type**: `Free` (or `Standard`)

4. Add Environment Variables:
   - `BACKEND_PREDICT_URL=https://swardx-backend.onrender.com/predict`
   - `NODE_ENV=production`

5. Click **"Create Web Service"**

#### 4. Configure CORS on Backend (Optional)

Your backend already has CORS enabled with `allow_origins=["*"]`, which allows requests from your frontend. No additional config needed!

### Verification

1. **Backend**: Visit `https://swardx-backend.onrender.com/docs` - you should see FastAPI Swagger UI
2. **Frontend**: Visit your frontend URL - it should load and be able to call the backend

### Troubleshooting

#### Backend Not Starting
- Check logs in Render dashboard
- Ensure all model files are in the repo (or add to `.gitignore` and upload separately)
- Verify `requirements.txt` installs without errors

#### Frontend Can't Connect to Backend
- Confirm backend URL in environment variable matches your actual backend URL
- Check browser console for CORS errors
- Ensure backend health check is passing

#### Build Fails
- For backend: Docker build failure usually means missing system dependencies
- For frontend: Check Node version and pnpm lock file is committed

### Monitoring & Maintenance

1. **View Logs**: Dashboard → Service → Logs
2. **Manual Deploy**: Dashboard → Service → "Manual Deploy" button
3. **Auto-Deploy**: Automatically deploys on push to `main` branch

### Performance Tips

- **Use Standard Plan** for production (Free plan sleeps after inactivity)
- **Add PostgreSQL** if you need persistent data storage
- **Consider caching** for repeated predictions

### Auto-Deployment Configuration

Both services are configured to:
- Auto-deploy on push to `main`
- Have health checks enabled
- Scale automatically based on load

---

## Alternative: Single Service Deployment (If Using render.yaml)

If Render adds support for `render.yaml` (multi-service blueprint):

```bash
# Just push and Render will auto-detect render.yaml
git push origin main
```

For now, deploy backend and frontend as separate services following the steps above.
