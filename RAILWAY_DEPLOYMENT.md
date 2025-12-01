# Railway Deployment Guide

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/dynsys-analyzer)

## Quick Deploy (One-Click)

Click the button above to deploy this application to Railway with a single click!

## Manual Deployment Steps

### Prerequisites
- Railway account ([Sign up here](https://railway.app/))
- GitHub account

### Step 1: Fork or Clone this Repository

```bash
git clone https://github.com/yunshenwuchuxun/dynamical-system-analyzer.git
cd dynamical-system-analyzer
```

### Step 2: Create New Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose this repository

### Step 3: Configure Environment Variables

Railway will automatically detect the following from the repository:
- ✅ Python runtime from `runtime.txt`
- ✅ Dependencies from `requirements.txt`
- ✅ Start command from `railway.json`

**Optional Environment Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | Auto-assigned | HTTP port (automatically set by Railway) |
| `PYTHON_VERSION` | 3.11.0 | Python runtime version |
| `FLASK_ENV` | production | Flask environment mode |
| `WEB_CONCURRENCY` | 2 | Number of Gunicorn workers |

To set custom environment variables:
1. Go to your Railway project
2. Click on "Variables" tab
3. Add variables as needed

### Step 4: Deploy

Railway will automatically:
1. ✅ Install Python 3.11.0
2. ✅ Install dependencies from `requirements.txt`
3. ✅ Start the application using Gunicorn
4. ✅ Assign a public URL

Deployment typically takes **2-3 minutes**.

### Step 5: Access Your Application

After deployment, Railway provides a public URL like:
```
https://your-app-name.up.railway.app
```

## Configuration Details

### Gunicorn Configuration (from railway.json)

```json
{
  "startCommand": "gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120 --access-logfile - --error-logfile -"
}
```

**Parameters:**
- `--workers 2`: 2 worker processes (adjust based on Railway plan)
- `--timeout 120`: 120s request timeout (for long-running computations)
- `--access-logfile -`: Log to stdout (viewable in Railway logs)
- `--error-logfile -`: Log errors to stderr

### Health Check

Railway performs health checks on:
- **Path:** `/` (main landing page)
- **Timeout:** 100 seconds
- **Restart Policy:** Restart on failure (max 10 retries)

## Troubleshooting

### Issue: Deployment Fails

**Check Railway Logs:**
1. Go to your Railway project
2. Click "Deployments" → Select latest deployment
3. View build and runtime logs

**Common Issues:**
- **Missing dependencies:** Verify `requirements.txt` is complete
- **Port binding error:** Ensure `$PORT` environment variable is used
- **Memory limit:** Upgrade Railway plan if exceeded

### Issue: Application Timeout

If you see 504 Gateway Timeout errors:

1. Increase Gunicorn timeout in `railway.json`:
   ```json
   "startCommand": "gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 300 ..."
   ```

2. Optimize computation-heavy operations in `app.py`

### Issue: Static Files Not Loading

Verify that:
- `static/` directory is committed to Git
- Flask static file configuration in `app.py`:
  ```python
  app = Flask(__name__, static_folder='static', static_url_path='/static')
  ```

## Monitoring

### View Logs

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# View live logs
railway logs
```

### Metrics

Railway provides:
- CPU usage
- Memory usage
- Network traffic
- Request count

Access via Railway dashboard → Your Project → Metrics

## Scaling

### Vertical Scaling (Increase Resources)

1. Go to Railway project settings
2. Upgrade to a higher-tier plan
3. Increase `WEB_CONCURRENCY` environment variable

**Recommended Worker Count:**
- **Starter Plan:** 2 workers
- **Developer Plan:** 4 workers
- **Team Plan:** 8+ workers

### Horizontal Scaling (Multiple Instances)

Railway automatically handles load balancing when you deploy multiple instances.

## Cost Optimization

**Free Tier Limits:**
- $5 free credit per month
- 500 hours execution time
- Shared CPU/memory

**Tips to reduce costs:**
1. Use `FLASK_DEBUG=False` in production
2. Optimize Matplotlib rendering (already using `Agg` backend)
3. Set appropriate Gunicorn worker count (default: 2)
4. Enable caching for repeated computations (future enhancement)

## Custom Domain

To use a custom domain:

1. Go to Railway project → Settings
2. Click "Generate Domain" or "Add Custom Domain"
3. Update DNS records with your domain registrar:
   ```
   CNAME   your-subdomain   your-app.up.railway.app
   ```

## Security Best Practices

✅ **Already Implemented:**
- Production-ready Gunicorn server
- No Flask debug mode in production
- `.gitignore` excludes sensitive files

⚠️ **Recommendations:**
- Add `FLASK_SECRET_KEY` if using sessions (set as Railway environment variable)
- Enable HTTPS (Railway provides by default)
- Add rate limiting for API endpoints (future enhancement)

## Support

**Railway Documentation:**
- [Railway Docs](https://docs.railway.app/)
- [Python Deployment Guide](https://docs.railway.app/guides/python)

**Project Issues:**
- [GitHub Issues](https://github.com/yunshenwuchuxun/dynamical-system-analyzer/issues)

---

**Deployment Checklist:**
- [ ] Repository pushed to GitHub
- [ ] Railway project created
- [ ] Environment variables configured (if needed)
- [ ] Application deployed successfully
- [ ] Health check passing
- [ ] Public URL accessible
- [ ] Static files loading correctly
- [ ] API endpoints responding

🚀 **Enjoy your deployed Dynamical System Analyzer!**
