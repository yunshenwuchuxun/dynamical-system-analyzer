# Render Deployment Guide

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

## Quick Deploy

Deploy this application to Render with just a few clicks!

## Manual Deployment Steps

### Prerequisites
- Render account ([Sign up here](https://render.com/))
- GitHub account

### Step 1: Fork or Clone this Repository

```bash
git clone https://github.com/yunshenwuchuxun/dynamical-system-analyzer.git
cd dynamical-system-analyzer
```

### Step 2: Create New Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +"
3. Select "Web Service"
4. Connect your GitHub repository
5. Choose this repository

### Step 3: Configure Web Service

**Basic Settings:**

| Setting | Value |
|---------|-------|
| Name | `dynamical-system-analyzer` |
| Environment | `Python 3` |
| Region | Choose nearest to your users |
| Branch | `main` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn app:app --bind 0.0.0.0:$PORT` |

**Environment Variables:**

Render automatically provides:
- ✅ `PORT` - HTTP port (automatically assigned)
- ✅ `RENDER` - Set to `true` (automatically)

**Optional Custom Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PYTHON_VERSION` | 3.9.23 | Python runtime version (from runtime.txt) |
| `WEB_CONCURRENCY` | 2 | Number of Gunicorn workers |

To add custom environment variables:
1. Go to your Render web service
2. Click on "Environment" tab
3. Add variables as needed

### Step 4: Deploy

Render will automatically:
1. ✅ Detect Python 3.9.23 from `runtime.txt`
2. ✅ Install dependencies from `requirements.txt`
3. ✅ Start the application using Gunicorn
4. ✅ Assign a public URL (yourapp.onrender.com)

Deployment typically takes **3-5 minutes** on first deploy.

### Step 5: Access Your Application

After deployment, Render provides a public URL like:
```
https://your-app-name.onrender.com
```

## Configuration Details

### Gunicorn Configuration

The application uses Gunicorn with the following parameters:

```bash
gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
```

**Parameters:**
- `--workers 2`: 2 worker processes (adjust based on Render plan)
- `--timeout 120`: 120s request timeout (for long-running computations)
- `--bind 0.0.0.0:$PORT`: Bind to all interfaces on Render's assigned port

### Health Check

Render performs health checks on:
- **Path:** `/` (main landing page)
- **Expected Status:** 200 OK
- **Auto-Sleep:** Free tier services sleep after 15 minutes of inactivity

## Troubleshooting

### Issue: Deployment Fails

**Check Render Logs:**
1. Go to your Render web service
2. Click "Logs" tab
3. View build and runtime logs

**Common Issues:**
- **Missing dependencies:** Verify `requirements.txt` is complete
- **Port binding error:** Ensure `$PORT` environment variable is used in app.py
- **Memory limit:** Upgrade Render plan if exceeded (Free tier: 512MB RAM)

### Issue: Application Timeout

If you see 504 Gateway Timeout errors:

1. Increase Gunicorn timeout in start command (Render Settings → Build & Deploy):
   ```bash
   gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 300
   ```

2. Optimize computation-heavy operations in `app.py`
3. Consider upgrading to a paid plan for better performance

### Issue: Static Files Not Loading

Verify that:
- `static/` directory is committed to Git
- Flask static file configuration in `app.py`:
  ```python
  app = Flask(__name__, static_folder='static', static_url_path='/static')
  ```

### Issue: Service Sleeps on Free Tier

Free tier services sleep after 15 minutes of inactivity:
- First request after sleep takes ~30 seconds to wake up
- Upgrade to paid plan for 24/7 availability
- Or use external monitoring service to ping periodically

## Monitoring

### View Logs

In Render Dashboard:
1. Select your web service
2. Click "Logs" tab
3. View real-time logs

### Metrics

Render provides:
- CPU usage
- Memory usage
- Bandwidth
- Request count
- Response times

Access via Render dashboard → Your Service → Metrics

## Scaling

### Vertical Scaling (Increase Resources)

1. Go to Render web service settings
2. Click "Instance Type"
3. Choose a higher-tier plan:
   - **Free:** 512 MB RAM, 0.1 CPU
   - **Starter ($7/mo):** 512 MB RAM, 0.5 CPU
   - **Standard ($25/mo):** 2 GB RAM, 1 CPU
   - **Pro ($85/mo):** 4 GB RAM, 2 CPU

**Recommended Worker Count:**
- **Free/Starter:** 2 workers
- **Standard:** 4 workers
- **Pro:** 8+ workers

### Horizontal Scaling

For high-traffic applications, consider:
- Using Render's load balancing features
- Deploying multiple instances
- Adding Redis caching layer

## Cost Optimization

**Free Tier:**
- 750 hours/month free
- Service sleeps after 15 minutes inactivity
- Good for personal projects and demos

**Tips to reduce costs:**
1. Use free tier for low-traffic applications
2. Optimize Matplotlib rendering (already using `Agg` backend)
3. Set appropriate Gunicorn worker count (default: 2)
4. Enable caching for repeated computations (future enhancement)
5. Monitor usage in Render dashboard

## Custom Domain

To use a custom domain:

1. Go to Render web service → Settings
2. Scroll to "Custom Domain"
3. Click "Add Custom Domain"
4. Enter your domain name
5. Update DNS records with your domain registrar:
   ```
   CNAME   your-subdomain   your-app.onrender.com
   ```
6. Wait for DNS propagation (usually 5-10 minutes)

## Security Best Practices

✅ **Already Implemented:**
- Production-ready Gunicorn server
- No Flask debug mode in production
- `.gitignore` excludes sensitive files
- HTTPS enabled by default on Render

⚠️ **Recommendations:**
- Add `FLASK_SECRET_KEY` as environment variable if using sessions
- Add rate limiting for API endpoints (future enhancement)
- Monitor logs for suspicious activity

## Automatic Deploys

Render automatically redeploys when you push to GitHub:

1. Make code changes locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```
3. Render detects the push and automatically redeploys
4. Check "Events" tab to monitor deployment progress

To disable auto-deploy:
- Go to Settings → Build & Deploy
- Toggle "Auto-Deploy" off

## Support

**Render Documentation:**
- [Render Docs](https://render.com/docs)
- [Python Deployment Guide](https://render.com/docs/deploy-flask)

**Project Issues:**
- [GitHub Issues](https://github.com/yunshenwuchuxun/dynamical-system-analyzer/issues)

---

**Deployment Checklist:**
- [ ] Repository pushed to GitHub
- [ ] Render web service created
- [ ] Build and start commands configured
- [ ] Environment variables set (if needed)
- [ ] Application deployed successfully
- [ ] Health check passing
- [ ] Public URL accessible
- [ ] Static files loading correctly
- [ ] API endpoints responding
- [ ] Custom domain configured (optional)

🚀 **Enjoy your deployed Dynamical System Analyzer on Render!**
